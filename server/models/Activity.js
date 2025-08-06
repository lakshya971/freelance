import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  // User reference
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Activity details
  type: {
    type: String,
    enum: [
      'client_created', 'client_updated', 'client_contacted',
      'project_created', 'project_updated', 'project_completed', 'project_milestone',
      'proposal_sent', 'proposal_accepted', 'proposal_rejected',
      'invoice_created', 'invoice_sent', 'invoice_paid', 'invoice_overdue',
      'task_created', 'task_completed', 'task_assigned',
      'meeting_scheduled', 'meeting_completed', 'call_made',
      'email_sent', 'email_received', 'message_sent',
      'payment_received', 'payment_pending',
      'file_uploaded', 'file_shared',
      'note_added', 'reminder_set',
      'contract_signed', 'contract_renewed',
      'feedback_received', 'review_completed',
      'lead_qualified', 'lead_converted',
      'system_notification', 'custom_activity'
    ],
    required: true
  },
  
  title: { type: String, required: true },
  description: { type: String },
  
  // Related entities
  related_to: {
    entity_type: {
      type: String,
      enum: ['client', 'project', 'proposal', 'invoice', 'task', 'user', 'general']
    },
    entity_id: { type: mongoose.Schema.Types.ObjectId },
    entity_name: String // For quick reference without population
  },
  
  // Activity metadata
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'completed'
  },
  
  // Contact information (for client-related activities)
  contact_method: {
    type: String,
    enum: ['email', 'phone', 'video_call', 'in_person', 'chat', 'social_media', 'other']
  },
  
  contact_details: {
    duration: Number, // in minutes for calls/meetings
    outcome: String,
    next_steps: String,
    participants: [String], // email addresses or names
    location: String // for in-person meetings
  },
  
  // Financial data (for revenue-related activities)
  financial_impact: {
    amount: Number,
    currency: { type: String, default: 'USD' },
    impact_type: {
      type: String,
      enum: ['revenue', 'expense', 'potential_revenue', 'lost_revenue']
    }
  },
  
  // Tags and categorization
  tags: [String],
  category: String,
  
  // Automation and tracking
  is_automated: { type: Boolean, default: false },
  source: {
    type: String,
    enum: ['manual', 'system', 'integration', 'api', 'email', 'calendar'],
    default: 'manual'
  },
  
  // Attachments and references
  attachments: [{
    file_name: String,
    file_url: String,
    file_size: Number,
    mime_type: String
  }],
  
  references: [{
    url: String,
    title: String,
    description: String
  }],
  
  // Follow-up and reminders
  follow_up: {
    is_required: { type: Boolean, default: false },
    due_date: Date,
    reminder_date: Date,
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    completed: { type: Boolean, default: false }
  },
  
  // Timeline and scheduling
  scheduled_date: Date, // For future activities
  completed_date: Date, // When activity was actually completed
  
  // Geographic information
  location: {
    address: String,
    city: String,
    state: String,
    country: String,
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Analytics and metrics
  metrics: {
    conversion_impact: Number, // If this activity led to conversion
    satisfaction_score: Number, // 1-5 rating
    engagement_level: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    response_time: Number // Minutes to respond/complete
  },
  
  // Integration data
  external_refs: {
    calendar_event_id: String,
    email_thread_id: String,
    crm_id: String,
    integration_source: String
  },
  
  // Activity chain (for related activities)
  parent_activity_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity' },
  child_activities: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Activity' }],
  
  // Visibility and access control
  visibility: {
    type: String,
    enum: ['private', 'team', 'client', 'public'],
    default: 'private'
  },
  
  // Audit trail
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update timestamps
activitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'completed' && !this.completed_date) {
    this.completed_date = new Date();
  }
  next();
});

// Method to create follow-up activity
activitySchema.methods.createFollowUp = async function(followUpData) {
  if (!this.follow_up.is_required) return null;
  
  const Activity = mongoose.model('Activity');
  
  const followUp = new Activity({
    user_id: this.user_id,
    type: 'custom_activity',
    title: `Follow-up: ${this.title}`,
    description: followUpData.description || this.follow_up.notes,
    related_to: this.related_to,
    priority: followUpData.priority || 'medium',
    status: 'pending',
    scheduled_date: this.follow_up.due_date,
    parent_activity_id: this._id,
    created_by: this.created_by,
    ...followUpData
  });
  
  await followUp.save();
  
  // Add to child activities
  this.child_activities.push(followUp._id);
  await this.save();
  
  return followUp;
};

// Method to calculate activity metrics
activitySchema.methods.calculateMetrics = function() {
  if (this.created_by && this.completed_date) {
    this.metrics.response_time = (this.completed_date - this.createdAt) / (1000 * 60); // minutes
  }
  
  // Calculate engagement level based on activity type and data
  if (['client_contacted', 'meeting_completed', 'call_made'].includes(this.type)) {
    const duration = this.contact_details?.duration || 0;
    if (duration > 60) this.metrics.engagement_level = 'high';
    else if (duration > 15) this.metrics.engagement_level = 'medium';
    else this.metrics.engagement_level = 'low';
  }
  
  return this;
};

// Static method to get activity summary for a period
activitySchema.statics.getActivitySummary = async function(userId, startDate, endDate) {
  const activities = await this.find({
    user_id: userId,
    createdAt: { $gte: startDate, $lte: endDate }
  });
  
  const summary = {
    total_activities: activities.length,
    by_type: {},
    by_status: {},
    by_priority: {},
    financial_impact: 0,
    engagement_metrics: {
      total_calls: 0,
      total_meetings: 0,
      total_emails: 0,
      average_response_time: 0
    }
  };
  
  activities.forEach(activity => {
    // Count by type
    summary.by_type[activity.type] = (summary.by_type[activity.type] || 0) + 1;
    
    // Count by status
    summary.by_status[activity.status] = (summary.by_status[activity.status] || 0) + 1;
    
    // Count by priority
    summary.by_priority[activity.priority] = (summary.by_priority[activity.priority] || 0) + 1;
    
    // Sum financial impact
    if (activity.financial_impact?.amount) {
      summary.financial_impact += activity.financial_impact.amount;
    }
    
    // Engagement metrics
    if (activity.type === 'call_made') summary.engagement_metrics.total_calls++;
    if (activity.type === 'meeting_completed') summary.engagement_metrics.total_meetings++;
    if (activity.type === 'email_sent') summary.engagement_metrics.total_emails++;
  });
  
  // Calculate average response time
  const activitiesWithResponseTime = activities.filter(a => a.metrics?.response_time);
  if (activitiesWithResponseTime.length > 0) {
    summary.engagement_metrics.average_response_time = 
      activitiesWithResponseTime.reduce((sum, a) => sum + a.metrics.response_time, 0) / 
      activitiesWithResponseTime.length;
  }
  
  return summary;
};

// Indexes for performance
activitySchema.index({ user_id: 1, createdAt: -1 });
activitySchema.index({ user_id: 1, type: 1 });
activitySchema.index({ user_id: 1, status: 1 });
activitySchema.index({ 'related_to.entity_type': 1, 'related_to.entity_id': 1 });
activitySchema.index({ user_id: 1, 'follow_up.due_date': 1 });
activitySchema.index({ user_id: 1, scheduled_date: 1 });
activitySchema.index({ tags: 1 });

export default mongoose.model('Activity', activitySchema);
