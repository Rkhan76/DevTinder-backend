const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
  const token = req.cookies.token
 

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized: No token' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // attach to req
    next()
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: 'Unauthorized: Invalid token' })
  }
}

module.exports = {
  authMiddleware
}
