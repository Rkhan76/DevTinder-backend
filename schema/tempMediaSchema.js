const mongoose = require('mongoose')

const TempMediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    url: { type: String, required: true },
    publicId: { type: String, required: true },
    playbackUrl: { type: String, default: null },

    type: {
      type: String,
      enum: ['image', 'video'],
      required: true,
    },

    width: Number,
    height: Number,
    format: String,
    bytes: Number,
    duration: Number,

    // pending → ghost, used → user published it
    status: {
      type: String,
      enum: ['pending', 'used'],
      default: 'pending',
    },

    // Expiry → only used by cron (NOT MongoDB TTL)
    expiresAt: {
      type: Date,
      required: true,
      default: () => Date.now() + 2 * 60 * 1000, // 5 minutes
    },
  },
  { timestamps: true }
)

// ❌ IMPORTANT: REMOVE TTL INDEX
// DO NOT auto-delete DB entries, otherwise Cloudinary files cannot be deleted.
// ❌ Remove the line below:
// TempMediaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TempMedia', TempMediaSchema)
