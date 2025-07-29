import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, company, skills } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, bio, company, skills },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Error updating profile', 
      error: error.message 
    });
  }
});

// @desc    Upgrade subscription
// @route   POST /api/users/upgrade
// @access  Private
router.post('/upgrade', protect, async (req, res) => {
  try {
    const { plan } = req.body;
    
    const subscriptionLimits = {
      free: { proposalsLimit: 1 },
      pro: { proposalsLimit: -1 }, // Unlimited
      premium: { proposalsLimit: -1 },
      lifetime: { proposalsLimit: -1 }
    };

    if (!subscriptionLimits[plan]) {
      return res.status(400).json({ message: 'Invalid subscription plan' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        'subscription.plan': plan,
        'subscription.proposalsLimit': subscriptionLimits[plan].proposalsLimit,
        'subscription.status': 'active'
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan} plan`,
      user
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ 
      message: 'Error upgrading subscription', 
      error: error.message 
    });
  }
});

export default router;