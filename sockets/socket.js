const { Server } = require('socket.io')
const ChatMessage = require('../schema/chatSchema')

let io = null
const onlineUsers = new Map() // key: userId, value: Set of socket ids (if multi-device)

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
  })

  io.on('connection', (socket) => {
    console.log('🟢 New client connected:', socket.id)

    socket.on('join', (userId) => {
      socket.userId = userId
      socket.join(userId)

      // Add to online users
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set())
      }
      onlineUsers.get(userId).add(socket.id)

      console.log(`${userId} joined. Current online users:`, [
        ...onlineUsers.keys(),
      ])

      // Broadcast updated online list to all clients
      broadcastOnlineUsers()
    })

    socket.on('disconnect', () => {
      const userId = socket.userId

      if (userId && onlineUsers.has(userId)) {
        const userSockets = onlineUsers.get(userId)
        userSockets.delete(socket.id)
        if (userSockets.size === 0) {
          onlineUsers.delete(userId)
        }
      }

      console.log('🔴 Client disconnected:', socket.id)
      broadcastOnlineUsers()
    })

    socket.on('send_message', async ({ sender, receiver, message }) => {
      try {
        const chatMsg = await ChatMessage.create({ sender, receiver, message })

        io.to(receiver).emit('receive_message', chatMsg)
        socket.emit('message_sent', chatMsg)
      } catch (err) {
        socket.emit('error', 'Message not sent')
      }
    })

    socket.on('typing', ({ sender, receiver }) => {
      io.to(receiver).emit('typing', { sender })
    })

    socket.on('stop_typing', ({ sender, receiver }) => {
      io.to(receiver).emit('stop_typing', { sender })
    })

    // ================= COMMENTS =================
    socket.on('joinPostRoom', (postId) => {
      socket.join(postId) // each post has a room
      console.log(`Socket ${socket.id} joined post room ${postId}`)
    })
  })

  return io
}

function broadcastOnlineUsers() {
  const onlineUserIds = [...onlineUsers.keys()]
  io.emit('online_users', onlineUserIds)
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!')
  }
  return io
}

module.exports = { initSocket, getIO }
