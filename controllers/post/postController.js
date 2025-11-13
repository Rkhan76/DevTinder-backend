// controllers/post/postController.js
const STATUS_CODES = require('../../utils/httpStatusCode')
const { sanitizePostContent } = require('../../utils/senatizePostContent')
const Post = require('../../schema/postSchema')
const { extractHashtags } = require('../../utils/FilterTheHashTags')
const uploadToCloudinary = require('../../utils/cloudinaryUploader')

const handleAddPost = async (req, res) => {
  try {
    const { content } = req.body
    const { userId } = req.user

    if (!userId || !content) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Please provide valid input',
      })
    }

    const safeContent = sanitizePostContent(content)
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

    const newPost = await Post.create({
      author: userId,
      content: safeContent,
      media: mediaArray,
      tags: extractHashtags(safeContent),
    })

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: 'Post created successfully',
      post: newPost,
    })
  } catch (error) {
    console.error('Error while creating post:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while creating the post',
    })
  }
}

const handleGetPost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { userId: requestedUserId } = req.params

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    const targetUserId = requestedUserId || authenticatedUserId
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const posts = await Post.find({ author: targetUserId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', '_id email image fullName headline')
      .populate('likedBy', '_id fullName image')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          model: 'User',
          select: '_id email fullName image',
        },
      })
      .populate({
        path: 'repost',
        populate: [
          {
            path: 'author',
            select: '_id fullName email image headline',
          },
          {
            path: 'likedBy',
            select: '_id fullName image',
          },
          {
            path: 'comments',
            populate: {
              path: 'user',
              model: 'User',
              select: '_id email fullName image',
            },
          },
        ],
      })

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: posts,
      currentPage: page,
      nextPage: posts.length === limit ? page + 1 : null,
    })
  } catch (err) {
    console.error('Error fetching posts:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while fetching posts',
      error: err.message,
    })
  }
}

const handleGetSinglePostById = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    if (!postId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post ID is required',
      })
    }

    const post = await Post.findById(postId)
      .populate('author', '_id email image fullName headline')
      .populate('likedBy', '_id fullName image')
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          model: 'User',
          select: '_id email fullName image',
        },
      })
      .populate({
        path: 'repost',
        populate: [
          {
            path: 'author',
            select: '_id fullName email image headline',
          },
          {
            path: 'likedBy',
            select: '_id fullName image',
          },
          {
            path: 'comments',
            populate: {
              path: 'user',
              model: 'User',
              select: '_id email fullName image',
            },
          },
        ],
      })

    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: post,
    })
  } catch (err) {
    console.error('Error fetching post:', err.message)

    if (err.name === 'CastError') {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid post ID format',
      })
    }

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while fetching the post',
      error: err.message,
    })
  }
}

const handleGetAllPost = async (req, res) => {
  try {
    const { userId } = req.user

    if (!userId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const posts = await Post.find({ author: { $ne: userId } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', '_id email fullName image headline')
      .populate('likedBy', '_id fullName image')
      .populate({
        path: 'comments.user',
        select: '_id email fullName image headline',
        model: 'User',
      })
      .populate({
        path: 'repost',
        populate: [
          {
            path: 'author',
            select: '_id fullName email image headline',
          },
          {
            path: 'likedBy',
            select: '_id fullName image',
          },
          {
            path: 'comments',
            populate: {
              path: 'user',
              model: 'User',
              select: '_id email fullName image',
            },
          },
        ],
      })
      .lean()

      console.log("Post fetch by user feed ", posts)

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: posts,
      currentPage: page,
      nextPage: posts.length === limit ? page + 1 : null,
    })
  } catch (err) {
    console.error('Error fetching posts:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while fetching posts',
      error: err.message,
    })
  }
}

module.exports = {
  handleAddPost,
  handleGetPost,
  handleGetAllPost,
  handleGetSinglePostById,
}
