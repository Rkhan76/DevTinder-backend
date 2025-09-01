const admin = require('../config/firebase')
const User = require('../schema/userSchema') 

/**
 * Send a push notification to a specific user
 * @param {String} toUserId - ID of the recipient
 * @param {Object} notification - { title: string, body: string }
 * @param {Object} data - extra custom data (optional)
 */
async function sendNotification(toUserId, notification, data = {}) {

  try {
    const user = await User.findById(toUserId)
  
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('No tokens found for this user')
      return
    }


    const payload = {
      notification, // { title, body }
      data, // extra custom data for frontend
    }


    // 2. Send to all tokens of the user
   const response = await admin.messaging().sendEachForMulticast({
     tokens: user.fcmTokens,
     notification: payload.notification,
     data: payload.data,
   })

   console.log('FCM Response:', JSON.stringify(response, null, 2))

    // 3. Cleanup expired tokens
    response.responses.forEach((result, index) => {
  if (result.error) {
    const errorCode = result.error.code
    if (errorCode === 'messaging/registration-token-not-registered') {
      console.log('Removing expired token:', user.fcmTokens[index])
      user.fcmTokens.splice(index, 1)
    }
  }
})

    await user.save()
    console.log('Notification sent successfully')
  } catch (err) {
    console.error('Error sending notification:', err)
  }
}

module.exports = { sendNotification }
