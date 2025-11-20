const mongoose = require('mongoose')

const tempMediaSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true }, // image or video
  },
  { timestamps: true }
)

module.exports = mongoose.model('TempMedia', tempMediaSchema)
