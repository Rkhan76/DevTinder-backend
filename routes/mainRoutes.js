const express = require('express')
const { userRegister, login, handleGoogleAuthCode } = require('../controllers/auth')

const router = express.Router()

router.post('/user-register', userRegister)
router.post('/user-login', login)
router.post('/user-google-login', handleGoogleAuthCode)

module.exports = router
