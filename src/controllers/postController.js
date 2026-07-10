const { Op } = require('sequelize');
const Post = require('../models/post');

// GET /posts - List all posts
exports.listPosts = async (req, res) => {
  try {
    const posts = await Post.findAll({
      order: [['createdAt', 'DESC']]
    });
    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve posts.' });
  }
};

// GET /posts/search - Search posts by query string (title or content)
exports.searchPosts = async (req, res) => {
  try {
    const term = req.query.q || req.query.query || req.query.search;

    if (!term || term.trim() === '') {
      return res.status(400).json({ 
        error: 'Search query parameter (q, query, or search) is required and cannot be empty.' 
      });
    }

    const posts = await Post.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${term}%` } },
          { content: { [Op.like]: `%${term}%` } }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(posts);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to search posts.' });
  }
};

// GET /posts/:id - Read single post
exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }
    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve the post.' });
  }
};

// POST /posts - Create post
exports.createPost = async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const postAuthor = author || (req.user ? req.user.name : undefined);

    if (!title || !content || !postAuthor) {
      return res.status(400).json({ 
        error: 'Fields title, content, and author are required.' 
      });
    }

    if (title.trim() === '' || content.trim() === '' || postAuthor.trim() === '') {
      return res.status(400).json({ 
        error: 'Fields title, content, and author cannot be empty strings.' 
      });
    }

    const post = await Post.create({ 
      title, 
      content, 
      author: postAuthor,
      userId: req.user.id
    });
    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create post.' });
  }
};

// PUT /posts/:id - Edit post
exports.updatePost = async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Check ownership/role authorization: Professor can only update their own posts
    if (req.user.role === 'professor' && post.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only edit your own posts.' });
    }

    // Prepare updates, keeping existing values if not provided
    const updatedData = {};
    if (title !== undefined) {
      if (title.trim() === '') {
        return res.status(400).json({ error: 'Title cannot be empty.' });
      }
      updatedData.title = title;
    }
    if (content !== undefined) {
      if (content.trim() === '') {
        return res.status(400).json({ error: 'Content cannot be empty.' });
      }
      updatedData.content = content;
    }
    if (author !== undefined) {
      if (author.trim() === '') {
        return res.status(400).json({ error: 'Author cannot be empty.' });
      }
      updatedData.author = author;
    }

    await post.update(updatedData);
    return res.status(200).json(post);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update post.' });
  }
};

// DELETE /posts/:id - Delete post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);

    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Check ownership/role authorization: Professor can only delete their own posts
    if (req.user.role === 'professor' && post.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own posts.' });
    }

    await post.destroy();
    return res.status(200).json({ message: 'Post successfully deleted.' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete post.' });
  }
};
