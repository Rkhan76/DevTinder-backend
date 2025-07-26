const User = require('../schema/userSchema')

const handleGetAllUsers = async (req, res) => {
  try {
   const users = await User.find().select('-password');
    res.status(200).json({
      success: true,
      users,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
    })
  }
}   

module.exports = {
  handleGetAllUsers,
}