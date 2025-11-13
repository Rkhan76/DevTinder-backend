const express = require('express')
const router = express.Router()

const {
  handleGetAllUsers,
  handleUserSearch,
  handleGetUserById,
  updateAboutSection,
  handleDeleteOwnProfile,
} = require('../controllers/user')

const { authMiddleware } = require('../middleware/authMiddleware')

// Users list
router.get('/', authMiddleware, handleGetAllUsers)

// Search
router.get('/search', authMiddleware, handleUserSearch)

// Profile update
router.put('/profile/about', authMiddleware, updateAboutSection)

// Delete own profile
router.delete('/profile', authMiddleware, handleDeleteOwnProfile)

// Get user by ID (last)
router.get('/:userId', authMiddleware, handleGetUserById)

module.exports = router
