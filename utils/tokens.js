const jwt = require('jsonwebtoken')

const generateToken = (payload, options = { expiresIn: '7d' }) => {
  try {
    const secretKey = process.env.SECRET_KEY

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

module.exports = {
  generateToken,
}
