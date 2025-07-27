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

// send friend request api function
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

    // Prevent sending request to yourself
    if (authenticatedUserId === targetUserId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'You cannot send friend request to yourself',
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
    if (currentUser.connections.includes(targetUserId)) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'Already friends with this user',
      })
    }

    // Check if friend request already sent
    if (currentUser.sentFriendRequests.includes(targetUserId)) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'Friend request already sent',
      })
    }

    // Check if friend request already received
    if (currentUser.receivedFriendRequests.includes(targetUserId)) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'Friend request already received from this user',
      })
    }

    // Send friend request
    currentUser.sentFriendRequests.push(targetUserId)
    targetUser.receivedFriendRequests.push(authenticatedUserId)

    await currentUser.save()
    await targetUser.save()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Friend request sent successfully',
    })
  } catch (error) {
    console.error('Error sending friend request:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error sending friend request',
    })
  }
}

// accept friend request api function
const handleAcceptFriendRequest = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { userId: requesterId } = req.params

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    if (!requesterId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Requester ID is required',
      })
    }

    // Get current user and requester
    const currentUser = await User.findById(authenticatedUserId)
    const requester = await User.findById(requesterId)

    if (!currentUser || !requester) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      })
    }

    // Check if friend request exists
    if (!currentUser.receivedFriendRequests.includes(requesterId)) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Friend request not found',
      })
    }

    // Add to connections for both users
    currentUser.connections.push(requesterId)
    requester.connections.push(authenticatedUserId)

    // Remove from friend requests
    currentUser.receivedFriendRequests =
      currentUser.receivedFriendRequests.filter(
        (id) => id.toString() !== requesterId
      )
    requester.sentFriendRequests = requester.sentFriendRequests.filter(
      (id) => id.toString() !== authenticatedUserId
    )

    await currentUser.save()
    await requester.save()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Friend request accepted successfully',
    })
  } catch (error) {
    console.error('Error accepting friend request:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error accepting friend request',
    })
  }
}

// reject friend request api function
const handleRejectFriendRequest = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { userId: requesterId } = req.params

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    if (!requesterId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Requester ID is required',
      })
    }

    // Get current user and requester
    const currentUser = await User.findById(authenticatedUserId)
    const requester = await User.findById(requesterId)

    if (!currentUser || !requester) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      })
    }

    // Check if friend request exists
    if (!currentUser.receivedFriendRequests.includes(requesterId)) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Friend request not found',
      })
    }

    // Remove from friend requests
    currentUser.receivedFriendRequests =
      currentUser.receivedFriendRequests.filter(
        (id) => id.toString() !== requesterId
      )
    requester.sentFriendRequests = requester.sentFriendRequests.filter(
      (id) => id.toString() !== authenticatedUserId
    )

    await currentUser.save()
    await requester.save()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Friend request rejected successfully',
    })
  } catch (error) {
    console.error('Error rejecting friend request:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error rejecting friend request',
    })
  }
}

// cancel friend request api function
const handleCancelFriendRequest = async (req, res) => {
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

    // Get current user and target user
    const currentUser = await User.findById(authenticatedUserId)
    const targetUser = await User.findById(targetUserId)

    if (!currentUser || !targetUser) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      })
    }

    // Check if friend request was sent
    if (!currentUser.sentFriendRequests.includes(targetUserId)) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Friend request not found',
      })
    }

    // Remove from friend requests
    currentUser.sentFriendRequests = currentUser.sentFriendRequests.filter(
      (id) => id.toString() !== targetUserId
    )
    targetUser.receivedFriendRequests =
      targetUser.receivedFriendRequests.filter(
        (id) => id.toString() !== authenticatedUserId
      )

    await currentUser.save()
    await targetUser.save()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Friend request cancelled successfully',
    })
  } catch (error) {
    console.error('Error cancelling friend request:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error cancelling friend request',
    })
  }
}

// get friend requests api function
const handleGetFriendRequests = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    const currentUser = await User.findById(authenticatedUserId)
      .populate('receivedFriendRequests', '_id fullName image email')
      .populate('sentFriendRequests', '_id fullName image email')

    if (!currentUser) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      })
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      receivedRequests: currentUser.receivedFriendRequests,
      sentRequests: currentUser.sentFriendRequests,
    })
  } catch (error) {
    console.error('Error getting friend requests:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error getting friend requests',
    })
  }
}

// Admin: Create user
const handleCreateUser = async (req, res) => {
  try {
    const { fullName, email, password, role = 'user' } = req.body

    if (!fullName || !email || !password) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Full name, email, and password are required',
      })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'User with this email already exists',
      })
    }

    // Hash password
    const hashedPassword = await require('../utils/hashedPassword')(password)

    // Create new user
    const newUser = await User.create({
      fullName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
    })

    const userResponse = {
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
    }

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: 'User created successfully',
      user: userResponse,
    })
  } catch (error) {
    console.error('Error creating user:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error creating user',
    })
  }
}

// Admin: Update user
const handleUpdateUser = async (req, res) => {
  try {
    const { userId } = req.params
    const { fullName, email, role, isActive } = req.body

    if (!userId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'User ID is required',
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      })
    }

    // Update fields if provided
    if (fullName) user.fullName = fullName
    if (email) user.email = email.toLowerCase()
    if (role) user.role = role
    if (typeof isActive === 'boolean') user.isActive = isActive

    await user.save()

    const userResponse = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      updatedAt: user.updatedAt,
    }

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'User updated successfully',
      user: userResponse,
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error updating user',
    })
  }
}

// Admin: Delete user
const handleDeleteUser = async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'User ID is required',
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      })
    }

    // Prevent admin from deleting themselves
    if (req.user.userId === userId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Admin cannot delete their own account',
      })
    }

    // Delete user (this will trigger cascading deletes)
    await user.remove()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'User deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error deleting user',
    })
  }
}

// User: Delete own profile
const handleDeleteOwnProfile = async (req, res) => {
  try {
    const { userId } = req.user

    if (!userId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      })
    }

    // Delete user (this will trigger cascading deletes)
    await user.remove()

    // Clear the authentication cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    })

    return res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Profile deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting profile:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error deleting profile',
    })
  }
}

// Admin: Get all users with details
const handleGetAllUsersAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalUsers = await User.countDocuments()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      users,
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalUsers,
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error fetching users',
    })
  }
}

module.exports = {
  handleGetAllUsers,
  handleUserSearch,
  handleGetUserById,
  handleAddFriend,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  handleCancelFriendRequest,
  handleGetFriendRequests,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  handleDeleteOwnProfile,
  handleGetAllUsersAdmin,
}
