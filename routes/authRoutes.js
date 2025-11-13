const express = require('express')
const router = express.Router()

const {
  userRegister,
  login,
  handleGoogleAuthCode,
  handleAuthCheck,
  handleLogout,
} = require('../controllers/auth')

const { authMiddleware } = require('../middleware/authMiddleware')

router.post('/register', userRegister)
router.post('/login', login)
router.post('/google', handleGoogleAuthCode)
router.get('/check', authMiddleware, handleAuthCheck)
router.get('/logout', authMiddleware, handleLogout)

module.exports = router
