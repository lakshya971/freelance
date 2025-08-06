import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  // Basic information
  name: { type: String, required: true },
  title: { type: String, required: true }, // Alias for name
  description: { type: String },
  
  // Client information
  clientName: { type: String },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }, // Alias for clientId
  
  // Project status and tracking
  status: { 
    type: String, 
    enum: ['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'], 
    default: 'planning' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  
  // Dates
  start_date: { type: Date },
  dueDate: { type: Date },
  due_date: { type: Date }, // Alias for dueDate
  completed_at: { type: Date },
  
  // Progress tracking
  progress_percentage: { type: Number, default: 0, min: 0, max: 100 },
  
  // Budget and pricing
  budget: { type: Number, default: 0 },
  hourly_rate: { type: Number, default: 0 },
  fixed_price: { type: Number, default: 0 },
  pricing_type: { type: String, enum: ['hourly', 'fixed', 'milestone'], default: 'fixed' },
  
  // Time tracking
  estimated_hours: { type: Number, default: 0 },
  actual_hours: { type: Number, default: 0 },
  billable_hours: { type: Number, default: 0 },
  
  // Project categorization
  category: { type: String },
  tags: [{ type: String }],
  
  // File attachments
  attachments: [{
    filename: String,
    original_name: String,
    file_path: String,
    uploaded_at: { type: Date, default: Date.now }
  }],
  
  // Project notes and updates
  notes: { type: String },
  internal_notes: { type: String },
  
  // Team members
  team_members: [{
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, default: 'member' },
    permissions: [{ type: String }]
  }],
  
  // Client communication
  last_client_update: { type: Date },
  next_update_due: { type: Date },
  update_frequency: { 
    type: String, 
    enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'milestone'], 
    default: 'weekly' 
  },
  
  // Automation settings
  auto_progress_updates: { type: Boolean, default: true },
  email_notifications: { type: Boolean, default: true },
  
  // User reference
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Alias
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to sync alias fields and calculate progress
projectSchema.pre('save', function(next) {
  // Sync alias fields
  this.title = this.title || this.name;
  this.name = this.name || this.title;
  this.client_id = this.client_id || this.clientId;
  this.clientId = this.clientId || this.client_id;
  this.due_date = this.due_date || this.dueDate;
  this.dueDate = this.dueDate || this.due_date;
  this.created_by = this.created_by || this.createdBy;
  this.createdBy = this.createdBy || this.created_by;
  
  // Update status based on completion
  if (this.progress_percentage === 100 && this.status !== 'completed') {
    this.status = 'completed';
    if (!this.completed_at) {
      this.completed_at = new Date();
    }
  } else if (this.progress_percentage < 100 && this.status === 'completed') {
    this.status = 'in_progress';
    this.completed_at = null;
  }
  
  this.updatedAt = new Date();
  next();
});

// Virtual for budget utilization
projectSchema.virtual('budget_utilization').get(function() {
  if (!this.budget || this.budget === 0) return 0;
  const spent = this.actual_hours * (this.hourly_rate || 0);
  return Math.round((spent / this.budget) * 100);
});

// Virtual for project health (on time, over budget, etc.)
projectSchema.virtual('health_status').get(function() {
  const now = new Date();
  const isOverdue = this.due_date && now > this.due_date && this.status !== 'completed';
  const isOverBudget = this.budget_utilization > 100;
  
  if (isOverdue && isOverBudget) return 'critical';
  if (isOverdue || isOverBudget) return 'warning';
  if (this.progress_percentage > 75) return 'good';
  return 'normal';
});

projectSchema.index({ createdBy: 1, status: 1 });
projectSchema.index({ clientId: 1 });
projectSchema.index({ due_date: 1 });

export default mongoose.model('Project', projectSchema);
