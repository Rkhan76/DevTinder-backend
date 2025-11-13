const express = require('express')
const router = express.Router()

const {
  handleGetPeopleYouMayKnow,
  handleSendFriendRequest,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  handleCancelFriendRequest,
  handleGetFriendRequests,
  suggestedFriends,
} = require('../controllers/friends/friends')

const { authMiddleware } = require('../middleware/authMiddleware')

// Recommendations
router.get('/recommendations', authMiddleware, handleGetPeopleYouMayKnow)
router.get('/suggestions', authMiddleware, suggestedFriends)

// Requests
router.get('/requests', authMiddleware, handleGetFriendRequests)
router.post('/requests/:userId', authMiddleware, handleSendFriendRequest)
router.post(
  '/requests/:userId/accept',
  authMiddleware,
  handleAcceptFriendRequest
)
router.post(
  '/requests/:userId/reject',
  authMiddleware,
  handleRejectFriendRequest
)
router.post(
  '/requests/:userId/cancel',
  authMiddleware,
  handleCancelFriendRequest
)

module.exports = router
