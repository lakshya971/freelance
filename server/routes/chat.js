import express from 'express';
import { ChatMessage, Conversation } from '../models/Chat.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/chat/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Allow images, documents, and common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only allowed file types are permitted'));
    }
  }
});

// @route   GET /api/chat/conversations
// @desc    Get all conversations for authenticated user
// @access  Private
router.get('/conversations', protect, async (req, res) => {
  try {
    const { status = 'active', limit = 20, page = 1 } = req.query;
    
    const filter = {
      $or: [
        { freelancer_id: req.user.id },
        { 'participants.user_id': req.user.id }
      ]
    };
    
    if (status === 'archived') {
      filter.is_archived = true;
    } else {
      filter.is_archived = { $ne: true };
    }
    
    const conversations = await Conversation.find(filter)
      .sort({ 'last_message.timestamp': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('related_to.entity_id', 'title name')
      .populate('participants.user_id', 'name email avatar');
    
    // Get unread counts for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await ChatMessage.countDocuments({
          conversation_id: conv.conversation_id,
          'sender.id': { $ne: req.user.id },
          read_by: { $not: { $elemMatch: { user_id: req.user.id } } }
        });
        
        return {
          ...conv.toObject(),
          unread_count: unreadCount
        };
      })
    );
    
    const total = await Conversation.countDocuments(filter);
    
    res.json({
      conversations: conversationsWithUnread,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Conversations fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/chat/conversations
// @desc    Create new conversation
// @access  Private
router.post('/conversations', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      client_id,
      related_to,
      participants = []
    } = req.body;
    
    // Verify client exists
    let client = null;
    if (client_id) {
      client = await Client.findOne({
        _id: client_id,
        created_by: req.user.id
      });
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
    }
    
    // Generate conversation ID
    const conversation_id = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up participants
    const conversationParticipants = [
      {
        user_id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: 'freelancer'
      }
    ];
    
    if (client) {
      conversationParticipants.push({
        user_id: client._id,
        name: client.name,
        email: client.email,
        role: 'client'
      });
    }
    
    // Add additional participants
    for (const participant of participants) {
      const user = await User.findById(participant.user_id);
      if (user) {
        conversationParticipants.push({
          user_id: user._id,
          name: user.name,
          email: user.email,
          role: participant.role || 'client'
        });
      }
    }
    
    const conversation = new Conversation({
      conversation_id,
      title,
      description,
      participants: conversationParticipants,
      related_to,
      created_by: req.user.id,
      freelancer_id: req.user.id,
      client_id: client_id || null
    });
    
    await conversation.save();
    
    // Send welcome message
    const welcomeMessage = new ChatMessage({
      conversation_id,
      message: `Conversation started: ${title}`,
      message_type: 'system',
      sender: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: 'freelancer'
      }
    });
    
    await welcomeMessage.save();
    await conversation.updateLastMessage(welcomeMessage.message, req.user.name);
    
    res.status(201).json({
      message: 'Conversation created successfully',
      conversation
    });
  } catch (error) {
    console.error('Conversation creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/chat/conversations/:conversationId/messages
// @desc    Get messages in a conversation
// @access  Private
router.get('/conversations/:conversationId/messages', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { limit = 50, page = 1, before_date } = req.query;
    
    // Verify user has access to conversation
    const conversation = await Conversation.findOne({
      conversation_id: conversationId,
      $or: [
        { freelancer_id: req.user.id },
        { 'participants.user_id': req.user.id }
      ]
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    const filter = { 
      conversation_id: conversationId,
      is_deleted: { $ne: true }
    };
    
    if (before_date) {
      filter.createdAt = { $lt: new Date(before_date) };
    }
    
    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('parent_message_id', 'message sender')
      .lean();
    
    // Mark messages as read
    await ChatMessage.updateMany(
      {
        conversation_id: conversationId,
        'sender.id': { $ne: req.user.id },
        read_by: { $not: { $elemMatch: { user_id: req.user.id } } }
      },
      {
        $push: {
          read_by: {
            user_id: req.user.id,
            read_at: new Date()
          }
        },
        $set: { status: 'read' }
      }
    );
    
    const total = await ChatMessage.countDocuments({
      conversation_id: conversationId,
      is_deleted: { $ne: true }
    });
    
    res.json({
      messages: messages.reverse(), // Return in chronological order
      conversation,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Messages fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/chat/conversations/:conversationId/messages
// @desc    Send message in conversation
// @access  Private
router.post('/conversations/:conversationId/messages', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const { conversationId } = req.params;
    const {
      message,
      message_type = 'text',
      parent_message_id,
      priority = 'normal'
    } = req.body;
    
    // Verify user has access to conversation
    const conversation = await Conversation.findOne({
      conversation_id: conversationId,
      $or: [
        { freelancer_id: req.user.id },
        { 'participants.user_id': req.user.id }
      ]
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    // Process file attachments
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          file_name: file.originalname,
          file_url: `/uploads/chat/${file.filename}`,
          file_size: file.size,
          mime_type: file.mimetype,
          upload_date: new Date()
        });
      }
    }
    
    // Create message
    const chatMessage = new ChatMessage({
      conversation_id: conversationId,
      message: message || 'File attachment',
      message_type,
      sender: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: conversation.freelancer_id.toString() === req.user.id.toString() ? 'freelancer' : 'client'
      },
      related_to: conversation.related_to,
      attachments,
      parent_message_id: parent_message_id || null,
      priority
    });
    
    await chatMessage.save();
    
    // Update conversation last message
    await conversation.updateLastMessage(chatMessage.message, req.user.name);
    
    // Update thread count if this is a reply
    if (parent_message_id) {
      await ChatMessage.findByIdAndUpdate(
        parent_message_id,
        { $inc: { thread_count: 1 } }
      );
    }
    
    // Send email notifications to other participants
    const otherParticipants = conversation.participants.filter(
      p => p.user_id.toString() !== req.user.id.toString() && 
           p.notification_settings?.email_notifications !== false
    );
    
    // TODO: Implement email notification sending
    
    res.status(201).json({
      message: 'Message sent successfully',
      chat_message: chatMessage
    });
  } catch (error) {
    console.error('Message send error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/chat/messages/:messageId
// @desc    Edit message
// @access  Private
router.put('/messages/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    
    const chatMessage = await ChatMessage.findOne({
      _id: messageId,
      'sender.id': req.user.id
    });
    
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    chatMessage.message = message;
    chatMessage.is_edited = true;
    chatMessage.edited_at = new Date();
    
    await chatMessage.save();
    
    res.json({
      message: 'Message updated successfully',
      chat_message: chatMessage
    });
  } catch (error) {
    console.error('Message edit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/chat/messages/:messageId
// @desc    Delete message
// @access  Private
router.delete('/messages/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const chatMessage = await ChatMessage.findOne({
      _id: messageId,
      'sender.id': req.user.id
    });
    
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    chatMessage.is_deleted = true;
    chatMessage.deleted_at = new Date();
    chatMessage.message = '[Message deleted]';
    
    await chatMessage.save();
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Message delete error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/chat/messages/:messageId/reactions
// @desc    Add reaction to message
// @access  Private
router.post('/messages/:messageId/reactions', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    
    const chatMessage = await ChatMessage.findById(messageId);
    
    if (!chatMessage) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    await chatMessage.addReaction(req.user.id, emoji);
    
    res.json({
      message: 'Reaction added successfully',
      reactions: chatMessage.reactions
    });
  } catch (error) {
    console.error('Reaction add error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/chat/conversations/:conversationId/archive
// @desc    Archive conversation
// @access  Private
router.put('/conversations/:conversationId/archive', protect, async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    const conversation = await Conversation.findOne({
      conversation_id: conversationId,
      freelancer_id: req.user.id
    });
    
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }
    
    conversation.is_archived = true;
    await conversation.save();
    
    res.json({ message: 'Conversation archived successfully' });
  } catch (error) {
    console.error('Conversation archive error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/chat/search
// @desc    Search messages and conversations
// @access  Private
router.get('/search', protect, async (req, res) => {
  try {
    const { query, conversation_id, type = 'all' } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const searchFilter = {
      $or: [
        { 'sender.id': req.user.id },
        { conversation_id: { $in: await getAccessibleConversations(req.user.id) } }
      ],
      is_deleted: { $ne: true }
    };
    
    if (conversation_id) {
      searchFilter.conversation_id = conversation_id;
    }
    
    // Search in messages
    const messageResults = await ChatMessage.find({
      ...searchFilter,
      $text: { $search: query }
    })
    .sort({ createdAt: -1 })
    .limit(20);
    
    // Search in conversations if type is 'all' or 'conversations'
    let conversationResults = [];
    if (type === 'all' || type === 'conversations') {
      conversationResults = await Conversation.find({
        $or: [
          { freelancer_id: req.user.id },
          { 'participants.user_id': req.user.id }
        ],
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      })
      .limit(10);
    }
    
    res.json({
      messages: messageResults,
      conversations: conversationResults,
      total_results: messageResults.length + conversationResults.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Helper function to get accessible conversations
async function getAccessibleConversations(userId) {
  const conversations = await Conversation.find({
    $or: [
      { freelancer_id: userId },
      { 'participants.user_id': userId }
    ]
  }).select('conversation_id');
  
  return conversations.map(conv => conv.conversation_id);
}

export default router;
