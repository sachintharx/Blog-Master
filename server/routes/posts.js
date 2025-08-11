import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { users } from './auth.js';

const router = express.Router();

// Mock posts storage (replace with database)
let posts = [
  {
    id: 1,
    title: 'Welcome to Enhanced Blog Platform',
    content: 'This is a sample blog post demonstrating the features of our enhanced blog platform. You can create, edit, and delete posts, as well as comment and react to them!',
    excerpt: 'A sample blog post demonstrating platform features...',
    authorId: 1,
    author: {
      id: 1,
      username: 'demo',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ['welcome', 'demo', 'features'],
    status: 'published',
    featuredImage: 'https://images.pexels.com/photos/261662/pexels-photo-261662.jpeg?auto=compress&cs=tinysrgb&w=800'
  },
  {
    id: 2,
    title: 'Building Modern Web Applications',
    content: 'In today\'s fast-paced digital world, building modern web applications requires a solid understanding of various technologies and frameworks. From React to Node.js, developers have numerous tools at their disposal to create engaging and performant applications.',
    excerpt: 'Learn about building modern web applications with the latest technologies...',
    authorId: 1,
    author: {
      id: 1,
      username: 'demo',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    tags: ['web development', 'react', 'nodejs'],
    status: 'published',
    featuredImage: 'https://images.pexels.com/photos/11035380/pexels-photo-11035380.jpeg?auto=compress&cs=tinysrgb&w=800'
  }
];

let nextPostId = 3;

// Get all posts
router.get('/', optionalAuth, (req, res) => {
  try {
    const { page = 1, limit = 10, author, tag } = req.query;
    
    let filteredPosts = posts.filter(post => post.status === 'published');
    
    // Filter by author
    if (author) {
      filteredPosts = filteredPosts.filter(post => 
        post.author.username.toLowerCase().includes(author.toLowerCase())
      );
    }
    
    // Filter by tag
    if (tag) {
      filteredPosts = filteredPosts.filter(post => 
        post.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }
    
    // Sort by creation date (newest first)
    filteredPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    res.json({
      posts: paginatedPosts,
      totalPosts: filteredPosts.length,
      currentPage: parseInt(page),
      totalPages: Math.ceil(filteredPosts.length / limit)
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error while fetching posts' });
  }
});

// Get single post
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = posts.find(p => p.id === postId && p.status === 'published');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error while fetching post' });
  }
});

// Create new post
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('excerpt').optional().trim().isLength({ max: 300 }).withMessage('Excerpt must be less than 300 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('featuredImage').optional().isURL().withMessage('Featured image must be a valid URL')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, excerpt, tags = [], featuredImage } = req.body;
    const author = users.find(u => u.id === req.user.userId);

    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const post = {
      id: nextPostId++,
      title,
      content,
      excerpt: excerpt || content.substring(0, 150) + '...',
      authorId: author.id,
      author: {
        id: author.id,
        username: author.username,
        avatar: author.avatar
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: tags.filter(tag => tag.trim().length > 0),
      status: 'published',
      featuredImage: featuredImage || null
    };

    posts.push(post);

    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error while creating post' });
  }
});

// Update post
router.put('/:id', authenticateToken, [
  body('title').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters'),
  body('content').optional().trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
  body('excerpt').optional().trim().isLength({ max: 300 }).withMessage('Excerpt must be less than 300 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('featuredImage').optional().isURL().withMessage('Featured image must be a valid URL')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[postIndex];

    // Check if user is the author
    if (post.authorId !== req.user.userId) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }

    // Update post
    const updatedPost = {
      ...post,
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    if (req.body.excerpt === undefined && req.body.content) {
      updatedPost.excerpt = req.body.content.substring(0, 150) + '...';
    }

    posts[postIndex] = updatedPost;

    res.json({
      message: 'Post updated successfully',
      post: updatedPost
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error while updating post' });
  }
});

// Delete post
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = posts[postIndex];

    // Check if user is the author
    if (post.authorId !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    posts.splice(postIndex, 1);

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error while deleting post' });
  }
});

// Get user's posts
router.get('/user/:userId', optionalAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const userPosts = posts.filter(p => p.authorId === userId && p.status === 'published')
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ posts: userPosts });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ message: 'Server error while fetching user posts' });
  }
});

export { posts };
export default router;