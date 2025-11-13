// controllers/post/index.js
const postController = require('./postController')
const likeController = require('./likeController')
const commentController = require('./commentController')
const saveController = require('./saveController')
const repostController = require('./repostController')
const deleteController = require('./deleteController')

module.exports = {
  // Post CRUD
  handleAddPost: postController.handleAddPost,
  handleGetPost: postController.handleGetPost,
  handleGetAllPost: postController.handleGetAllPost,
  handleGetSinglePostById: postController.handleGetSinglePostById,

  // Likes
  handleAddLikeOnPost: likeController.handleAddLikeOnPost,

  // Comments
  handleAddCommentOnPost: commentController.handleAddCommentOnPost,

  // Save/Bookmark
  handleSavePost: saveController.handleSavePost,
  handleGetSavedPosts: saveController.handleGetSavedPosts,

  // Repost
  handleRepostsByUser: repostController.handleRepostsByUser,

  // Delete
  handleDeletePost: deleteController.handleDeletePost,
  handleRestorePost: deleteController.handleRestorePost,
  handlePermanentDeletePost: deleteController.handlePermanentDeletePost,
}
