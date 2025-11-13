// controllers/post/saveController.js
const STATUS_CODES = require('../../utils/httpStatusCode')
const Post = require('../../schema/postSchema')
const User = require('../../schema/userSchema')

const handleSavePost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params

    // Validate inputs
    if (!postId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post ID is required',
      })
    }

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized to perform this action',
      })
    }

    // Find the post
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Check if post is deleted
    if (post.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Cannot save a deleted post',
      })
    }

    const user = await User.findById(authenticatedUserId)
    const isAlreadySaved = user.savedPosts.includes(postId)

    let message

    if (isAlreadySaved) {
      // Unsave the post
      await User.findByIdAndUpdate(authenticatedUserId, {
        $pull: { savedPosts: postId },
      })

      await Post.findByIdAndUpdate(postId, {
        $pull: { bookmarkedBy: authenticatedUserId },
      })

      message = 'Post unsaved successfully'
    } else {
      // Save the post
      await User.findByIdAndUpdate(authenticatedUserId, {
        $addToSet: { savedPosts: postId },
      })

      await Post.findByIdAndUpdate(postId, {
        $addToSet: { bookmarkedBy: authenticatedUserId },
      })

      message = 'Post saved successfully'
    }

    // Get updated post and user info
    const updatedPost = await Post.findById(postId)
    const updatedUser = await User.findById(authenticatedUserId).populate(
      'savedPosts'
    )

    res.status(STATUS_CODES.OK).json({
      success: true,
      message,
      data: {
        isSaved: !isAlreadySaved,
        savesCount: updatedPost.bookmarkedBy.length,
        savedPosts: updatedUser.savedPosts,
      },
    })
  } catch (err) {
    console.error('Error saving post:', err.message)

    if (err.name === 'CastError') {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid post ID format',
      })
    }

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while saving the post',
      error: err.message,
    })
  }
}

const handleGetSavedPosts = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    const user = await User.findById(authenticatedUserId).populate({
      path: 'savedPosts',
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
          path: 'comments.user',
          select: '_id fullName image',
        },
      ],
    })

    // Filter out deleted posts
    const validSavedPosts = user.savedPosts.filter((post) => !post.isDeleted)

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: validSavedPosts,
      count: validSavedPosts.length,
    })
  } catch (err) {
    console.error('Error fetching saved posts:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while fetching saved posts',
      error: err.message,
    })
  }
}

module.exports = {
  handleSavePost,
  handleGetSavedPosts,
}
