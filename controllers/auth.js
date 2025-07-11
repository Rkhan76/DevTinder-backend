const validator = require('validator')
const User = require('../schema/userSchema')
const hashPassword = require('../utils/hashedPassword')
const STATUS_CODES = require('../utils/httpStatusCode')
const matchPassword = require('../utils/passwordChecks')
const { generateToken } = require('../utils/tokens')

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

  // Email format validation
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
        message: 'User does not exists',
      })
    }
    console.log(typeof user, ' type of user of mongo')
    // console.log(typeof user, ' type of user of mongo')

    if (matchPassword(password, user.password)) {
      const { password: _, ...safeUser } = user.toObject()

      return res.status(STATUS_CODES.OK).json({
        success: true,
        message: 'You have successfully loggedIn',
        data: {
          user: safeUser,
          token: generateToken(safeUser),
        },
      })
    } else {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'Please enter the valid credentials',
       
      })
    }
  } catch (err) {
    console.log(err)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'There is something gone wrong with the server',
      error: err,
    })
  }
}

module.exports = {
  userRegister,
  login,
}
