import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const clientPortalSchema = new mongoose.Schema({
  // Client portal credentials
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  
  // Access control
  is_active: { type: Boolean, default: true },
  last_login: { type: Date },
  login_attempts: { type: Number, default: 0 },
  locked_until: { type: Date },
  
  // Portal settings
  permissions: {
    view_proposals: { type: Boolean, default: true },
    view_projects: { type: Boolean, default: true },
    view_tasks: { type: Boolean, default: true },
    view_invoices: { type: Boolean, default: true },
    download_files: { type: Boolean, default: true },
    approve_deliverables: { type: Boolean, default: true },
    request_revisions: { type: Boolean, default: true },
    send_messages: { type: Boolean, default: true }
  },
  
  // Portal customization
  branding: {
    logo_url: { type: String },
    primary_color: { type: String, default: '#10B981' },
    welcome_message: { type: String }
  },
  
  // Notification preferences
  notification_settings: {
    email_updates: { type: Boolean, default: true },
    sms_updates: { type: Boolean, default: false },
    browser_notifications: { type: Boolean, default: true },
    milestone_notifications: { type: Boolean, default: true },
    invoice_notifications: { type: Boolean, default: true }
  },
  
  // Session management
  sessions: [{
    session_id: String,
    ip_address: String,
    user_agent: String,
    created_at: { type: Date, default: Date.now },
    expires_at: Date,
    is_active: { type: Boolean, default: true }
  }],
  
  // Activity tracking
  activity_log: [{
    action: String,
    description: String,
    ip_address: String,
    timestamp: { type: Date, default: Date.now },
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // User reference (freelancer who created this portal access)
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Hash password before saving
clientPortalSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  this.updatedAt = new Date();
  next();
});

// Method to check password
clientPortalSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to record login attempt
clientPortalSchema.methods.recordLoginAttempt = async function(success, ipAddress, userAgent) {
  if (success) {
    this.last_login = new Date();
    this.login_attempts = 0;
    this.locked_until = undefined;
    
    // Create new session
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    this.sessions.push({
      session_id: sessionId,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt
    });
    
    // Keep only last 5 sessions
    if (this.sessions.length > 5) {
      this.sessions = this.sessions.slice(-5);
    }
  } else {
    this.login_attempts += 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (this.login_attempts >= 5) {
      this.locked_until = new Date(Date.now() + 30 * 60 * 1000);
    }
  }
  
  // Log the activity
  this.activity_log.push({
    action: success ? 'login_success' : 'login_failed',
    description: success ? 'Successful login' : 'Failed login attempt',
    ip_address: ipAddress,
    metadata: { user_agent: userAgent }
  });
  
  await this.save();
  
  return success ? this.sessions[this.sessions.length - 1].session_id : null;
};

// Method to log activity
clientPortalSchema.methods.logActivity = async function(action, description, ipAddress, metadata = {}) {
  this.activity_log.push({
    action,
    description,
    ip_address: ipAddress,
    metadata
  });
  
  // Keep only last 100 activity entries
  if (this.activity_log.length > 100) {
    this.activity_log = this.activity_log.slice(-100);
  }
  
  await this.save();
};

// Virtual to check if account is locked
clientPortalSchema.virtual('isLocked').get(function() {
  return this.locked_until && this.locked_until > new Date();
});

// Method to validate session
clientPortalSchema.methods.validateSession = function(sessionId) {
  const session = this.sessions.find(s => 
    s.session_id === sessionId && 
    s.is_active && 
    s.expires_at > new Date()
  );
  
  return !!session;
};

clientPortalSchema.index({ client_id: 1 });
clientPortalSchema.index({ username: 1 });
clientPortalSchema.index({ 'sessions.session_id': 1 });

export default mongoose.model('ClientPortal', clientPortalSchema);
