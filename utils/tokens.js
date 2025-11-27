const jwt = require('jsonwebtoken')

const generateToken = (payload, options = { expiresIn: '7d' }) => {
  try {
    const secretKey = process.env.JWT_SECRET

    if (!secretKey) {
      throw new Error('SECRET_KEY is not defined in environment variables')
    }

    console.log('Payload:', payload)
    console.log('SecretKey:', secretKey)

    return jwt.sign(payload, secretKey, options)
  } catch (err) {
    console.error('Error while generating token:', err.message)
    return null
  }
}

const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/', // good practice
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}


module.exports = {
  generateToken,
  setTokenCookie,
}
