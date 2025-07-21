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


    const posts = await Post.find({ author: userId })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate('author', '_id email image fullName') // populate if needed
      .populate('likedBy', '_id fullName image')
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
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate('author', '_id email fullName image') // populate if needed
      .populate('likedBy', '_id fullName image')
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

const handleAddLikeOnPost = async (req, res) => {
  try {
    const { postId } = req.params
    const { userId } = req.user

    if (!postId || !userId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post ID and User ID are required',
      })
    }

    const post = await Post.findById(postId)

    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    const hasLiked = post.likedBy.includes(userId)

    if (hasLiked) {
      // Unlike
      post.likedBy.pull(userId)
      post.likesCount -= 1
    } else {
      // Like
      post.likedBy.push(userId)
      post.likesCount += 1
    }

    await post.save()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      liked: !hasLiked,
      likesCount: post.likesCount,
    })
  } catch (err) {
    console.error('Error in liking post:', err)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while liking the post',
    })
  }
}


const handleAddCommentOnPost = async (req, res) => {
  try {
    const { postId } = req.params
    const { userId } = req.user
    const { text } = req.body

    if (!postId || !userId || !text) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Missing required fields',
      })
    }

    const post = await Post.findById(postId)

    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    const newComment = {
      user: userId,
      text,
    }

    post.comments.push(newComment)
    post.commentsCount += 1

    await post.save()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
      commentsCount: post.commentsCount,
    })
  } catch (err) {
    console.error('Error adding comment:', err)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while adding the comment',
    })
  }
}


module.exports = {
  handleAddPost,
  handleGetPost,
  handleGetAllPost,
  handleAddLikeOnPost,
  handleAddCommentOnPost,
}

