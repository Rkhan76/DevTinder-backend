// controllers/post/commentController.js
const STATUS_CODES = require('../../utils/httpStatusCode')
const Post = require('../../schema/postSchema')
const User = require('../../schema/userSchema')
const { createNotification } = require('../notifications')
const { getIO } = require('../../sockets/socket')

const handleAddCommentOnPost = async (req, res) => {
  try {
    const { postId } = req.params
    const { userId } = req.user
    const { text } = req.body

    if (!postId || !userId || !text) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Create new comment subdocument
    const newComment = {
      user: userId,
      text,
      createdAt: new Date(),
    }

    // Push comment & update count
    post.comments.push(newComment)
    post.commentsCount += 1
    await post.save()

    // Fetch user details for immediate return
    const user = await User.findById(userId).select('_id fullName image')

    const commentToSend = {
      _id: post.comments[post.comments.length - 1]._id,
      text: newComment.text,
      createdAt: newComment.createdAt,
      user,
    }

    // Emit the comment in real-time to all clients in the post room
    const io = getIO()
    io.to(postId).emit('receiveComment', commentToSend)

    // Create notification if commenter is not the post author
    if (String(post.author) !== String(userId)) {
      const notification = await createNotification({
        recipient: post.author,
        sender: userId,
        type: 'comment',
        content: `${user.fullName} commented on your post`,
        link: `/post/${postId}`,
      })

      // Emit real-time notification
      io.to(post.author.toString()).emit('receiveNotification', {
        _id: notification._id,
        content: notification.content,
        sender: {
          _id: user._id,
          fullName: user.fullName,
          image: user.image,
        },
        link: notification.link,
        type: notification.type,
        createdAt: notification.createdAt,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      comment: commentToSend,
      commentsCount: post.commentsCount,
    })
  } catch (err) {
    console.error('Error adding comment:', err)
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while adding the comment',
    })
  }
}

module.exports = {
  handleAddCommentOnPost,
}
