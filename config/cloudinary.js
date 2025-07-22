// config/cloudinary.js
const { v2: cloudinary } = require('cloudinary')
require('dotenv').config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Verify configuration
cloudinary.api
  .ping()
  .then(() => console.log('Cloudinary connected'))
  .catch((err) => console.error('Cloudinary connection failed:', err))

module.exports = cloudinary
