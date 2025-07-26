const User = require('../schema/userSchema')
const STATUS_CODES = require('../utils/httpStatusCode')

const handleGetAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password')
    res.status(200).json({
      success: true,
      users,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
    })
  }
}

const handleUserSearch = async (req, res) => {
  try {
    const { query } = req.query

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(200).json({ success: true, users: [] }) // return empty if no query
    }

    console.log('query', query)

    const searchRegex = new RegExp(query, 'i')

    const users = await User.find({
      $or: [
        { fullName: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    }).select('_id fullName username image email')

    console.log('users', users)

    return res.status(200).json({ success: true, users })
  } catch (error) {
    console.error('User search error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to search users',
    })
  }
}

const handleGetUserById = async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'User ID is required',
      })
    }

    const user = await User.findById(userId).select('-password -googleId')

    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      user,
    })
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching user',
    })
  }
}

const handleAddFriend = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { userId: targetUserId } = req.params

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    if (!targetUserId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Target user ID is required',
      })
    }

    // Prevent adding yourself as a friend
    if (authenticatedUserId === targetUserId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'You cannot add yourself as a friend',
      })
    }

    // Check if target user exists
    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Target user not found',
      })
    }

    // Get current user
    const currentUser = await User.findById(authenticatedUserId)
    if (!currentUser) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Current user not found',
      })
    }

    // Check if already friends
    if (currentUser.connectons.includes(targetUserId)) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'Already friends with this user',
      })
    }

    // Add friend to connections
    currentUser.connectons.push(targetUserId)
    await currentUser.save()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Friend added successfully',
      connections: currentUser.connectons,
    })
  } catch (error) {
    console.error('Error adding friend:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error adding friend',
    })
  }
}

module.exports = {
  handleGetAllUsers,
  handleUserSearch,
  handleGetUserById,
  handleAddFriend,
}
