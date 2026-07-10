const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/role');

// All post routes require authentication
router.use(auth);

// Search posts (must be defined before /posts/:id)
router.get('/search', authorizeRoles('administrador', 'aluno', 'professor'), postController.searchPosts);

// Retrieve all posts
router.get('/', authorizeRoles('administrador', 'aluno', 'professor'), postController.listPosts);

// Retrieve a single post by id
router.get('/:id', authorizeRoles('administrador', 'aluno', 'professor'), postController.getPostById);

// Create a new post
router.post('/', authorizeRoles('administrador', 'professor'), postController.createPost);

// Update a post by id
router.put('/:id', authorizeRoles('administrador', 'professor'), postController.updatePost);

// Delete a post by id
router.delete('/:id', authorizeRoles('administrador', 'professor'), postController.deletePost);

module.exports = router;
