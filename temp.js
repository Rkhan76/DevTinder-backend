// scripts/addIsDeletedField.js
const mongoose = require('mongoose')
require('dotenv').config() // If you're using dotenv

const addIsDeletedField = async () => {
  try {
    // Connect to your database
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    console.log('Connected to MongoDB')

    // Get the Post model (adjust the path as needed)
    const Post = require('./schema/postSchema')

    // Update all posts that don't have isDeleted field
    const result = await Post.updateMany(
      {
        $or: [
          { isDeleted: { $exists: false } },
          { deletedAt: { $exists: false } },
        ],
      },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
        },
      }
    )

    console.log(`✅ Successfully updated ${result.modifiedCount} posts`)
    console.log(`📊 Matched ${result.matchedCount} posts`)

    // Close connection
    await mongoose.connection.close()
    console.log('Connection closed')
  } catch (error) {
    console.error('❌ Error running migration:', error)
    process.exit(1)
  }
}

// Run the function
addIsDeletedField()
