const axios = require('axios')
const Busboy = require('busboy')
const { PassThrough } = require('stream')

const streamToMicroservice = async (req, res, next) => {
  return new Promise((resolve, reject) => {
    console.log('🚀 START: Middleware called')

    let fileMimeType = null
    let fileFilename = null
    let passThroughStream = null
    let fileProcessingStarted = false

    const bb = Busboy({ headers: req.headers })

    bb.on('file', (fieldname, file, info) => {
      console.log('🎬 FILE EVENT FIRED - Busboy detected file')
      fileMimeType = info.mimeType
      fileFilename = info.filename

      // Create pass-through stream
      passThroughStream = new PassThrough()

      let fileBytes = 0
      file.on('data', (chunk) => {
        if (!fileProcessingStarted) {
          fileProcessingStarted = true
          console.log('🟢 First chunk received - starting axios request')
          startAxiosRequest()
        }
        fileBytes += chunk.length
        console.log(
          `📥 File stream: ${chunk.length} bytes, Total: ${fileBytes}`
        )

        if (passThroughStream && !passThroughStream.destroyed) {
          passThroughStream.write(chunk)
        }
      })

      file.on('end', () => {
        console.log(`✅ FILE.END: ${fileBytes} total bytes`)
        if (passThroughStream && !passThroughStream.destroyed) {
          passThroughStream.end()
        }
      })

      file.on('error', (err) => {
        console.error('❌ File error:', err)
        if (passThroughStream && !passThroughStream.destroyed) {
          passThroughStream.destroy(err)
        }
        reject(err)
      })
    })

    bb.on('finish', () => {
      console.log('🎉 BUSBOY.FINISH: Form parsing completed')
      if (!passThroughStream) {
        res.status(400).json({ success: false, message: 'No file uploaded' })
        reject(new Error('No file'))
      }
    })

    const startAxiosRequest = async () => {
      console.log('🚀 Starting axios request to microservice...')

      const endpoint = fileMimeType.startsWith('video')
        ? process.env.OPTIMIZE_VIDEO_URL
        : process.env.OPTIMIZE_IMAGE_URL

      console.log('📍 Endpoint:', endpoint)

      try {
        const response = await axios({
          method: 'post',
          url: `${process.env.MEDIA_OPTIMIZATION_MICROSERVICE_BASE_URL}${endpoint}`,
          headers: {
            'Content-Type': fileMimeType,
            'X-Filename': fileFilename,
          },
          data: passThroughStream,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 600000,
          responseType: 'json',
        })

        console.log('✅ Microservice response received')

        // Store full metadata
        req.optimizedMediaData = {
          url: response.data.url,
          publicId: response.data.publicId,
          playbackUrl: response.data.playbackUrl,
          type: response.data.type,
          width: response.data.width,
          height: response.data.height,
          format: response.data.format,
          bytes: response.data.bytes,
          duration: response.data.duration,
        }

        next()
        resolve()
      } catch (err) {
        console.error('❌ Microservice error:', err.message)
        res.status(500).json({ success: false, message: 'Processing failed' })
        reject(err)
      }
    }

    req.pipe(bb)
  })
}

module.exports = streamToMicroservice
