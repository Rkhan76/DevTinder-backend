const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      required: false, // Now optional
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
    },
    fullName: {
      type: String,
    },
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    connections: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    sentFriendRequests: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    receivedFriendRequests: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    // ✅ New Profile Fields
    bio: {
      type: String,
      default: '',
      maxlength: 500,
    },
    currentCompany: {
      type: String,
      default: '',
    },
    currentRole: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      default: '',
    },
    education: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    interests: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

// Pre-remove middleware to handle cascading deletes
userSchema.pre('remove', async function (next) {
  try {
    const Post = mongoose.model('Post')
    const ChatMessage = mongoose.model('ChatMessage')

    // Delete all posts by this user
    await Post.deleteMany({ author: this._id })

    // Delete all chat messages where this user is sender or receiver
    await ChatMessage.deleteMany({
      $or: [{ sender: this._id }, { receiver: this._id }],
    })

    // Remove this user from other users' connections and friend requests
    await mongoose.model('User').updateMany(
      {},
      {
        $pull: {
          connections: this._id,
          sentFriendRequests: this._id,
          receivedFriendRequests: this._id,
        },
      }
    )

    // Remove this user from posts' likedBy and bookmarkedBy arrays
    await Post.updateMany(
      {},
      {
        $pull: {
          likedBy: this._id,
          bookmarkedBy: this._id,
          mentions: this._id,
        },
      }
    )

    // Remove comments by this user from posts
    await Post.updateMany(
      { 'comments.user': this._id },
      {
        $pull: {
          comments: { user: this._id },
        },
      }
    )

    next()
  } catch (error) {
    next(error)
  }
})

const User = mongoose.model('User', userSchema)

module.exports = User
