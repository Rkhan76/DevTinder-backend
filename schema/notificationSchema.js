const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Notification kis user ko mila
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Kisne trigger kiya (friend request, like, comment, repost, etc.)
      required: false,
    },
    type: {
      type: String,
      enum: [
        'friend_request',
        'friend_accept',
        'friend_reject',
        'like',
        'comment',
        'mention',
        'job',
        'system',
        'repost', // ✅ Added new type
      ],
      required: true,
    },
    content: {
      type: String,
      required: false, // Human-readable text (e.g., "Alex reposted your post")
    },
    link: {
      type: String,
      required: false, // Redirect link (post/profile/job etc.)
    },
    repost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post', // ✅ Jis post ko repost kiya gaya
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
)

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification
