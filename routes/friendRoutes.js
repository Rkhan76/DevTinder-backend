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
  getFriendsByIds,
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

// Get the list of the friend
router.post('friendlist/by-ids', authMiddleware, getFriendsByIds)
module.exports = router
