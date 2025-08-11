import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth.js';
import { posts } from './posts.js';

const router = express.Router();

// Mock reactions storage (replace with database)
let reactions = [
  {
    id: 1,
    postId: 1,
    userId: 1,
    type: 'like',
    createdAt: new Date(Date.now() - 21600000).toISOString() // 6 hours ago
  }
];

let nextReactionId = 2;

const REACTION_TYPES = ['like', 'love', 'laugh', 'wow', 'sad', 'angry'];

// Get reactions for a post
router.get('/post/:postId', (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    
    // Check if post exists
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const postReactions = reactions.filter(r => r.postId === postId);
    
    // Count reactions by type
    const reactionCounts = REACTION_TYPES.reduce((counts, type) => {
      counts[type] = postReactions.filter(r => r.type === type).length;
      return counts;
    }, {});

    // Total count
    const totalReactions = postReactions.length;

    res.json({
      postId,
      reactions: reactionCounts,
      totalReactions
    });
  } catch (error) {
    console.error('Get reactions error:', error);
    res.status(500).json({ message: 'Server error while fetching reactions' });
  }
});

// Get user's reaction for a post
router.get('/post/:postId/user', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.userId;
    
    const userReaction = reactions.find(r => r.postId === postId && r.userId === userId);
    
    res.json({
      postId,
      userReaction: userReaction ? userReaction.type : null
    });
  } catch (error) {
    console.error('Get user reaction error:', error);
    res.status(500).json({ message: 'Server error while fetching user reaction' });
  }
});

// Add or update reaction
router.post('/', authenticateToken, [
  body('postId').isInt({ min: 1 }).withMessage('Valid post ID is required'),
  body('type').isIn(REACTION_TYPES).withMessage(`Reaction type must be one of: ${REACTION_TYPES.join(', ')}`)
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId, type } = req.body;
    const userId = req.user.userId;

    // Check if post exists
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user already reacted to this post
    const existingReactionIndex = reactions.findIndex(r => r.postId === postId && r.userId === userId);

    if (existingReactionIndex !== -1) {
      // Update existing reaction
      const existingReaction = reactions[existingReactionIndex];
      
      if (existingReaction.type === type) {
        // Same reaction type - remove it (toggle off)
        reactions.splice(existingReactionIndex, 1);
        return res.json({ 
          message: 'Reaction removed',
          action: 'removed',
          type: null
        });
      } else {
        // Different reaction type - update it
        reactions[existingReactionIndex] = {
          ...existingReaction,
          type,
          createdAt: new Date().toISOString()
        };
        return res.json({ 
          message: 'Reaction updated',
          action: 'updated',
          type
        });
      }
    } else {
      // Create new reaction
      const reaction = {
        id: nextReactionId++,
        postId,
        userId,
        type,
        createdAt: new Date().toISOString()
      };

      reactions.push(reaction);

      res.status(201).json({
        message: 'Reaction added',
        action: 'added',
        type,
        reaction
      });
    }
  } catch (error) {
    console.error('Add/update reaction error:', error);
    res.status(500).json({ message: 'Server error while processing reaction' });
  }
});

// Remove reaction
router.delete('/post/:postId', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const userId = req.user.userId;

    const reactionIndex = reactions.findIndex(r => r.postId === postId && r.userId === userId);

    if (reactionIndex === -1) {
      return res.status(404).json({ message: 'Reaction not found' });
    }

    reactions.splice(reactionIndex, 1);

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Remove reaction error:', error);
    res.status(500).json({ message: 'Server error while removing reaction' });
  }
});

export default router;