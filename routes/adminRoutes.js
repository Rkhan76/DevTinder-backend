const express = require('express')
const router = express.Router()

const {
  handleGetAllUsersAdmin,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
} = require('../controllers/user')

const { adminMiddleware } = require('../middleware/authMiddleware')

// Admin only routes
router.get('/users', adminMiddleware, handleGetAllUsersAdmin)
router.post('/users', adminMiddleware, handleCreateUser)
router.put('/users/:userId', adminMiddleware, handleUpdateUser)
router.delete('/users/:userId', adminMiddleware, handleDeleteUser)

module.exports = router
