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

const handleUserSearch = async (req, res) => {
  try {
    const { query } = req.query
   

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return res.status(200).json({ success: true, users: [] }) // return empty if no query
    }

      console.log('query', query)

    const searchRegex = new RegExp(query, 'i')

    const users = await User.find({
      $or: [
        { fullName: { $regex: searchRegex } },
        { username: { $regex: searchRegex } },
        { email: { $regex: searchRegex } },
      ],
    }).select('_id fullName username image email')

    console.log('users', users)

    return res.status(200).json({ success: true, users })
  } catch (error) {
    console.error('User search error:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to search users',
    })
  }
}

module.exports = {
  handleGetAllUsers,
  handleUserSearch,
}