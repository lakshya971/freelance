import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['freelancer', 'client'],
    default: 'freelancer'
  },
  avatar: {
    type: String,
    default: ''
  },
  company: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  skills: [{
    type: String,
    trim: true
  }],
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'pro', 'premium', 'lifetime'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'canceled'],
      default: 'active'
    },
    expiresAt: Date,
    proposalsUsed: {
      type: Number,
      default: 0
    },
    proposalsLimit: {
      type: Number,
      default: 5 // Free tier gets 5 proposals for testing
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLoginAt: Date,
  refreshTokens: [{
    token: {
      type: String,
      required: true
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      deviceId: String
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 days
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  rememberMe: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if user can create more proposals
userSchema.methods.canCreateProposal = function() {
  return this.subscription.proposalsUsed < this.subscription.proposalsLimit;
};

// Increment proposal usage
userSchema.methods.incrementProposalUsage = async function() {
  this.subscription.proposalsUsed += 1;
  await this.save();
};

// Add refresh token
userSchema.methods.addRefreshToken = async function(token, deviceInfo) {
  // Remove old tokens for this device if any
  this.refreshTokens = this.refreshTokens.filter(rt => 
    !(rt.deviceInfo.deviceId === deviceInfo.deviceId && rt.isActive)
  );
  
  // Add new token
  this.refreshTokens.push({
    token,
    deviceInfo,
    isActive: true
  });
  
  // Keep only last 5 active tokens per user
  const activeTokens = this.refreshTokens.filter(rt => rt.isActive);
  if (activeTokens.length > 5) {
    const oldestToken = activeTokens.sort((a, b) => a.createdAt - b.createdAt)[0];
    oldestToken.isActive = false;
  }
  
  await this.save();
};

// Remove refresh token
userSchema.methods.removeRefreshToken = async function(token) {
  const tokenIndex = this.refreshTokens.findIndex(rt => rt.token === token && rt.isActive);
  if (tokenIndex > -1) {
    this.refreshTokens[tokenIndex].isActive = false;
    await this.save();
  }
};

// Validate refresh token
userSchema.methods.isValidRefreshToken = function(token) {
  return this.refreshTokens.some(rt => rt.token === token && rt.isActive);
};

export default mongoose.model('User', userSchema);