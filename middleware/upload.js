const multer = require('multer')
const { STATUS_CODES } = require('../utils/httpStatusCode')

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif', // Images
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm', // Videos
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(
      new Error(
        'Invalid file type. Only images (JPEG, PNG, WEBP, GIF) and videos (MP4, MOV, AVI, WEBM) are allowed'
      ),
      false
    )
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max per file
    files: 10, // Max 10 files per request
  },
}).fields([
  { name: 'media', maxCount: 10 }, // Main media field
  { name: 'cover', maxCount: 1 }, // Optional video cover image
])

const handleMediaUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      let message = err.message

      if (err.code === 'LIMIT_FILE_SIZE') {
        message = `File too large. Maximum size is 100MB`
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        message = 'Maximum 10 files allowed per post'
      }

      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message,
      })
    }

    // Convert single file to array for consistent processing
    if (req.file) {
      req.files = { media: [req.file] }
    }

    next()
  })
}

module.exports = {handleMediaUpload}
