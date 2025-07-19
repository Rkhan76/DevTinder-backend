const express = require('express')
const { userRegister, login, handleGoogleAuthCode, handleAuthCheck, handleLogout } = require('../controllers/auth')
const { handleAddPost, handleGetPost } = require('../controllers/post')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

router.post('/auth/register', userRegister)
router.post('/auth/login', login)
router.post('/auth/google', handleGoogleAuthCode)
router.get('/auth/check', authMiddleware, handleAuthCheck)
router.get('/auth/logout', authMiddleware, handleLogout)

// add the post
router.post('/post/add',authMiddleware, handleAddPost)
router.get('/post/self',authMiddleware, handleGetPost)

module.exports = router
