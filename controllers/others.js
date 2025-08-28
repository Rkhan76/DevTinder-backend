const STATUS_CODES = require('../utils/httpStatusCode')
const mongoose = require('mongoose')
const User = require('../schema/userSchema')
const Notification = require('../schema/notificationSchema')
const { createNotification } = require('./notifications')

const getNavbarCounts = async (req, res) => {
  try {
    const { userId } = req.user

    // 1. Count unread notifications
    const unreadNotifications = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    })

    // 2. Count unread chats (if you have ChatMessage schema)
    // const unreadChats = await ChatMessage.countDocuments({
    //   recipient: userId,
    //   isRead: false,
    // })
    const unreadChats = 0 // placeholder if not implemented yet

    // 3. Count pending friend requests → from receivedFriendRequests array
    const user = await User.findById(userId).select('receivedFriendRequests')
    const pendingRequests = user?.receivedFriendRequests?.length || 0

    return res.json({
      success: true,
      counts: {
        notifications: unreadNotifications,
        chats: unreadChats,
        friendRequests: pendingRequests,
      },
    })
  } catch (err) {
    console.error('Error fetching navbar counts:', err)
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching counts',
    })
  }
}
 

module.exports = {
    getNavbarCounts
}