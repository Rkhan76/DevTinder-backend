const cloudinary = require('../config/cloudinary')

const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'posts',
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          reject(error)
        } else {
          const mediaData = {
            url: result.secure_url,
            type: result.resource_type === 'video' ? 'video' : 'image',
            thumbnail:
              result.resource_type === 'video' ? result.secure_url : undefined,
          }
          resolve(mediaData)
        }
      }
    )
    stream.end(file.buffer)
  })
}

module.exports = uploadToCloudinary
