const express = require('express')

const authRoutes = require('./authRoutes')
const postRoutes = require('./postRoutes')
const userRoutes = require('./userRoutes')
const friendRoutes = require('./friendRoutes')
const notificationRoutes = require('./notificationRoutes')
const chatRoutes = require('./chatRoutes')
const adminRoutes = require('./adminRoutes')
const otherRoutes = require('./otherRoutes')
const mediaRoutes = require('./mediaRoutes')

const router = express.Router()

// Group routes
router.use('/auth', authRoutes)
router.use('/posts', postRoutes)
router.use('/users', userRoutes)
router.use('/friends', friendRoutes)
router.use('/media', mediaRoutes)
router.use('/notifications', notificationRoutes)
router.use('/chats', chatRoutes)
router.use('/admin', adminRoutes)
router.use('/', otherRoutes)

module.exports = router
