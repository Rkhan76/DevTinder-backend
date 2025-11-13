const express = require('express')
const router = express.Router()

const { getNavbarCounts } = require('../controllers/others')
const { authMiddleware } = require('../middleware/authMiddleware')

router.get('/activity-counts', authMiddleware, getNavbarCounts)

module.exports = router
