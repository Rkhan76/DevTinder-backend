const express = require('express')
const { userRegister, login, handleGoogleAuthCode, handleAuthCheck, handleLogout } = require('../controllers/auth')
const { handleAddPost, handleGetPost, handleGetAllPost, handleAddLikeOnPost, handleAddCommentOnPost } = require('../controllers/post')
const { authMiddleware } = require('../middleware/authMiddleware')

const router = express.Router()

// auth related routes
router.post('/auth/register', userRegister)
router.post('/auth/login', login)
router.post('/auth/google', handleGoogleAuthCode)
router.get('/auth/check', authMiddleware, handleAuthCheck)
router.get('/auth/logout', authMiddleware, handleLogout)

// post related routes
router.post('/post/add',authMiddleware, handleAddPost)
router.get('/post/self',authMiddleware, handleGetPost)
router.get('/post/all', authMiddleware, handleGetAllPost)
router.patch('/post/:postId/like', authMiddleware, handleAddLikeOnPost)
router.post('/post/:postId/comment', authMiddleware, handleAddCommentOnPost)


module.exports = router
