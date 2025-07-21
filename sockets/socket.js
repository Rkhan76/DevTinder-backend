// socket.js
const { Server } = require('socket.io')

let io = null

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id)

    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id)
    })
  })

  return io
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!')
  }
  return io
}

module.exports = { initSocket, getIO }
