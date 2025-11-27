const { cloudinary } = require('../../utils/cloudinaryUploader')
const TempMedia = require('../../schema/tempMediaSchema')

const handleDeleteTempMedia = async (req, res) => {
  try {
    const { id } = req.params

    const media = await TempMedia.findById(id)

    if (!media) {
      return res.json({
        success: true,
        message: 'Already deleted',
      })
    }

    const publicId = media.publicId
    const resourceType = media.type === 'video' ? 'video' : 'image'

    console.log(`🗑 Deleting Cloudinary file (${resourceType}):`, publicId)

    try {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      })
    } catch (err) {
      console.error('⚠️ Cloudinary deletion failed (ignored):', err.message)
    }

    await media.deleteOne()

    return res.json({
      success: true,
      message: 'Temporary media deleted successfully',
    })
  } catch (err) {
    console.error('Delete temp media error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to delete temporary media',
    })
  }
}

module.exports = handleDeleteTempMedia
