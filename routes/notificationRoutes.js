const express = require('express')
const router = express.Router()

const {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  saveFcmToken,
} = require('../controllers/notifications')

const { authMiddleware } = require('../middleware/authMiddleware')

router.post('/token', authMiddleware, saveFcmToken)
router.get('/', authMiddleware, getUserNotifications)
router.patch('/:id/read', authMiddleware, markAsRead)
router.patch('/read-all/:userId', authMiddleware, markAllAsRead)
router.delete('/:id', authMiddleware, deleteNotification)

module.exports = router
