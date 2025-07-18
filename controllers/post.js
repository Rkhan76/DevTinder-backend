const STATUS_CODES = require('../utils/httpStatusCode')
const { sanitizePostContent } = require('../utils/senatizePostContent')
const Post = require('../schema/postSchema') 

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

    // Sanitize the post content
    const safeContent = sanitizePostContent(content)

    // Create the post directly using Mongoose create
    const newPost = await Post.create({
      content: safeContent,
      author: userId,
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
      message: 'Something went wrong while creating post',
    })
  }
}

const handleGetPost = async (req, res) => {
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

    const posts = await Post.find({author: userId})
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate('author', '_id username profilePic') // populate if needed
      .lean()

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
}
