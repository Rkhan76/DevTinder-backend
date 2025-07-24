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
    console.log('🟢 New client connected:', socket.id);

    // User joins with their userId
    socket.on('join', (userId) => {
      socket.userId = userId;
      socket.join(userId); // Join a room named by userId
    });

    // Handle sending a message
    socket.on('send_message', async (data) => {
      // data: { sender, receiver, message }
      const { sender, receiver, message } = data;
      try {
        const ChatMessage = require('../schema/chatSchema');
        const chatMsg = await ChatMessage.create({ sender, receiver, message });
        // Emit to receiver if online
        io.to(receiver).emit('receive_message', chatMsg);
        // Optionally, emit to sender for confirmation
        socket.emit('message_sent', chatMsg);
      } catch (err) {
        socket.emit('error', 'Message not sent');
      }
    });

    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id);
    });
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
