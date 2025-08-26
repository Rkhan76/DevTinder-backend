const express = require('express')
const {
  userRegister,
  login,
  handleGoogleAuthCode,
  handleAuthCheck,
  handleLogout,
} = require('../controllers/auth')
const {
  handleAddPost,
  handleGetPost,
  handleGetAllPost,
  handleAddLikeOnPost,
  handleAddCommentOnPost,
  handleRepostsByUser,
} = require('../controllers/post')
const {
  authMiddleware,
  adminMiddleware,
} = require('../middleware/authMiddleware')
const { handleMediaUpload } = require('../middleware/upload')
const ChatMessage = require('../schema/chatSchema')
const { getChatHistory } = require('../controllers/chat')
const {
  handleGetAllUsers,
  handleUserSearch,
  handleGetUserById,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  handleDeleteOwnProfile,
  handleGetAllUsersAdmin,
  updateAboutSection,
} = require('../controllers/user')
const {
  handleGetPeopleYouMayKnow,
  handleSendFriendRequest,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  handleCancelFriendRequest,
  handleGetFriendRequests,
} = require('../controllers/friends')
const { getUserNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notifications')

const router = express.Router()

// auth related routes
router.post('/auth/register', userRegister)
router.post('/auth/login', login)
router.post('/auth/google', handleGoogleAuthCode)
router.get('/auth/check', authMiddleware, handleAuthCheck)
router.get('/auth/logout', authMiddleware, handleLogout)

// post related routes
router.post('/post/add', handleMediaUpload, authMiddleware, handleAddPost)

// post`s comment related routes
router.post('/post/:postId/comment', authMiddleware, handleAddCommentOnPost)

// this is route when in frontend user moved to its or others profile
router.get('/post/user/:userId', authMiddleware, handleGetPost)
router.get('/post/all', authMiddleware, handleGetAllPost)
router.patch('/post/:postId/like', authMiddleware, handleAddLikeOnPost)


// Add search route
router.get('/user/search', authMiddleware, handleUserSearch)

// this api send the people data who are not friends with the current user
router.get('/user/get-people-you-may-know', authMiddleware, handleGetPeopleYouMayKnow)

//this api is to get the list of the user who sents the friend requests
router.get('/user/friend-requests', authMiddleware, handleGetFriendRequests)

// User profile related routes
router.put('/profile/update-about', authMiddleware, updateAboutSection)

// user related routes
router.get('/user/all', authMiddleware, handleGetAllUsers)
router.get('/user/:userId', authMiddleware, handleGetUserById)


router.post('/user/add-friend/:userId', authMiddleware, handleSendFriendRequest)

// api for accept the friend requet
router.post('/user/accept-friend-request/:userId', authMiddleware, handleAcceptFriendRequest)

// api for reject the friend request by a user
router.post('/user/reject-friend-request/:userId', authMiddleware, handleRejectFriendRequest )

// api for cancel a friend request
router.post('/user/cancel-friend-request/:userId', authMiddleware, handleCancelFriendRequest)

router.delete('/user/profile', authMiddleware, handleDeleteOwnProfile)


// post related routes
router.post('/post/:postId/repost', authMiddleware, handleRepostsByUser)

// admin routes
router.get('/admin/users', adminMiddleware, handleGetAllUsersAdmin)
router.post('/admin/users', adminMiddleware, handleCreateUser)
router.put('/admin/users/:userId', adminMiddleware, handleUpdateUser)
router.delete('/admin/users/:userId', adminMiddleware, handleDeleteUser)

// Add chat history endpoint
router.get('/chat/:userId', authMiddleware, getChatHistory)

//notificatin


// ✅ Get  notification list
router.get('/notifications/get-notifications', authMiddleware, getUserNotifications)

// ✅ Mark a single notification as read
router.patch('/notifications/mark-as-read/:id', authMiddleware, markAsRead)

// ✅ Mark all notifications as read for logged-in user
router.patch('/notifications/mark-all-as-read/:userId', authMiddleware, markAllAsRead)

// ✅ Delete a single notification
router.delete('/notifications/delete/:id', authMiddleware, deleteNotification)



module.exports = router
