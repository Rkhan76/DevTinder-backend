const cron = require('node-cron')
const TempMedia = require('../schema/tempMediaSchema')
const cloudinary = require('../config/cloudinary')

// Every 1 minute
cron.schedule('*/20 * * * *', async () => {
  console.log('🧹 Running temp media cleanup...')

  try {
    const expired = await TempMedia.find({
      expiresAt: { $lt: Date.now() },
      status: 'pending',
    })

    for (const media of expired) {
      try {
        console.log('Deleting Cloudinary ID:', media.publicId)

        const result = await cloudinary.uploader.destroy(media.publicId, {
          resource_type: media.type === 'video' ? 'video' : 'image',
        })

        console.log('Cloudinary response:', result)

        await media.deleteOne()

        console.log(`🗑 Deleted ghost media: ${media.publicId}`)
      } catch (err) {
        console.error('❌ Failed to clean media:', err.message)
      }
    }
  } catch (err) {
    console.error('❌ Error running cleanup cron:', err.message)
  }
})

module.exports = {}
