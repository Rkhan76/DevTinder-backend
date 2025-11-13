const express = require('express')
const router = express.Router()

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

const { authMiddleware } = require('../middleware/authMiddleware')
const { handleMediaUpload } = require('../middleware/upload')

// Create post
router.post('/', authMiddleware, handleMediaUpload, handleAddPost)

// Feed
router.get('/', authMiddleware, handleGetAllPost)

// Posts of a user
router.get('/user/:userId', authMiddleware, handleGetPost)

// Interactions
router.patch('/:postId/like', authMiddleware, handleAddLikeOnPost)
router.post('/:postId/comments', authMiddleware, handleAddCommentOnPost)
router.post('/:postId/reposts', authMiddleware, handleRepostsByUser)
router.post('/:postId/save', authMiddleware, handleSavePost)

// Saved posts
router.get('/saved', authMiddleware, handleGetSavedPosts)

// Delete post
router.delete('/:postId', authMiddleware, handleDeletePost)

// Get one post (must be last)
router.get('/:postId', authMiddleware, handleGetSinglePostById)

module.exports = router
