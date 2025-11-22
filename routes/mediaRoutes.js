const express = require('express')
const router = express.Router()
const streamToMicroservice = require('../middleware/streamToMicroservice')
const handleTempMedia = require('../controllers/media/handleTempMedia')
const handleDeleteTempMedia = require('../controllers/media/deleteTempMedia')
const { authMiddleware } = require('../middleware/authMiddleware')

router.post('/upload',authMiddleware, streamToMicroservice, handleTempMedia)
router.delete('/temp/:id', authMiddleware, handleDeleteTempMedia)

module.exports = router
