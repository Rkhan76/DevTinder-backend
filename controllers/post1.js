const STATUS_CODES = require('../utils/httpStatusCode')
const { sanitizePostContent } = require('../utils/senatizePostContent')
const Post = require('../schema/postSchema')
const User = require('../schema/userSchema')
const cloudinary = require('../config/cloudinary')
const uploadPostImage = require('../middleware/upload')
const uploadToCloudinary = require('../utils/cloudinaryUploader')
const { createNotification } = require('./notifications')
const { sendNotification } = require('../utils/notification') // ✅ Import Firebase notification helper
const { getIO } = require('../sockets/socket')
const { extractHashtags } = require('../utils/FilterTheHashTags')

const handleAddPost = async (req, res) => {
  try {
    const { content } = req.body
    const { userId } = req.user

    if (!userId || !content) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Please provide valid input',
      })
    }

    const safeContent = sanitizePostContent(content)
    const mediaFiles = req.files?.media || []

    const mediaArray = []

    for (const file of mediaFiles) {
      try {
        const uploadedMedia = await uploadToCloudinary(file)
        mediaArray.push(uploadedMedia)
      } catch (uploadErr) {
        console.error('Cloudinary upload error:', uploadErr)
      }
    }

    const newPost = await Post.create({
      author: userId,
      content: safeContent,
      media: mediaArray,
      tags: extractHashtags(safeContent)
    })

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: 'Post created successfully',
      post: newPost,
    })
  } catch (error) {
    console.error('Error while creating post:', error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while creating the post',
    })
  }
}

const handleGetPost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { userId: requestedUserId } = req.params

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    // Use requested userId if provided, otherwise use authenticated user's ID
    const targetUserId = requestedUserId || authenticatedUserId

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const posts = await Post.find({ author: targetUserId })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate('author', '_id email image fullName headline') // populate author details
      .populate('likedBy', '_id fullName image') // populate liked by users
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          model: 'User',
          select: '_id email fullName image',
        },
      })
      .populate({
        path: 'repost', // Populate the original post
        populate: [
          {
            path: 'author', // Populate author of the reposted post
            select: '_id fullName email image headline',
          },
          {
            path: 'likedBy', // Populate likes on that reposted post
            select: '_id fullName image',
          },
          {
            path: 'comments', // Populate comments in reposted post
            populate: {
              path: 'user',
              model: 'User',
              select: '_id email fullName image',
            },
          },
        ],
      })
      

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: posts,
      currentPage: page,
      nextPage: posts.length === limit ? page + 1 : null,
    })
  } catch (err) {
    console.error('Error fetching posts:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while fetching posts',
      error: err.message,
    })
  }
}

const handleGetSinglePostById = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params // Changed from userId to postId

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    if (!postId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post ID is required',
      })
    }

    const post = await Post.findById(postId)
      .populate('author', '_id email image fullName headline') // populate author details
      .populate('likedBy', '_id fullName image') // populate liked by users
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          model: 'User',
          select: '_id email fullName image',
        },
      })
      .populate({
        path: 'repost', // Populate the original post
        populate: [
          {
            path: 'author', // Populate author of the reposted post
            select: '_id fullName email image headline',
          },
          {
            path: 'likedBy', // Populate likes on that reposted post
            select: '_id fullName image',
          },
          {
            path: 'comments', // Populate comments in reposted post
            populate: {
              path: 'user',
              model: 'User',
              select: '_id email fullName image',
            },
          },
        ],
      })


    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: post, // Single post object instead of array
    })
  } catch (err) {
    console.error('Error fetching post:', err.message)

    if (err.name === 'CastError') {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid post ID format',
      })
    }

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while fetching the post',
      error: err.message,
    })
  }
}



const handleGetAllPost = async (req, res) => {
  try {
    const { userId } = req.user

    if (!userId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

   

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit


    const posts = await Post.find({ author: { $ne: userId } })
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit)
      .populate('author', '_id email fullName image headline') // populate if needed
      .populate('likedBy', '_id fullName image')
      .populate({
        path: 'comments.user',
        select: '_id email fullName image headline', // include all necessary user fields
        model: 'User',
      })
      .populate({
        path: 'repost', // Populate the original post
        populate: [
          {
            path: 'author', // Populate author of the reposted post
            select: '_id fullName email image headline',
          },
          {
            path: 'likedBy', // Populate likes on that reposted post
            select: '_id fullName image',
          },
          {
            path: 'comments', // Populate comments in reposted post
            populate: {
              path: 'user',
              model: 'User',
              select: '_id email fullName image',
            },
          },
        ],
      })
      .lean()

    

      


    res.status(STATUS_CODES.OK).json({
      success: true,
      data: posts,
      currentPage: page,
      nextPage: posts.length === limit ? page + 1 : null,
    })
  } catch (err) {
    console.error('Error fetching posts:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while fetching posts',
      error: err.message,
    })
  }
}

const handleAddLikeOnPost = async (req, res) => {
  try {
    const { postId } = req.params
    const { userId } = req.user

    if (!postId || !userId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post ID and User ID are required',
      })
    }

    const post = await Post.findById(postId)
    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    const hasLiked = post.likedBy.includes(userId)

    if (hasLiked) {
      // Unlike
      post.likedBy.pull(userId)
      post.likesCount -= 1
    } else {
      // Like
      post.likedBy.push(userId)
      post.likesCount += 1

      // 🔔 Send notification (only if not liking own post)
      if (String(post.author) !== String(userId)) {
        const sender = await User.findById(userId).select('fullName')

        // 1️⃣ Save in DB
        await createNotification({
          recipient: post.author,
          sender: userId,
          type: 'like',
          content: `${sender.fullName} liked your post ❤️`,
          link: `/posts/${post._id}`,
          repost: null,
        })

        // 2️⃣ Send push notification
        await sendNotification(
          post.author, // recipientId
          {
            title: 'liked',
            body: `${sender.fullName} liked your post ❤️`,
          },
          {
            type: 'LIKE',
            postId: post._id.toString(),
            senderId: userId.toString(),
          }
        )
      }
    }

    await post.save()

    return res.status(STATUS_CODES.OK).json({
      success: true,
      liked: !hasLiked,
      likesCount: post.likesCount,
    })
  } catch (err) {
    console.error('Error in liking post:', err)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while liking the post',
    })
  }
}



const handleAddCommentOnPost = async (req, res) => {
  try {
    const { postId } = req.params
    const { userId } = req.user
    const { text } = req.body

    if (!postId || !userId || !text) {
      return res
        .status(400)
        .json({ success: false, message: 'Missing required fields' })
    }

    const post = await Post.findById(postId)
    if (!post)
      return res.status(404).json({ success: false, message: 'Post not found' })

    // Create new comment subdocument
    const newComment = {
      user: userId,
      text,
      createdAt: new Date(),
    }

    // Push comment & update count
    post.comments.push(newComment)
    post.commentsCount += 1
    await post.save()

    // Fetch user details for immediate return
    const user = await User.findById(userId).select('_id fullName image')

    const commentToSend = {
      _id: post.comments[post.comments.length - 1]._id,
      text: newComment.text,
      createdAt: newComment.createdAt,
      user,
    }

    // 🔴 Emit the comment in real-time to all clients in the post room
    const io = getIO()
    io.to(postId).emit('receiveComment', commentToSend)

    // ✅ Create notification if commenter is not the post author
    if (String(post.author) !== String(userId)) {
      const notification = await createNotification({
        recipient: post.author,
        sender: userId,
        type: 'comment',
        content: `${user.fullName} commented on your post`,
        link: `/post/${postId}`,
      })

      // Emit real-time notification
      io.to(post.author.toString()).emit('receiveNotification', {
        _id: notification._id,
        content: notification.content,
        sender: {
          _id: user._id,
          fullName: user.fullName,
          image: user.image,
        },
        link: notification.link,
        type: notification.type,
        createdAt: notification.createdAt,
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Comment added successfully',
      comment: commentToSend,
      commentsCount: post.commentsCount,
    })
  } catch (err) {
    console.error('Error adding comment:', err)
    return res
      .status(500)
      .json({
        success: false,
        message: 'Something went wrong while adding the comment',
      })
  }
}

const handleRepostsByUser = async (req, res) => {
  const { postId } = req.params
  const { message} = req.body
  const { userId } = req.user // from auth middleware

  if (!postId || !userId) {
    return res.status(STATUS_CODES.BAD_REQUEST).json({
      success: false,
      message: 'Post ID and User ID are required',
    })
  }

  try {
    // Find the original post
    const originalPost = await Post.findById(postId)
    if (!originalPost) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Prevent reposting own post
    if (String(originalPost.author) === String(userId)) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'You cannot repost your own post',
      })
    }

    // Check if user already reposted this post
    const existingRepost = await Post.findOne({
      author: userId,
      repost: postId,
    })

    if (existingRepost) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'You already reposted this post',
      })
    }

     const safeContent = sanitizePostContent(message)
     const mediaFiles = req.files?.media || []

     const mediaArray = []

     for (const file of mediaFiles) {
       try {
         const uploadedMedia = await uploadToCloudinary(file)
         mediaArray.push(uploadedMedia)
       } catch (uploadErr) {
         console.error('Cloudinary upload error:', uploadErr)
       }
     }

    // Create a new post that references the original
    const repost = new Post({
      author: userId,
      content: safeContent,
      repost: postId,
      media: mediaArray,
      tags: extractHashtags(safeContent),
      visibility: originalPost.visibility,
      tags: originalPost.tags,
      mentions: originalPost.mentions,
    })

    await repost.save()

    // Increment shares count on original post
    originalPost.sharesCount += 1
    await originalPost.save()

    return res.status(STATUS_CODES.CREATED).json({
      success: true,
      message: 'Post reposted successfully',
      repost,
    })
  } catch (error) {
    console.error(error)
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Server error while reposting',
    })
  }
}

// Function to delete the post by its owner (soft delete)
const handleDeletePost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params

    

    // Validate postId
    if (!postId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post ID is required',
      })
    }

    // Check if user is authenticated
    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized to perform this action',
      })
    }

    // Find the post and include deleted posts for this check
    const post = await Post.findOne({ _id: postId }).setOptions({
      includeDeleted: true,
    })

    // Check if post exists
    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Check if post is already deleted
    if (post.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post is already deleted',
      })
    }

    // Convert both IDs to string for comparison
    const postAuthorId = post.author.toString()
    const authUserId = authenticatedUserId.toString() // Convert to string

    // Check if user is the author of the post
    if (postAuthorId !== authUserId) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'You can only delete your own posts',
      })
    }

    // Soft delete the post
    const deletedPost = await Post.findByIdAndUpdate(
      postId,
      {
        isDeleted: true,
        deletedAt: new Date(),
      },
      { new: true }
    )

    console.log('Deleted post:', deletedPost)

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Post deleted successfully',
      data: {
        postId: deletedPost._id,
        deletedAt: deletedPost.deletedAt,
      },
    })
  } catch (err) {
    console.error('Error deleting post:', err.message)

    // Handle invalid ObjectId
    if (err.name === 'CastError') {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid post ID format',
      })
    }

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while deleting the post',
      error: err.message,
    })
  }
}

// Function to restore a soft-deleted post
const handleRestorePost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params

    const post = await Post.findOne({ _id: postId }).setOptions({ includeDeleted: true })

    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    if (!post.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post is not deleted',
      })
    }

    if (post.author.toString() !== authenticatedUserId) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'You can only restore your own posts',
      })
    }

    const restoredPost = await Post.findByIdAndUpdate(
      postId,
      {
        isDeleted: false,
        deletedAt: null,
        // Restore original content if you saved it elsewhere
        // content: post.originalContent,
      },
      { new: true }
    )

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Post restored successfully',
      data: restoredPost,
    })

  } catch (err) {
    console.error('Error restoring post:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while restoring the post',
      error: err.message,
    })
  }
}

// Function to permanently delete a post (hard delete)
const handlePermanentDeletePost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params

    const post = await Post.findOne({ _id: postId }).setOptions({ includeDeleted: true })

    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    if (post.author.toString() !== authenticatedUserId) {
      return res.status(STATUS_CODES.FORBIDDEN).json({
        success: false,
        message: 'You can only permanently delete your own posts',
      })
    }

    // Permanent deletion
    await Post.findByIdAndDelete(postId)

    res.status(STATUS_CODES.OK).json({
      success: true,
      message: 'Post permanently deleted',
    })

  } catch (err) {
    console.error('Error permanently deleting post:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while permanently deleting the post',
      error: err.message,
    })
  }
}

// Save or unsave a post (toggle functionality)
const handleSavePost = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user
    const { postId } = req.params

    // Validate inputs
    if (!postId) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Post ID is required',
      })
    }

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized to perform this action',
      })
    }

    // Find the post
    const post = await Post.findById(postId)
    if (!post) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: 'Post not found',
      })
    }

    // Check if post is deleted
    if (post.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Cannot save a deleted post',
      })
    }

    const user = await User.findById(authenticatedUserId)
    const isAlreadySaved = user.savedPosts.includes(postId)

    let savedPost
    let message

    if (isAlreadySaved) {
      // Unsave the post
      await User.findByIdAndUpdate(
        authenticatedUserId,
        { $pull: { savedPosts: postId } }
      )
      
      await Post.findByIdAndUpdate(
        postId,
        { $pull: { bookmarkedBy: authenticatedUserId } }
      )

      message = 'Post unsaved successfully'
    } else {
      // Save the post
      await User.findByIdAndUpdate(
        authenticatedUserId,
        { $addToSet: { savedPosts: postId } } // $addToSet prevents duplicates
      )
      
      await Post.findByIdAndUpdate(
        postId,
        { $addToSet: { bookmarkedBy: authenticatedUserId } }
      )

      message = 'Post saved successfully'
    }

    // Get updated post and user info
    const updatedPost = await Post.findById(postId)
    const updatedUser = await User.findById(authenticatedUserId).populate('savedPosts')

    res.status(STATUS_CODES.OK).json({
      success: true,
      message,
      data: {
        isSaved: !isAlreadySaved,
        savesCount: updatedPost.bookmarkedBy.length,
        savedPosts: updatedUser.savedPosts
      }
    })

  } catch (err) {
    console.error('Error saving post:', err.message)

    if (err.name === 'CastError') {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: 'Invalid post ID format',
      })
    }

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while saving the post',
      error: err.message,
    })
  }
}

// Get all saved posts for a user
const handleGetSavedPosts = async (req, res) => {
  try {
    const { userId: authenticatedUserId } = req.user

    if (!authenticatedUserId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: 'You are not authorized',
      })
    }

    const user = await User.findById(authenticatedUserId)
      .populate({
        path: 'savedPosts',
        populate: [
          {
            path: 'author',
            select: '_id fullName email image headline'
          },
          {
            path: 'likedBy',
            select: '_id fullName image'
          },
          {
            path: 'comments.user',
            select: '_id fullName image'
          }
        ]
      })

    // Filter out deleted posts (in case they were saved before deletion)
    const validSavedPosts = user.savedPosts.filter(post => !post.isDeleted)

    res.status(STATUS_CODES.OK).json({
      success: true,
      data: validSavedPosts,
      count: validSavedPosts.length
    })

  } catch (err) {
    console.error('Error fetching saved posts:', err.message)
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Something went wrong while fetching saved posts',
      error: err.message,
    })
  }
}


module.exports = {
  handleAddPost,
  handleGetPost,
  handleGetAllPost,
  handleAddLikeOnPost,
  handleAddCommentOnPost,
  handleRepostsByUser,
  handleGetSinglePostById,
  handleDeletePost,
  handleSavePost,
}
