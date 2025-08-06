import mongoose from 'mongoose';

const proposalTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Template name is required'],
    trim: true,
    maxlength: [100, 'Template name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    enum: ['web-development', 'mobile-app', 'design', 'marketing', 'consulting', 'content', 'custom'],
    default: 'custom'
  },
  sections: {
    executiveSummary: {
      title: {
        type: String,
        default: 'Executive Summary'
      },
      content: {
        type: String,
        required: true
      },
      enabled: {
        type: Boolean,
        default: true
      }
    },
    projectUnderstanding: {
      title: {
        type: String,
        default: 'Project Understanding'
      },
      content: {
        type: String,
        required: true
      },
      enabled: {
        type: Boolean,
        default: true
      }
    },
    proposedSolution: {
      title: {
        type: String,
        default: 'Proposed Solution'
      },
      content: {
        type: String,
        required: true
      },
      enabled: {
        type: Boolean,
        default: true
      }
    },
    scopeOfWork: {
      title: {
        type: String,
        default: 'Scope of Work'
      },
      content: {
        type: String,
        required: true
      },
      deliverables: [{
        item: String,
        description: String,
        timeline: String
      }],
      enabled: {
        type: Boolean,
        default: true
      }
    },
    timeline: {
      title: {
        type: String,
        default: 'Timeline & Process'
      },
      content: {
        type: String,
        required: true
      },
      milestones: [{
        phase: String,
        description: String,
        duration: String,
        deliverables: [String]
      }],
      enabled: {
        type: Boolean,
        default: true
      }
    },
    investment: {
      title: {
        type: String,
        default: 'Investment'
      },
      content: {
        type: String,
        required: true
      },
      breakdown: [{
        item: String,
        amount: Number,
        percentage: Number
      }],
      paymentTerms: {
        type: String,
        default: '50% upfront, 50% upon completion'
      },
      enabled: {
        type: Boolean,
        default: true
      }
    },
    whyChooseUs: {
      title: {
        type: String,
        default: 'Why Choose Us'
      },
      content: {
        type: String,
        required: true
      },
      enabled: {
        type: Boolean,
        default: true
      }
    },
    nextSteps: {
      title: {
        type: String,
        default: 'Next Steps'
      },
      content: {
        type: String,
        required: true
      },
      enabled: {
        type: Boolean,
        default: true
      }
    }
  },
  customSections: [{
    title: String,
    content: String,
    order: Number,
    enabled: {
      type: Boolean,
      default: true
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
proposalTemplateSchema.index({ createdBy: 1, category: 1 });
proposalTemplateSchema.index({ isPublic: 1, category: 1 });
proposalTemplateSchema.index({ usageCount: -1 });

export default mongoose.model('ProposalTemplate', proposalTemplateSchema);
