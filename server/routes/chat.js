import express from 'express';
import ChatMessage from '../models/ChatMessage.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all chat messages for a conversation
// @route   GET /api/chat/:conversationId
// @access  Private
router.get('/:conversationId', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({
      conversationId: req.params.conversationId,
      createdBy: req.user.id
    }).sort({ createdAt: 1 });
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// @desc    Send a new chat message
// @route   POST /api/chat/:conversationId
// @access  Private
router.post('/:conversationId', protect, async (req, res) => {
  try {
    const { text, sender } = req.body;
    const message = await ChatMessage.create({
      conversationId: req.params.conversationId,
      text,
      sender,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

export default router;
