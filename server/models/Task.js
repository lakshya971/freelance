import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  filename: { type: String, required: true },
  original_name: { type: String, required: true },
  file_path: { type: String, required: true },
  file_size: { type: Number, required: true },
  mime_type: { type: String, required: true },
  uploaded_at: { type: Date, default: Date.now }
});

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['todo', 'in_progress', 'done'], 
    default: 'todo' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  deadline: { type: Date },
  estimated_hours: { type: Number, default: 0 },
  actual_hours: { type: Number, default: 0 },
  
  // Project and client references
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  milestone_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
  
  // Assignments
  assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // File attachments
  attachments: [attachmentSchema],
  
  // Task ordering
  order: { type: Number, default: 0 },
  
  // Completion tracking
  completed_at: { type: Date },
  completion_notes: { type: String },
  
  // Dependencies
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  
  // Tags for organization
  tags: [{ type: String }],
  
  // Time tracking
  time_entries: [{
    start_time: { type: Date, required: true },
    end_time: { type: Date },
    duration_minutes: { type: Number },
    description: { type: String },
    billable: { type: Boolean, default: true }
  }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to update the task status and completion
taskSchema.pre('save', function(next) {
  if (this.status === 'done' && !this.completed_at) {
    this.completed_at = new Date();
  } else if (this.status !== 'done' && this.completed_at) {
    this.completed_at = null;
  }
  
  this.updatedAt = new Date();
  next();
});

// Calculate total time spent
taskSchema.virtual('total_time_minutes').get(function() {
  return this.time_entries.reduce((total, entry) => {
    return total + (entry.duration_minutes || 0);
  }, 0);
});

// Calculate billable time
taskSchema.virtual('billable_time_minutes').get(function() {
  return this.time_entries
    .filter(entry => entry.billable)
    .reduce((total, entry) => {
      return total + (entry.duration_minutes || 0);
    }, 0);
});

taskSchema.index({ project_id: 1, status: 1 });
taskSchema.index({ created_by: 1 });
taskSchema.index({ deadline: 1 });

export default mongoose.model('Task', taskSchema);
