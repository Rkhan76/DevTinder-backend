const validator = require('validator')
const User = require('../schema/userSchema')
const hashPassword = require('../utils/hashedPassword')
const STATUS_CODES = require('../utils/httpStatusCode')
const matchPassword = require('../utils/passwordChecks')
const { generateToken, setTokenCookie } = require('../utils/tokens')
const axios = require('axios')

const userRegister = async (req, res) => {
  const { email, password } = req.body

  // Input Validation
  if (!email || !password) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'All fields are required',
    })
  }

  // Email Validation
  if (!validator.isEmail(email)) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Invalid email format',
    })
  }

  // Password Validation
  if (!validator.isLength(password, { min: 8 })) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Password must be at least 8 characters',
    })
  }

  // Additional password strength checks (optional)
  if (
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
  ) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message:
        'Password must contain at least 1 uppercase, 1 lowercase, 1 number, and 1 symbol',
    })
  }

  try {
    // Normalize email to lowercase to prevent duplicate accounts
    const normalizedEmail = validator.normalizeEmail(email)

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail })
    if (existingUser) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'User already exists',
      })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new user
    const newUser = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
    })

    // Omit password from response
    const userResponse = {
      _id: newUser._id,
      email: newUser.email,
      createdAt: newUser.createdAt,
    }

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: 'Registration successful',
      data: userResponse,
    })
  } catch (err) {
    console.error('Registration error:', err)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Registration failed due to server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    })
  }
}

const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'All fields are required',
    })
  }

  if (!validator.isEmail(email)) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Invalid email format',
    })
  }

  try {
    const user = await User.findOne({ email })
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User does not exist',
      })
    }

    const isMatch = matchPassword(password, user.password)
    if (!isMatch) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Please enter valid credentials',
      })
    }

    const { password: _, ...safeUser } = user.toObject()
    const token = generateToken({
      userId: user._id,
      email: user.email,
    })

    // 🍪 Set HTTP-only cookie
    setTokenCookie(res, token)

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Successfully logged in',
      data: {
        user: safeUser,
      },
    })
  } catch (err) {
    console.error(err)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong on the server',
      error: err.message,
    })
  }
}


const handleGoogleAuthCode = async (req, res) => {
  console.log('🌐 Handling Google auth code')

  const { code } = req.body
  if (!code)
    return res.status(STATUS_CODES.BAD_REQUEST).json({ error: 'Missing code' })

  try {
    // 1. Exchange auth code for tokens
    const tokenResponse = await axios.post(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'postmessage',
        grant_type: 'authorization_code',
      }
    )

    const { access_token, id_token } = tokenResponse.data

    // 2. Get user info from Google
    const userInfo = await axios.get(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    )

    const { email, name, picture, sub } = userInfo.data
    const normalizedEmail = validator.normalizeEmail(email)

    // 3. Check if user exists
    let user = await User.findOne({ email: normalizedEmail })

    if (!user) {
      // 4. Create new user
      user = await User.create({
        email: normalizedEmail,
        name,
        image: picture,
        googleId: sub,
        password: null,
      })

      console.log('✅ New user created:', user.email)
    } else {
      console.log('🔁 Existing user:', user.email)
    }

    // 5. Generate JWT token
    const token = generateToken({
      userId: user._id,
      email: user.email,
    })

    // 6. Send response
    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        image: user.image,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    console.error(
      '❌ Error in Google login:',
      err.response?.data || err.message
    )
    return res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: 'Google login failed',
      error: err.message,
    })
  }
}

const handleAuthCheck = (req, res) => {
  console.log("auth chck comr")
  res.status(200).json({ success: true, user: req.user })
}

const handleLogout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: false, // set true in production with HTTPS
    sameSite: 'lax',
  })
  return res.status(200).json({ success: true, message: 'Logged out successfully' })
}



module.exports = {
  userRegister,
  login,
  handleGoogleAuthCode,
  handleAuthCheck,
  handleLogout,
}
