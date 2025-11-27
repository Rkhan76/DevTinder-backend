const TempMedia = require('../../schema/tempMediaSchema')

const handletempmedia = async (req, res) => {
  try {
    const { userId } = req.user
    const data = req.optimizedMediaData

    if (!data || !data.publicId || !data.url) {
      return res.status(400).json({
        success: false,
        message: 'Missing media metadata from microservice',
      })
    }

    // Fix incorrect type sent by microservice
    const safeType =
      data.type === 'video' || data.type === 'image'
        ? data.type
        : data.resource_type === 'video'
        ? 'video'
        : 'image'

    const media = await TempMedia.create({
      userId,
      url: data.url,
      publicId: data.publicId,
      playbackUrl: data.playbackUrl || null,
      type: safeType,

      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
      duration: data.duration,

      status: 'pending',
      expiresAt: Date.now() + 1 * 60 * 1000,
    })

    return res.status(201).json({
      success: true,
      tempMediaId: media._id,
      url: media.url,
      type: media.type,
      publicId: media.publicId,
      duration: media.duration,
      width: media.width,
      height: media.height,
      playbackUrl: media.playbackUrl,
    })
  } catch (err) {
    console.error('Temp media save error:', err)
    return res.status(500).json({
      success: false,
      message: 'Failed to save temporary media',
    })
  }
}

module.exports = handletempmedia
