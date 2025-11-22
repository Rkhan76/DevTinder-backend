const mongoose = require('mongoose')

const tempMediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    url: { type: String, required: true },
    publicId: { type: String, required: true }, // REQUIRED FOR DELETE
    playbackUrl: { type: String },
    type: { type: String, enum: ['image', 'video'], required: true },
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
    duration: Number,
  },
  { timestamps: true }
)

module.exports = mongoose.model('TempMedia', tempMediaSchema)
