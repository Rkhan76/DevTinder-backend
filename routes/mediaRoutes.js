const express = require('express')
const router = express.Router()
const streamToMicroservice = require('../middleware/streamToMicroservice')
const handletempmedia = require('../controllers/media/handletempmedia')
const handleDeleteTempMedia = require('../controllers/media/deleteTempMedia')
const { authMiddleware } = require('../middleware/authMiddleware')

router.post('/upload',authMiddleware, streamToMicroservice, handletempmedia)
router.delete('/temp/:id', authMiddleware, handleDeleteTempMedia)

module.exports = router
