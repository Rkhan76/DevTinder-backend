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


    const searchRegex = new RegExp(query, 'i')

    const users = await User.find({
      $or: [
        { fullName: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    }).select('_id fullName username image email')


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

// update the user about section
const updateAboutSection = async (req, res) => {
  try {
    const {userId} = req.user 
    const {
      bio,
      currentRole,
      currentCompany,
      skills,
      experience,
      education,
      location,
      interests,
      headline
    } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        bio,
        currentRole,
        currentCompany,
        skills,
        experience,
        education,
        location,
        interests,
        headline
      },
      { new: true, runValidators: true }
    ).select('-password') // exclude sensitive fields

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({
      success: false,
      message: 'Something went wrong while updating profile',
    })
  }
}

module.exports = {
  handleGetAllUsers,
  handleUserSearch,
  handleGetUserById,
  handleCreateUser,
  handleUpdateUser,
  handleDeleteUser,
  handleDeleteOwnProfile,
  handleGetAllUsersAdmin,
  updateAboutSection,
}
