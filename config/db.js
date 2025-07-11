const mongoose = require('mongoose')

// Connection events
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to DB')
})

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  console.log('Mongoose connection disconnected through app termination')
  process.exit(0)
})

const connectDB = async () => {
  try {
    
    const conn = await mongoose.connect(process.env.MONGO_URL)

    console.log(`MongoDB Connected: ${conn.connection.host}`)
    return conn
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

module.exports = connectDB


// {
  // useNewUrlParser: true,
  // useUnifiedTopology: true,
  // Other options if needed:
  // serverSelectionTimeoutMS: 5000,
  // socketTimeoutMS: 45000,
  // maxPoolSize: 10
// }