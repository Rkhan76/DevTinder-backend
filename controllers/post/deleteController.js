// controllers/post/deleteController.js
const STATUS_CODES = require('../../utils/httpStatusCode')
const Post = require('../../schema/postSchema')

const handleDeletePost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params

    // Validate postId
    if (!postId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post ID is required',
      })
    }

    // Check if user is authenticated
    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized to perform this action',
      })
    }

    // Find the post and include deleted posts for this check
    const post = await Post.findOne({ _id: postId }).setOptions({
      includeDeleted: true,
    })

    // Check if post exists
    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Check if post is already deleted
    if (post.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post is already deleted',
      })
    }

    // Convert both IDs to string for comparison
    const postAuthorId = post.author.toString()
    const authUserId = authenticatedUserId.toString()

    // Check if user is the author of the post
    if (postAuthorId !== authUserId) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'You can only delete your own posts',
      })
    }

    // Soft delete the post
    const deletedPost = await Post.findByIdAndUpdate(
      postId,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    )

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Post deleted successfully',
      data: {
        postId: deletedPost._id,
        deletedAt: deletedPost.deletedAt,
      },
    })
  } catch (err) {
    console.error('Error deleting post:', err.message)

    if (err.name === 'CastError') {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid post ID format',
      })
    }

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while deleting the post',
      error: err.message,
    })
  }
}

const handleRestorePost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params

    const post = await Post.findOne({ _id: postId }).setOptions({
      includeDeleted: true,
    })

    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    if (!post.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post is not deleted',
      })
    }

    if (post.author.toString() !== authenticatedUserId) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'You can only restore your own posts',
      })
    }

    const restoredPost = await Post.findByIdAndUpdate(
      postId,
      {
        isDeleted: false,
        deletedAt: null,
      },
      { new: true }
    )

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Post restored successfully',
      data: restoredPost,
    })
  } catch (err) {
    console.error('Error restoring post:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while restoring the post',
      error: err.message,
    })
  }
}

const handlePermanentDeletePost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params

    const post = await Post.findOne({ _id: postId }).setOptions({
      includeDeleted: true,
    })

    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    if (post.author.toString() !== authenticatedUserId) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'You can only permanently delete your own posts',
      })
    }

    // Permanent deletion
    await Post.findByIdAndDelete(postId)

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Post permanently deleted',
    })
  } catch (err) {
    console.error('Error permanently deleting post:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while permanently deleting the post',
      error: err.message,
    })
  }
}

module.exports = {
  handleDeletePost,
  handleRestorePost,
  handlePermanentDeletePost,
}
