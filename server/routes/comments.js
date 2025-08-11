import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { users } from './auth.js';
import { posts } from './posts.js';

const router = express.Router();

// Mock comments storage (replace with database)
let comments = [
  {
    id: 1,
    postId: 1,
    authorId: 1,
    author: {
      id: 1,
      username: 'demo',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
    },
    content: 'Great introduction to the platform! Looking forward to more features.',
    parentId: null,
    createdAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
    updatedAt: new Date(Date.now() - 43200000).toISOString()
  }
];

let nextCommentId = 2;

// Get comments for a post
router.get('/post/:postId', optionalAuth, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    
    // Check if post exists
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const postComments = comments
      .filter(c => c.postId === postId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Organize comments in a tree structure (parent -> replies)
    const commentTree = [];
    const commentMap = {};

    // First pass: create comment map
    postComments.forEach(comment => {
      commentMap[comment.id] = { ...comment, replies: [] };
    });

    // Second pass: organize into tree
    postComments.forEach(comment => {
      if (comment.parentId) {
        // This is a reply
        if (commentMap[comment.parentId]) {
          commentMap[comment.parentId].replies.push(commentMap[comment.id]);
        }
      } else {
        // This is a top-level comment
        commentTree.push(commentMap[comment.id]);
      }
    });

    res.json({ comments: commentTree });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error while fetching comments' });
  }
});

// Create comment
router.post('/', authenticateToken, [
  body('postId').isInt({ min: 1 }).withMessage('Valid post ID is required'),
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters'),
  body('parentId').optional().isInt({ min: 1 }).withMessage('Parent ID must be a valid integer')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId, content, parentId } = req.body;

    // Check if post exists
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if parent comment exists (if provided)
    if (parentId) {
      const parentComment = comments.find(c => c.id === parentId && c.postId === postId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const author = users.find(u => u.id === req.user.userId);
    if (!author) {
      return res.status(404).json({ message: 'Author not found' });
    }

    const comment = {
      id: nextCommentId++,
      postId,
      authorId: author.id,
      author: {
        id: author.id,
        username: author.username,
        avatar: author.avatar
      },
      content,
      parentId: parentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    comments.push(comment);

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error while creating comment' });
  }
});

// Update comment
router.put('/:id', authenticateToken, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Content must be between 1 and 1000 characters')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const commentId = parseInt(req.params.id);
    const commentIndex = comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = comments[commentIndex];

    // Check if user is the author
    if (comment.authorId !== req.user.userId) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    // Update comment
    const updatedComment = {
      ...comment,
      content: req.body.content,
      updatedAt: new Date().toISOString()
    };

    comments[commentIndex] = updatedComment;

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Server error while updating comment' });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const commentId = parseInt(req.params.id);
    const commentIndex = comments.findIndex(c => c.id === commentId);

    if (commentIndex === -1) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const comment = comments[commentIndex];

    // Check if user is the author
    if (comment.authorId !== req.user.userId) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    // Remove comment and its replies
    const removeCommentAndReplies = (commentId) => {
      // Find all replies to this comment
      const replies = comments.filter(c => c.parentId === commentId);
      
      // Recursively remove replies
      replies.forEach(reply => {
        removeCommentAndReplies(reply.id);
      });
      
      // Remove the comment itself
      const index = comments.findIndex(c => c.id === commentId);
      if (index !== -1) {
        comments.splice(index, 1);
      }
    };

    removeCommentAndReplies(commentId);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error while deleting comment' });
  }
});

export default router;