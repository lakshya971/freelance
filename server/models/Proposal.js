import mongoose from 'mongoose';

const proposalSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Proposal title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  client: {
    name: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Client email is required'],
      trim: true
    },
    company: {
      type: String,
      trim: true
    }
  },
  project: {
    description: {
      type: String,
      required: [true, 'Project description is required']
    },
    scope: {
      type: String,
      required: [true, 'Project scope is required']
    },
    deliverables: [{
      type: String,
      required: true
    }],
    timeline: {
      type: String,
      required: [true, 'Timeline is required']
    },
    budget: {
      amount: {
        type: Number,
        required: [true, 'Budget amount is required'],
        min: [0, 'Budget cannot be negative']
      },
      currency: {
        type: String,
        default: 'USD'
      }
    }
  },
  content: {
    type: String,
    required: [true, 'Proposal content is required']
  },
  status: {
    type: String,
    enum: ['draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentAt: Date,
  viewedAt: Date,
  respondedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  signature: {
    clientSigned: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    ipAddress: String
  },
  aiGenerated: {
    type: Boolean,
    default: false
  },
  metadata: {
    viewCount: {
      type: Number,
      default: 0
    },
    lastViewed: Date,
    downloadCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
proposalSchema.index({ createdBy: 1, status: 1 });
proposalSchema.index({ 'client.email': 1 });
proposalSchema.index({ createdAt: -1 });

export default mongoose.model('Proposal', proposalSchema);