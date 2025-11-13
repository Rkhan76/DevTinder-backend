// controllers/post/likeController.js
const STATUS_CODES = require('../../utils/httpStatusCode')
const Post = require('../../schema/postSchema')
const User = require('../../schema/userSchema')
const { createNotification } = require('../notifications')
const { sendNotification } = require('../../utils/notification')

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

      // Send notification (only if not liking own post)
      if (String(post.author) !== String(userId)) {
        const sender = await User.findById(userId).select('fullName')

        // Save in DB
        await createNotification({
          recipient: post.author,
          sender: userId,
          type: 'like',
          content: `${sender.fullName} liked your post ❤️`,
          link: `/posts/${post._id}`,
          repost: null,
        })

        // Send push notification
        await sendNotification(
          post.author,
          {
            title: 'liked',
            body: `${sender.fullName} liked your post ❤️`,
          },
          {
            type: 'LIKE',
            postId: post._id.toString(),
            senderId: userId.toString(),
          }
        )
      }
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

module.exports = {
  handleAddLikeOnPost,
}
