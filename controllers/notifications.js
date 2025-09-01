const Notification = require('../schema/notificationSchema')
const User = require('../schema/userSchema')

// ✅ Create a new notification
const createNotification = async ({
  recipient,
  sender,
  type,
  content,
  link,
  repost,
}) => {
  try {
    const notification = new Notification({
      recipient,
      sender,
      type,
      content,
      link,
      repost,
    })

    await notification.save()
    return notification // ✅ just return, don’t send res here
  } catch (error) {
    throw new Error(error.message) // ✅ throw error back to caller
  }
}

// ✅ Get all notifications for a user
const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.user

    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name image')
      .populate('repost', 'content createdAt')
      .sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      notifications,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ✅ Mark a single notification as read
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    )

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: 'Notification not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ✅ Mark all notifications as read for a user
const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true }
    )

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// ✅ Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params

    const notification = await Notification.findByIdAndDelete(id)

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: 'Notification not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}


// Save Firebase Token
const saveFcmToken = async (req, res) => {


  try {
    const {userId} = req.user // assuming you are using auth middleware (JWT)
    const { token: fcmToken } = req.body

    

    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' })
    }

    // Update or save the token
     const user = await User.findByIdAndUpdate(
       userId,
       { $addToSet: { fcmTokens: fcmToken } },
       { new: true }
     )


    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({
      message: 'FCM token saved successfully',
      fcmToken: user.fcmToken,
    })
  } catch (error) {
    console.error('Error saving FCM token:', error)
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message })
  }
}


module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  saveFcmToken,
}
