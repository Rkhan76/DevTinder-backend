const express = require('express')
const { userRegister, login, handleGoogleAuthCode } = require('../controllers/auth')

const router = express.Router()

router.post('/auth/register', userRegister)
router.post('/auth/login', login)
router.post('/auth/google', handleGoogleAuthCode)

module.exports = router
