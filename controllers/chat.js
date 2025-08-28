const ChatMessage = require('../schema/chatSchema');

// GET /chat/:userId
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const otherUserId = req.params.userId;

    // Find messages where sender/receiver is either user
    const messages = await ChatMessage.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

module.exports = { getChatHistory }; 