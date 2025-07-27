const jwt = require('jsonwebtoken')
const User = require('../schema/userSchema')

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized: No token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user details including role
    const user = await User.findById(decoded.userId).select(
      '_id email role isActive'
    )

    if (!user || !user.isActive) {
      return res
        .status(401)
        .json({
          success: false,
          message: 'Unauthorized: User not found or inactive',
        })
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized: Invalid token' })
  }
}

const adminMiddleware = async (req, res, next) => {
  try {
    // First check if user is authenticated
    await authMiddleware(req, res, (err) => {
      if (err) return next(err)
    })

    // Then check if user is admin
    if (req.user.role !== 'admin') {
      return res
        .status(403)
        .json({ success: false, message: 'Forbidden: Admin access required' })
    }

    next()
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Unauthorized' })
  }
}

module.exports = {
  authMiddleware,
  adminMiddleware,
}
