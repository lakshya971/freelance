import mongoose from 'mongoose';

const emailNotificationSchema = new mongoose.Schema({
  // Email details
  recipient_email: { type: String, required: true },
  recipient_name: { type: String },
  subject: { type: String, required: true },
  body: { type: String, required: true },
  html_body: { type: String },
  
  // Notification type and context
  type: { 
    type: String, 
    enum: ['progress_update', 'milestone_completed', 'project_overdue', 'payment_reminder', 'proposal_viewed', 'invoice_sent', 'custom'], 
    required: true 
  },
  
  // Related entities
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  invoice_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  proposal_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Proposal' },
  
  // Scheduling
  scheduled_at: { type: Date },
  sent_at: { type: Date },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  
  // Error handling
  error_message: { type: String },
  retry_count: { type: Number, default: 0 },
  max_retries: { type: Number, default: 3 },
  
  // Template and personalization
  template_id: { type: String },
  template_variables: { type: mongoose.Schema.Types.Mixed },
  
  // Tracking
  opened_at: { type: Date },
  clicked_at: { type: Date },
  tracking_id: { type: String, unique: true },
  
  // User reference
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Generate unique tracking ID
emailNotificationSchema.pre('save', function(next) {
  if (!this.tracking_id) {
    this.tracking_id = `track_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  this.updatedAt = new Date();
  next();
});

// Static method to create progress update email
emailNotificationSchema.statics.createProgressUpdate = async function(projectId, userId, customMessage = null) {
  try {
    const Project = mongoose.model('Project');
    const Task = mongoose.model('Task');
    const Client = mongoose.model('Client');
    
    const project = await Project.findById(projectId).populate('clientId');
    const tasks = await Task.find({ project_id: projectId });
    
    if (!project || !project.clientId) {
      throw new Error('Project or client not found');
    }
    
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const totalTasks = tasks.length;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const upcomingTasks = tasks
      .filter(t => t.status !== 'done' && t.deadline)
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
      .slice(0, 5);
    
    const recentCompletedTasks = tasks
      .filter(t => t.status === 'done' && t.completed_at)
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
      .slice(0, 5);
    
    const subject = `Progress Update: ${project.title} - ${progressPercentage}% Complete`;
    
    const body = `
Dear ${project.clientId.name},

I hope this email finds you well. I wanted to provide you with an update on the progress of your project "${project.title}".

Project Progress: ${progressPercentage}% Complete
Tasks Completed: ${completedTasks} out of ${totalTasks}

Recent Completed Tasks:
${recentCompletedTasks.map(task => `• ${task.title}`).join('\n')}

Upcoming Tasks:
${upcomingTasks.map(task => `• ${task.title} (Due: ${new Date(task.deadline).toLocaleDateString()})`).join('\n')}

${customMessage || 'Everything is progressing smoothly, and I\'ll keep you updated as we move forward.'}

If you have any questions or concerns, please don\'t hesitate to reach out.

Best regards,
Your Project Manager
    `.trim();
    
    return await this.create({
      recipient_email: project.clientId.email,
      recipient_name: project.clientId.name,
      subject,
      body,
      type: 'progress_update',
      project_id: projectId,
      client_id: project.clientId._id,
      template_variables: {
        project_name: project.title,
        progress_percentage: progressPercentage,
        completed_tasks: completedTasks,
        total_tasks: totalTasks,
        recent_completed: recentCompletedTasks,
        upcoming_tasks: upcomingTasks,
        custom_message: customMessage
      },
      created_by: userId
    });
  } catch (error) {
    console.error('Error creating progress update email:', error);
    throw error;
  }
};

// Static method to send scheduled emails
emailNotificationSchema.statics.sendScheduledEmails = async function() {
  const nodemailer = require('nodemailer');
  
  const pendingEmails = await this.find({
    status: 'pending',
    scheduled_at: { $lte: new Date() }
  });
  
  // Configure email transporter (you'll need to set up SMTP settings)
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  
  for (const email of pendingEmails) {
    try {
      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: email.recipient_email,
        subject: email.subject,
        text: email.body,
        html: email.html_body || email.body.replace(/\n/g, '<br>')
      });
      
      email.status = 'sent';
      email.sent_at = new Date();
      await email.save();
      
    } catch (error) {
      console.error('Error sending email:', error);
      email.error_message = error.message;
      email.retry_count += 1;
      
      if (email.retry_count >= email.max_retries) {
        email.status = 'failed';
      }
      
      await email.save();
    }
  }
};

emailNotificationSchema.index({ created_by: 1, status: 1 });
emailNotificationSchema.index({ scheduled_at: 1, status: 1 });
emailNotificationSchema.index({ tracking_id: 1 });

export default mongoose.model('EmailNotification', emailNotificationSchema);
