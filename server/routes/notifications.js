import express from 'express';
import EmailNotification from '../models/EmailNotification.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import { protect } from '../middleware/auth.js';
import nodemailer from 'nodemailer';
import cron from 'node-cron';

const router = express.Router();

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// @desc    Send manual progress update
// @route   POST /api/notifications/progress-update
// @access  Private
router.post('/progress-update', protect, async (req, res) => {
  try {
    const { project_id, custom_message, schedule_date } = req.body;
    
    // Create progress update email
    const emailNotification = await EmailNotification.createProgressUpdate(
      project_id, 
      req.user.id, 
      custom_message
    );
    
    // Schedule or send immediately
    if (schedule_date) {
      emailNotification.scheduled_at = new Date(schedule_date);
      await emailNotification.save();
      res.json({ success: true, message: 'Progress update scheduled successfully', notification: emailNotification });
    } else {
      // Send immediately
      await sendEmailNotification(emailNotification);
      res.json({ success: true, message: 'Progress update sent successfully', notification: emailNotification });
    }
  } catch (error) {
    console.error('Error sending progress update:', error);
    res.status(500).json({ message: 'Error sending progress update', error: error.message });
  }
});

// @desc    Get all notifications for user
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, type, limit = 50 } = req.query;
    
    let filter = { created_by: req.user.id };
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    
    const notifications = await EmailNotification.find(filter)
      .populate('project_id', 'title name')
      .populate('client_id', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
});

// @desc    Create custom notification
// @route   POST /api/notifications/custom
// @access  Private
router.post('/custom', protect, async (req, res) => {
  try {
    const { 
      recipient_email, 
      recipient_name, 
      subject, 
      body, 
      project_id, 
      client_id, 
      schedule_date 
    } = req.body;
    
    const notification = await EmailNotification.create({
      recipient_email,
      recipient_name,
      subject,
      body,
      type: 'custom',
      project_id,
      client_id,
      scheduled_at: schedule_date ? new Date(schedule_date) : new Date(),
      created_by: req.user.id
    });
    
    if (!schedule_date) {
      await sendEmailNotification(notification);
    }
    
    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('Error creating custom notification:', error);
    res.status(500).json({ message: 'Error creating notification', error: error.message });
  }
});

// @desc    Setup automated notifications for a project
// @route   POST /api/notifications/setup-automation
// @access  Private
router.post('/setup-automation', protect, async (req, res) => {
  try {
    const { project_id, frequency, milestone_notifications, payment_reminders } = req.body;
    
    const project = await Project.findOne({ _id: project_id, createdBy: req.user.id });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update project automation settings
    project.update_frequency = frequency;
    project.auto_progress_updates = true;
    project.email_notifications = true;
    
    // Calculate next update date based on frequency
    const now = new Date();
    let nextUpdate = new Date(now);
    
    switch (frequency) {
      case 'daily':
        nextUpdate.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextUpdate.setDate(now.getDate() + 7);
        break;
      case 'bi-weekly':
        nextUpdate.setDate(now.getDate() + 14);
        break;
      case 'monthly':
        nextUpdate.setMonth(now.getMonth() + 1);
        break;
    }
    
    project.next_update_due = nextUpdate;
    await project.save();
    
    res.json({ success: true, message: 'Automation setup completed', project });
  } catch (error) {
    console.error('Error setting up automation:', error);
    res.status(500).json({ message: 'Error setting up automation', error: error.message });
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await EmailNotification.findOneAndDelete({
      _id: req.params.id,
      created_by: req.user.id
    });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification', error: error.message });
  }
});

// @desc    Track email open
// @route   GET /api/notifications/track/:trackingId
// @access  Public
router.get('/track/:trackingId', async (req, res) => {
  try {
    const notification = await EmailNotification.findOne({ 
      tracking_id: req.params.trackingId 
    });
    
    if (notification && !notification.opened_at) {
      notification.opened_at = new Date();
      await notification.save();
    }
    
    // Return a 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(pixel);
  } catch (error) {
    console.error('Error tracking email open:', error);
    res.status(500).end();
  }
});

// Helper function to send email notification
async function sendEmailNotification(notification) {
  try {
    const transporter = createTransporter();
    
    const htmlBody = notification.html_body || notification.body.replace(/\n/g, '<br>');
    const trackingPixel = `<img src="${process.env.API_URL}/api/notifications/track/${notification.tracking_id}" width="1" height="1" style="display:none;" />`;
    
    await transporter.sendMail({
      from: `${process.env.FROM_NAME || 'FreelanceFlow'} <${process.env.FROM_EMAIL}>`,
      to: notification.recipient_email,
      subject: notification.subject,
      text: notification.body,
      html: htmlBody + trackingPixel
    });
    
    notification.status = 'sent';
    notification.sent_at = new Date();
    await notification.save();
    
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    notification.status = 'failed';
    notification.error_message = error.message;
    notification.retry_count += 1;
    await notification.save();
    
    throw error;
  }
}

// Automated email sender (runs every hour)
cron.schedule('0 * * * *', async () => {
  console.log('🕐 Running scheduled email sender...');
  
  try {
    const pendingEmails = await EmailNotification.find({
      status: 'pending',
      scheduled_at: { $lte: new Date() },
      retry_count: { $lt: 3 }
    });
    
    console.log(`📧 Found ${pendingEmails.length} emails to send`);
    
    for (const email of pendingEmails) {
      try {
        await sendEmailNotification(email);
        console.log(`✅ Sent email: ${email.subject} to ${email.recipient_email}`);
      } catch (error) {
        console.error(`❌ Failed to send email: ${email.subject}`, error.message);
      }
    }
  } catch (error) {
    console.error('Error in scheduled email sender:', error);
  }
});

// Auto-generate progress updates (runs daily at 9 AM)
cron.schedule('0 9 * * *', async () => {
  console.log('🔄 Generating automated progress updates...');
  
  try {
    const projects = await Project.find({
      auto_progress_updates: true,
      next_update_due: { $lte: new Date() },
      status: { $in: ['in_progress', 'planning'] }
    });
    
    for (const project of projects) {
      try {
        await EmailNotification.createProgressUpdate(project._id, project.createdBy);
        
        // Calculate next update date
        const nextUpdate = new Date();
        switch (project.update_frequency) {
          case 'daily':
            nextUpdate.setDate(nextUpdate.getDate() + 1);
            break;
          case 'weekly':
            nextUpdate.setDate(nextUpdate.getDate() + 7);
            break;
          case 'bi-weekly':
            nextUpdate.setDate(nextUpdate.getDate() + 14);
            break;
          case 'monthly':
            nextUpdate.setMonth(nextUpdate.getMonth() + 1);
            break;
        }
        
        project.next_update_due = nextUpdate;
        project.last_client_update = new Date();
        await project.save();
        
        console.log(`✅ Created progress update for project: ${project.title}`);
      } catch (error) {
        console.error(`❌ Failed to create progress update for project: ${project.title}`, error);
      }
    }
  } catch (error) {
    console.error('Error in automated progress updates:', error);
  }
});

export default router;
