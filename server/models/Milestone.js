import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  
  // Project reference
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  
  // Dates
  start_date: { type: Date },
  due_date: { type: Date, required: true },
  completed_at: { type: Date },
  
  // Progress tracking
  progress_percentage: { type: Number, default: 0, min: 0, max: 100 },
  
  // Status
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'completed', 'overdue'], 
    default: 'not_started' 
  },
  
  // Milestone ordering
  order: { type: Number, default: 0 },
  
  // Deliverables
  deliverables: [{
    title: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false },
    completed_at: { type: Date },
    file_attachments: [{
      filename: String,
      file_path: String,
      uploaded_at: { type: Date, default: Date.now }
    }]
  }],
  
  // Budget tracking
  budget_allocated: { type: Number, default: 0 },
  budget_spent: { type: Number, default: 0 },
  
  // User references
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to update progress and status
milestoneSchema.pre('save', function(next) {
  // Calculate progress based on completed deliverables
  if (this.deliverables.length > 0) {
    const completedDeliverables = this.deliverables.filter(d => d.completed).length;
    this.progress_percentage = Math.round((completedDeliverables / this.deliverables.length) * 100);
  }
  
  // Update status based on progress and dates
  const now = new Date();
  if (this.progress_percentage === 100) {
    this.status = 'completed';
    if (!this.completed_at) {
      this.completed_at = new Date();
    }
  } else if (this.due_date < now && this.progress_percentage < 100) {
    this.status = 'overdue';
  } else if (this.progress_percentage > 0) {
    this.status = 'in_progress';
  } else {
    this.status = 'not_started';
  }
  
  this.updatedAt = new Date();
  next();
});

// Virtual for budget utilization percentage
milestoneSchema.virtual('budget_utilization').get(function() {
  if (this.budget_allocated === 0) return 0;
  return Math.round((this.budget_spent / this.budget_allocated) * 100);
});

milestoneSchema.index({ project_id: 1, order: 1 });
milestoneSchema.index({ due_date: 1 });

export default mongoose.model('Milestone', milestoneSchema);
