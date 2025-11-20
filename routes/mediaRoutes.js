const express = require('express')
const router = express.Router()
const streamToMicroservice = require('../middleware/streamToMicroservice')
const handleTempMedia = require('../controllers/media/handleTempMedia')
const { authMiddleware } = require('../middleware/authMiddleware')

router.post('/upload',authMiddleware, streamToMicroservice, handleTempMedia)
router.delete('/temp/:id', require('../controllers/media/deleteTempMedia'))

module.exports = router
