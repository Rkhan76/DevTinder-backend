const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  thumbnail: {
    type: String, // Only for video, optional
  },
})

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    content: {
      type: String,
      default: null,
    },

    media: {
      type: [mediaSchema],
      default: [],
    },

    tags: {
      type: [String],
      default: [],
    },

    mentions: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    location: {
      type: String,
      default: null,
    },

    visibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public',
    },

    likesCount: {
      type: Number,
      default: 0,
    },

    commentsCount: {
      type: Number,
      default: 0,
    },

    sharesCount: {
      type: Number,
      default: 0,
    },

    isEdited: {
      type: Boolean,
      default: false,
    },

    likedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },
    repost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post', 
      default: null,
    },

    bookmarkedBy: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: [],
    },

    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
)

const Post = mongoose.model('Post', postSchema)
module.exports = Post
