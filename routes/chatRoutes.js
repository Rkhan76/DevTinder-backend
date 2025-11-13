const express = require('express')
const router = express.Router()

const { getChatHistory } = require('../controllers/chat')
const { authMiddleware } = require('../middleware/authMiddleware')

router.get('/:userId', authMiddleware, getChatHistory)

module.exports = router
