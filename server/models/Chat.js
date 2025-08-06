import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  // Chat room/thread identification
  conversation_id: { type: String, required: true, index: true },
  
  // Message content
  message: { type: String, required: true },
  message_type: {
    type: String,
    enum: ['text', 'file', 'image', 'system', 'notification'],
    default: 'text'
  },
  
  // Sender information
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    role: {
      type: String,
      enum: ['freelancer', 'client', 'system'],
      required: true
    },
    avatar_url: String
  },
  
  // Related entities
  related_to: {
    entity_type: {
      type: String,
      enum: ['project', 'proposal', 'invoice', 'client', 'general']
    },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    entity_name: String
  },
  
  // File attachments
  attachments: [{
    file_name: String,
    file_url: String,
    file_size: Number,
    mime_type: String,
    upload_date: { type: Date, default: Date.now }
  }],
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Read receipts
  read_by: [{
    user_id: { type: mongoose.Schema.Types.ObjectId },
    read_at: { type: Date, default: Date.now }
  }],
  
  // Message threading
  parent_message_id: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatMessage' },
  thread_count: { type: Number, default: 0 },
  
  // Reactions and interactions
  reactions: [{
    user_id: { type: mongoose.Schema.Types.ObjectId },
    emoji: String,
    created_at: { type: Date, default: Date.now }
  }],
  
  // Message metadata
  is_edited: { type: Boolean, default: false },
  edited_at: Date,
  is_deleted: { type: Boolean, default: false },
  deleted_at: Date,
  
  // Priority and flagging
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  is_pinned: { type: Boolean, default: false },
  is_flagged: { type: Boolean, default: false },
  
  // Email notification tracking
  email_notification_sent: { type: Boolean, default: false },
  email_sent_at: Date,
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Conversation/Room schema for organizing chats
const conversationSchema = new mongoose.Schema({
  // Conversation identification
  conversation_id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  
  // Participants
  participants: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: String,
    email: String,
    role: {
      type: String,
      enum: ['freelancer', 'client', 'admin'],
      required: true
    },
    joined_at: { type: Date, default: Date.now },
    last_seen: { type: Date, default: Date.now },
    is_active: { type: Boolean, default: true },
    notification_settings: {
      email_notifications: { type: Boolean, default: true },
      push_notifications: { type: Boolean, default: true },
      mute_until: Date
    }
  }],
  
  // Related entity
  related_to: {
    entity_type: {
      type: String,
      enum: ['project', 'proposal', 'invoice', 'client', 'general']
    },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    entity_name: String
  },
  
  // Conversation metadata
  last_message: {
    message: String,
    sender_name: String,
    timestamp: Date
  },
  
  message_count: { type: Number, default: 0 },
  unread_count: { type: Number, default: 0 },
  
  // Conversation settings
  is_archived: { type: Boolean, default: false },
  is_locked: { type: Boolean, default: false },
  auto_close_after_days: Number,
  
  // Access control
  created_by: { type: mongoose.Schema.Types.ObjectId, required: true },
  freelancer_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware for messages
chatMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Pre-save middleware for conversations
conversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Method to mark message as read
chatMessageSchema.methods.markAsRead = async function(userId) {
  if (!this.read_by.some(read => read.user_id.toString() === userId.toString())) {
    this.read_by.push({
      user_id: userId,
      read_at: new Date()
    });
    this.status = 'read';
    await this.save();
  }
  return this;
};

// Method to add reaction
chatMessageSchema.methods.addReaction = async function(userId, emoji) {
  // Remove existing reaction from this user
  this.reactions = this.reactions.filter(r => r.user_id.toString() !== userId.toString());
  
  // Add new reaction
  this.reactions.push({
    user_id: userId,
    emoji,
    created_at: new Date()
  });
  
  await this.save();
  return this;
};

// Static method to get conversation summary
conversationSchema.statics.getConversationSummary = async function(conversationId, userId) {
  const conversation = await this.findOne({ conversation_id: conversationId });
  if (!conversation) return null;
  
  const ChatMessage = mongoose.model('ChatMessage');
  
  // Get unread count for this user
  const unreadCount = await ChatMessage.countDocuments({
    conversation_id: conversationId,
    'sender.id': { $ne: userId },
    read_by: { $not: { $elemMatch: { user_id: userId } } }
  });
  
  // Get recent messages
  const recentMessages = await ChatMessage.find({
    conversation_id: conversationId
  })
  .sort({ createdAt: -1 })
  .limit(5)
  .populate('sender.id', 'name email');
  
  return {
    ...conversation.toObject(),
    unread_count: unreadCount,
    recent_messages: recentMessages.reverse()
  };
};

// Method to update last message
conversationSchema.methods.updateLastMessage = async function(message, senderName) {
  this.last_message = {
    message: message.length > 100 ? message.substring(0, 100) + '...' : message,
    sender_name: senderName,
    timestamp: new Date()
  };
  this.message_count += 1;
  await this.save();
};

// Indexes for performance
chatMessageSchema.index({ conversation_id: 1, createdAt: -1 });
chatMessageSchema.index({ 'sender.id': 1 });
chatMessageSchema.index({ 'related_to.entity_id': 1, 'related_to.entity_type': 1 });
chatMessageSchema.index({ status: 1 });

conversationSchema.index({ conversation_id: 1 });
conversationSchema.index({ freelancer_id: 1, client_id: 1 });
conversationSchema.index({ 'related_to.entity_id': 1, 'related_to.entity_type': 1 });
conversationSchema.index({ 'participants.user_id': 1 });

export const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
export const Conversation = mongoose.model('Conversation', conversationSchema);
