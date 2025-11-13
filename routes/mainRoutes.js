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
  handleGetSinglePostById,
  handleDeletePost,
  handleSavePost,
  handleGetSavedPosts,
} = require('../controllers/post')

const {
  authMiddleware,
  adminMiddleware,
} = require('../middleware/authMiddleware')

const { handleMediaUpload } = require('../middleware/upload')

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
  suggestedFriends,
} = require('../controllers/friends/friends')

const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  saveFcmToken,
} = require('../controllers/notifications')

const { getNavbarCounts } = require('../controllers/others')

const router = express.Router()

/* ============================
   AUTH ROUTES
============================ */
router.post('/auth/register', userRegister)
router.post('/auth/login', login)
router.post('/auth/google', handleGoogleAuthCode)
router.get('/auth/check', authMiddleware, handleAuthCheck)
router.get('/auth/logout', authMiddleware, handleLogout)

/* ============================
   POST ROUTES (specific first)
============================ */
router.post('/post/add', handleMediaUpload, authMiddleware, handleAddPost)
router.get('/post/all', authMiddleware, handleGetAllPost)
router.get('/post/user/:userId', authMiddleware, handleGetPost)

router.post('/post/:postId/comment', authMiddleware, handleAddCommentOnPost)
router.post('/post/:postId/repost', authMiddleware, handleRepostsByUser)
router.patch('/post/:postId/like', authMiddleware, handleAddLikeOnPost)
router.post('/post/:postId/save', authMiddleware, handleSavePost)
router.delete('/post/:postId', authMiddleware, handleDeletePost)

// must be last post route
router.get('/post/:postId', authMiddleware, handleGetSinglePostById)

/* ============================
   USER ROUTES
============================ */
router.get('/user/all', authMiddleware, handleGetAllUsers)
router.get('/user/search', authMiddleware, handleUserSearch)
router.get('/user/saved-posts', authMiddleware, handleGetSavedPosts)
router.put('/profile/update-about', authMiddleware, updateAboutSection)
router.delete('/user/profile', authMiddleware, handleDeleteOwnProfile)

/* ============================
   FRIEND ROUTES
   (Must come BEFORE /user/:userId)
============================ */
router.get(
  '/user/get-people-you-may-know',
  authMiddleware,
  handleGetPeopleYouMayKnow
)
router.get('/user/suggested-friends',authMiddleware, suggestedFriends)
router.get('/user/friend-requests', authMiddleware, handleGetFriendRequests)
router.post('/user/add-friend/:userId', authMiddleware, handleSendFriendRequest)
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

/* ============================
   USER ROUTE (Dynamic last)
============================ */
router.get('/user/:userId', authMiddleware, handleGetUserById)

/* ============================
   NOTIFICATIONS
============================ */
router.post('/notifications/save-fcm-token', authMiddleware, saveFcmToken)
router.get(
  '/notifications/get-notifications',
  authMiddleware,
  getUserNotifications
)
router.patch('/notifications/mark-as-read/:id', authMiddleware, markAsRead)
router.patch(
  '/notifications/mark-all-as-read/:userId',
  authMiddleware,
  markAllAsRead
)
router.delete('/notifications/delete/:id', authMiddleware, deleteNotification)

/* ============================
   CHAT ROUTES
============================ */
router.get('/chat/:userId', authMiddleware, getChatHistory)

/* ============================
   ADMIN ROUTES
============================ */
router.get('/admin/users', adminMiddleware, handleGetAllUsersAdmin)
router.post('/admin/users', adminMiddleware, handleCreateUser)
router.put('/admin/users/:userId', adminMiddleware, handleUpdateUser)
router.delete('/admin/users/:userId', adminMiddleware, handleDeleteUser)

/* ============================
   OTHERS
============================ */
router.get('/activity-counts', authMiddleware, getNavbarCounts)

module.exports = router
