const axios = require('axios')
const Busboy = require('busboy')
const { PassThrough } = require('stream')

const streamToMicroservice = async (req, res, next) => {
  return new Promise((resolve, reject) => {
    console.log('🚀 START: streamToMicroservice middleware')

    let fileMimeType = null
    let fileFilename = null
    let passThroughStream = null

    let axiosCancelSource = null
    let responseSent = false

    let fileFullyUploaded = false
    let uploadCompleted = false
    let busboyFinished = false

    const bb = Busboy({ headers: req.headers })

    // ---------------------------------------------------------------
    // REAL CANCEL DETECTION (FOR FETCH STREAMING)
    // ---------------------------------------------------------------
    req.on('close', () => {
      console.warn('⚠️ req.close detected')

      // 🟢 CASE 1: Normal streaming → busboy finished reading data
      if (busboyFinished && fileFullyUploaded && !responseSent) {
        console.log('🔵 Normal request close — NOT cancel')
        return
      }

      // 🟢 CASE 2: Microservice done
      if (uploadCompleted) return

      // 🔴 CASE 3: REAL cancel (user aborted fetch)
      console.warn('⛔ REAL cancel detected — aborting streams')

      try {
        passThroughStream?.destroy()
      } catch {}
      try {
        axiosCancelSource?.cancel('Backend aborted')
      } catch {}

      if (!responseSent) {
        responseSent = true
        res
          .status(499)
          .json({ success: false, message: 'Upload canceled by user' })
      }
    })

    // ---------------------------------------------------------------
    // Busboy file detection
    // ---------------------------------------------------------------
    bb.on('file', (fieldname, file, info) => {
      console.log(`📁 File detected: ${info.filename}`)

      fileMimeType = info.mimeType
      fileFilename = info.filename

      passThroughStream = new PassThrough()
      let fileBytes = 0

      file.on('data', (chunk) => {
        fileBytes += chunk.length
        console.log(`📥 Chunk: +${chunk.length} bytes (total ${fileBytes})`)

        if (passThroughStream && !passThroughStream.destroyed) {
          passThroughStream.write(chunk)
        }
      })

      file.on('end', () => {
        console.log(`✅ File fully streamed (${fileBytes} bytes)`)
        fileFullyUploaded = true
        passThroughStream.end()
      })
    })

    // ---------------------------------------------------------------
    // Busboy finished
    // ---------------------------------------------------------------
    bb.on('finish', () => {
      console.log('🎉 Busboy finished parsing')
      busboyFinished = true

      if (!passThroughStream && !responseSent) {
        responseSent = true
        return res
          .status(400)
          .json({ success: false, message: 'No file uploaded' })
      }
    })

    // ---------------------------------------------------------------
    // Send stream to microservice
    // ---------------------------------------------------------------
    const startAxiosRequest = async () => {
      console.log('🚀 Sending stream to microservice...')

      const endpoint = fileMimeType.startsWith('video')
        ? process.env.OPTIMIZE_VIDEO_URL
        : process.env.OPTIMIZE_IMAGE_URL

      axiosCancelSource = axios.CancelToken.source()

      try {
        const response = await axios({
          method: 'post',
          url: process.env.MEDIA_OPTIMIZATION_MICROSERVICE_BASE_URL + endpoint,
          headers: {
            'Content-Type': fileMimeType,
            'X-Filename': fileFilename,
          },
          data: passThroughStream,
          cancelToken: axiosCancelSource.token,
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        })

        uploadCompleted = true

        if (!responseSent) {
          req.optimizedMediaData = response.data
          responseSent = true
          next()
          resolve()
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          console.warn('⛔ Axios canceled:', err.message)
          return
        }

        console.error('❌ Microservice error:', err.message)
        if (!responseSent) {
          responseSent = true
          res.status(500).json({
            success: false,
            message: 'Media processing failed',
            error: err.message,
          })
        }
        reject(err)
      }
    }

    req.pipe(bb)

    bb.on('file', () => startAxiosRequest())
  })
}

module.exports = streamToMicroservice
