// controllers/post/repostController.js
const STATUS_CODES = require('../../utils/httpStatusCode')
const { sanitizePostContent } = require('../../utils/senatizePostContent')
const Post = require('../../schema/postSchema')
const { extractHashtags } = require('../../utils/FilterTheHashTags')
const uploadToCloudinary = require('../../utils/cloudinaryUploader')

const handleRepostsByUser = async (req, res) => {
  const { postId } = req.params
  const { message } = req.body
  const { userId } = req.user

  if (!postId || !userId) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Post ID and User ID are required',
    })
  }

  try {
    // Find the original post
    const originalPost = await Post.findById(postId)
    if (!originalPost) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Prevent reposting own post
    if (String(originalPost.author) === String(userId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'You cannot repost your own post',
      })
    }

    // Check if user already reposted this post
    const existingRepost = await Post.findOne({
      author: userId,
      repost: postId,
    })

    if (existingRepost) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'You already reposted this post',
      })
    }

    const safeContent = sanitizePostContent(message)
    const mediaFiles = req.files?.media || []
    const mediaArray = []

    for (const file of mediaFiles) {
      try {
        const uploadedMedia = await uploadToCloudinary(file)
        mediaArray.push(uploadedMedia)
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr)
      }
    }

    // Create a new post that references the original
    const repost = new Post({
      author: userId,
      content: safeContent,
      repost: postId,
      media: mediaArray,
      tags: extractHashtags(safeContent),
      visibility: originalPost.visibility,
      tags: originalPost.tags,
      mentions: originalPost.mentions,
    })

    await repost.save()

    // Increment shares count on original post
    originalPost.sharesCount += 1
    await originalPost.save()

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: 'Post reposted successfully',
      repost,
    })
  } catch (error) {
    console.error(error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Server error while reposting',
    })
  }
}

module.exports = {
  handleRepostsByUser,
}
