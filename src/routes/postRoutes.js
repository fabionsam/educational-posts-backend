const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const auth = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/role');

// Search posts (must be defined before /posts/:id) - Public for students and visitors
router.get('/search', postController.searchPosts);

// Retrieve all posts - Public for students and visitors
router.get('/', postController.listPosts);

// Retrieve a single post by id - Public for students and visitors
router.get('/:id', postController.getPostById);

// Create a new post - Restricted to professors and administrators
router.post('/', auth, authorizeRoles('administrador', 'professor'), postController.createPost);

// Update a post by id - Restricted to professors and administrators
router.put('/:id', auth, authorizeRoles('administrador', 'professor'), postController.updatePost);

// Delete a post by id - Restricted to professors and administrators
router.delete('/:id', auth, authorizeRoles('administrador', 'professor'), postController.deletePost);

module.exports = router;
