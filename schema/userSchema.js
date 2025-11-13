const mongoose = require('mongoose');

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
      required: false, // Optional for OAuth users
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    fullName: {
      type: String,
      trim: true,
    },

    image: {
      type: String,
    },

    // 🧩 Role-based access
    role: {
      type: String,
      enum: ['user', 'admin', 'superadmin'],
      default: 'user',
    },

    // 🧠 For audit trail (who created this account)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for self-registration
    },

    // ✅ Permission flags (optional but useful for fine-grained control)
    permissions: {
      canDeleteUsers: { type: Boolean, default: false },
      canManagePosts: { type: Boolean, default: false },
      canCreateAdmins: { type: Boolean, default: false },
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // 🧑‍🤝‍🧑 Connections and Requests
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

    // 📝 Profile Information
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
    headline: {
      type: String,
      default: '',
    },

    fcmTokens: {
      type: [String],
      default: [],
    },

    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
  },
  {
    timestamps: true,
  }
)

// 🧹 Cascade delete middleware
userSchema.pre('remove', async function (next) {
  try {
    const Post = mongoose.model('Post');
    const ChatMessage = mongoose.model('ChatMessage');

    await Post.deleteMany({ author: this._id });
    await ChatMessage.deleteMany({
      $or: [{ sender: this._id }, { receiver: this._id }],
    });

    await mongoose.model('User').updateMany(
      {},
      {
        $pull: {
          connections: this._id,
          sentFriendRequests: this._id,
          receivedFriendRequests: this._id,
        },
      }
    );

    await Post.updateMany(
      {},
      {
        $pull: {
          likedBy: this._id,
          bookmarkedBy: this._id,
          mentions: this._id,
        },
      }
    );

    await Post.updateMany(
      { 'comments.user': this._id },
      { $pull: { comments: { user: this._id } } }
    );

    next();
  } catch (error) {
    next(error);
  }
});

const User = mongoose.model('User', userSchema);
module.exports = User;
