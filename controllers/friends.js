const STATUS_CODES = require('../utils/httpStatusCode')
const mongoose = require('mongoose')
const { sanitizePostContent } = require('../utils/senatizePostContent')
const Post = require('../schema/postSchema')
const User = require('../schema/userSchema')
const cloudinary = require('../config/cloudinary')
const uploadPostImage = require('../middleware/upload')
const uploadToCloudinary = require('../utils/cloudinaryUploader')

const handleGetPeopleYouMayKnow = async (req, res) => {
  try {
    const { userId: currentUserId } = req.user
    console.log('Current User ID:', currentUserId)

    const currentUser = await User.findById(currentUserId).select(
      'connections sentFriendRequests receivedFriendRequests'
    )

    if (!currentUser) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      })
    }

    // Build exclusion list
    const excludedIds = [
      currentUserId, // exclude self
      ...currentUser.connections,
      ...currentUser.sentFriendRequests,
      ...currentUser.receivedFriendRequests,
    ]

    // Pagination params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Count total possible suggestions
    const totalSuggestions = await User.countDocuments({
      _id: { $nin: excludedIds },
      isActive: true,
    })

    // Find paginated suggestions
    const suggestions = await User.find({
      _id: { $nin: excludedIds },
      isActive: true,
    })
      .select('fullName image currentRole company receivedFriendRequests')
      .skip(skip)
      .limit(limit)

    return res.status(STATUS_CODES.OK).json({
      success: true,
      data: suggestions,
      pagination: {
        total: totalSuggestions,
        page,
        totalPages: Math.ceil(totalSuggestions / limit),
        limit,
      },
    })
  } catch (error) {
    console.error('Error while fetching people you may know:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while fetching suggestions',
    })
  }
}

// This function sends a friend request
const handleSendFriendRequest = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { userId: targetUserId } = req.params

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid target user ID',
      })
    }

    if (authenticatedUserId.toString() === targetUserId.toString()) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'You cannot send friend request to yourself',
      })
    }

    const targetUser = await User.findById(targetUserId)
    if (!targetUser) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Target user not found',
      })
    }

    const currentUser = await User.findById(authenticatedUserId)
    if (!currentUser) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Current user not found',
      })
    }

    if (currentUser.connections.some((id) => id.toString() === targetUserId)) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'Already friends with this user',
      })
    }

    if (
      currentUser.sentFriendRequests.some(
        (id) => id.toString() === targetUserId
      )
    ) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'Friend request already sent',
      })
    }

    if (
      currentUser.receivedFriendRequests.some(
        (id) => id.toString() === targetUserId
      )
    ) {
      return res.status(STATUS_CODES.CONFLICT).json({
        success: false,
        message: 'Friend request already received from this user',
      })
    }

    // ✅ Transaction (recommended)
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      currentUser.sentFriendRequests.push(targetUserId)
      targetUser.receivedFriendRequests.push(authenticatedUserId)

      await currentUser.save({ session })
      await targetUser.save({ session })

      await session.commitTransaction()
    } catch (err) {
      await session.abortTransaction()
      throw err
    } finally {
      session.endSession()
    }

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
      .populate('receivedFriendRequests', '_id fullName image email currentRole')
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

module.exports = {
  handleGetPeopleYouMayKnow,
  handleSendFriendRequest,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  handleCancelFriendRequest,
  handleGetFriendRequests,
}
