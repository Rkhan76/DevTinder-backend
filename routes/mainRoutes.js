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
  handleAddFriend,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  handleCancelFriendRequest,
  handleGetFriendRequests,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  handleDeleteOwnProfile,
  handleGetAllUsersAdmin,
} = require('../controllers/user')

const router = express.Router()

// auth related routes
router.post('/auth/register', userRegister)
router.post('/auth/login', login)
router.post('/auth/google', handleGoogleAuthCode)
router.get('/auth/check', authMiddleware, handleAuthCheck)
router.get('/auth/logout', authMiddleware, handleLogout)

// post related routes
router.post('/post/add', handleMediaUpload, authMiddleware, handleAddPost)

// this is route when in frontend user moved to its or others profile
router.get('/post/user/:userId', authMiddleware, handleGetPost)
router.get('/post/all', authMiddleware, handleGetAllPost)
router.patch('/post/:postId/like', authMiddleware, handleAddLikeOnPost)
router.post('/post/:postId/comment', authMiddleware, handleAddCommentOnPost)

// Add search route
router.get('/user/search', authMiddleware, handleUserSearch)

// user related routes
router.get('/user/all', authMiddleware, handleGetAllUsers)
router.get('/user/:userId', authMiddleware, handleGetUserById)
router.post('/user/add-friend/:userId', authMiddleware, handleAddFriend)
router.post(
  '/user/accept-friend-request/:userId',
  authMiddleware,
  handleAcceptFriendRequest
)
router.post(
  '/user/reject-friend-request/:userId',
  authMiddleware,
  handleRejectFriendRequest
)
router.post(
  '/user/cancel-friend-request/:userId',
  authMiddleware,
  handleCancelFriendRequest
)
router.get('/user/friend-requests', authMiddleware, handleGetFriendRequests)
router.delete('/user/profile', authMiddleware, handleDeleteOwnProfile)

// admin routes
router.get('/admin/users', adminMiddleware, handleGetAllUsersAdmin)
router.post('/admin/users', adminMiddleware, handleCreateUser)
router.put('/admin/users/:userId', adminMiddleware, handleUpdateUser)
router.delete('/admin/users/:userId', adminMiddleware, handleDeleteUser)

// Add chat history endpoint
router.get('/chat/:userId', authMiddleware, getChatHistory)

module.exports = router
