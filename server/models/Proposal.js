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
  sections: {
    executiveSummary: String,
    projectUnderstanding: String,
    proposedSolution: String,
    scopeOfWork: String,
    timeline: String,
    investment: String,
    whyChooseUs: String,
    nextSteps: String,
    customSections: [{
      title: String,
      content: String,
      order: Number
    }]
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
  templateUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProposalTemplate'
  },
  // Sharing and notification features
  sharing: {
    isPublic: {
      type: Boolean,
      default: false
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true
    },
    sharedAt: Date,
    password: String, // Optional password protection
    expiresAt: Date,
    allowDownload: {
      type: Boolean,
      default: true
    }
  },
  notifications: {
    emailNotifications: {
      type: Boolean,
      default: true
    },
    viewNotifications: {
      type: Boolean,
      default: true
    },
    responseNotifications: {
      type: Boolean,
      default: true
    }
  },
  sentAt: Date,
  viewedAt: Date,
  respondedAt: Date,
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
  },
  // E-signature support
  signature: {
    clientSigned: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    clientSignature: {
      type: String // Base64 encoded signature
    },
    clientName: String,
    clientTitle: String,
    ipAddress: String,
    userAgent: String
  },
  freelancerSignature: {
    signed: {
      type: Boolean,
      default: false
    },
    signedAt: Date,
    signature: String, // Base64 encoded signature
    name: String,
    title: String
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
    },
    viewHistory: [{
      viewedAt: Date,
      ipAddress: String,
      userAgent: String,
      location: String
    }],
    emailsSent: [{
      sentAt: Date,
      recipient: String,
      type: {
        type: String,
        enum: ['proposal_sent', 'proposal_viewed', 'proposal_accepted', 'proposal_rejected', 'reminder']
      },
      status: {
        type: String,
        enum: ['sent', 'delivered', 'opened', 'failed']
      }
    }]
  },
  // Comments and feedback
  feedback: {
    clientComments: [{
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    internalNotes: [{
      note: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  }
}, {
  timestamps: true
});

// Generate share token before saving
proposalSchema.pre('save', function(next) {
  if (this.sharing && this.sharing.isPublic && !this.sharing.shareToken) {
    this.sharing.shareToken = require('crypto').randomBytes(32).toString('hex');
  }
  next();
});

// Index for efficient queries
proposalSchema.index({ createdBy: 1, status: 1 });
proposalSchema.index({ 'client.email': 1 });
proposalSchema.index({ createdAt: -1 });
proposalSchema.index({ 'sharing.shareToken': 1 });
proposalSchema.index({ expiresAt: 1 });

export default mongoose.model('Proposal', proposalSchema);