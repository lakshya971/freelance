import express from 'express';
import jwt from 'jsonwebtoken';
import ClientPortal from '../models/ClientPortal.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Proposal from '../models/Proposal.js';
import Invoice from '../models/Invoice.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Client portal authentication middleware
const clientPortalAuth = async (req, res, next) => {
  try {
    const token = req.header('x-client-auth-token');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const clientPortal = await ClientPortal.findById(decoded.clientPortalId).populate('client_id');
    
    if (!clientPortal || !clientPortal.is_active) {
      return res.status(401).json({ message: 'Token is not valid or account is inactive' });
    }

    req.clientPortal = clientPortal;
    req.client = clientPortal.client_id;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
};

// @route   POST /api/client-portal/register
// @desc    Register new client portal access (Admin only)
// @access  Private
router.post('/register', protect, async (req, res) => {
  try {
    const { client_id, username, password, permissions = {}, branding = {}, notification_settings = {} } = req.body;

    // Check if client exists
    const client = await Client.findById(client_id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check if portal already exists for this client
    const existingPortal = await ClientPortal.findOne({ client_id });
    if (existingPortal) {
      return res.status(400).json({ message: 'Portal access already exists for this client' });
    }

    // Check if username is taken
    const existingUsername = await ClientPortal.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    const clientPortal = new ClientPortal({
      client_id,
      username,
      password,
      permissions: { ...clientPortal.schema.paths.permissions.defaultValue, ...permissions },
      branding: { ...branding },
      notification_settings: { ...clientPortal.schema.paths.notification_settings.defaultValue, ...notification_settings },
      created_by: req.user.id
    });

    await clientPortal.save();

    // Remove password from response
    const response = clientPortal.toObject();
    delete response.password;

    res.status(201).json({
      message: 'Client portal access created successfully',
      portal: response
    });
  } catch (error) {
    console.error('Client portal registration error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/client-portal/login
// @desc    Client portal login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'];

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find client portal
    const clientPortal = await ClientPortal.findOne({ username }).populate('client_id');
    
    if (!clientPortal) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if account is locked
    if (clientPortal.isLocked) {
      return res.status(423).json({ 
        message: 'Account is temporarily locked due to too many failed login attempts',
        locked_until: clientPortal.locked_until
      });
    }

    // Check if account is active
    if (!clientPortal.is_active) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Verify password
    const isMatch = await clientPortal.matchPassword(password);
    
    // Record login attempt
    const sessionId = await clientPortal.recordLoginAttempt(isMatch, ipAddress, userAgent);
    
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        remaining_attempts: Math.max(0, 5 - clientPortal.login_attempts)
      });
    }

    // Generate JWT token
    const payload = {
      clientPortalId: clientPortal._id,
      clientId: clientPortal.client_id._id,
      sessionId: sessionId
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Prepare response data
    const response = {
      token,
      client: {
        id: clientPortal.client_id._id,
        name: clientPortal.client_id.name,
        email: clientPortal.client_id.email,
        company: clientPortal.client_id.company
      },
      permissions: clientPortal.permissions,
      branding: clientPortal.branding,
      last_login: clientPortal.last_login
    };

    res.json({
      message: 'Login successful',
      ...response
    });
  } catch (error) {
    console.error('Client portal login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/client-portal/logout
// @desc    Client portal logout
// @access  Private (Client Portal)
router.post('/logout', clientPortalAuth, async (req, res) => {
  try {
    const sessionId = jwt.decode(req.header('x-client-auth-token')).sessionId;
    
    // Deactivate session
    const session = req.clientPortal.sessions.find(s => s.session_id === sessionId);
    if (session) {
      session.is_active = false;
    }
    
    await req.clientPortal.logActivity(
      'logout',
      'User logged out',
      getClientIP(req)
    );

    await req.clientPortal.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Client portal logout error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/client-portal/dashboard
// @desc    Get client portal dashboard data
// @access  Private (Client Portal)
router.get('/dashboard', clientPortalAuth, async (req, res) => {
  try {
    const clientId = req.client._id;

    // Get active projects
    const projects = await Project.find({ 
      client_id: clientId, 
      status: { $in: ['active', 'in_progress', 'review'] }
    }).select('title description status start_date end_date budget progress milestones');

    // Get recent proposals
    const proposals = await Proposal.find({ 
      client_id: clientId 
    }).sort({ createdAt: -1 }).limit(5)
      .select('title status total_amount created_date valid_until');

    // Get pending invoices
    const invoices = await Invoice.find({ 
      'client.id': clientId,
      status: { $in: ['draft', 'sent', 'overdue'] }
    }).select('invoice_number amount due_date status items');

    // Get recent tasks (if permission allows)
    let recentTasks = [];
    if (req.clientPortal.permissions.view_tasks) {
      const projectIds = projects.map(p => p._id);
      recentTasks = await Task.find({ 
        project_id: { $in: projectIds },
        status: { $in: ['todo', 'in_progress', 'review'] }
      }).sort({ updatedAt: -1 }).limit(10)
        .populate('project_id', 'title')
        .select('title description status priority due_date project_id');
    }

    // Calculate statistics
    const stats = {
      active_projects: projects.length,
      pending_proposals: proposals.filter(p => p.status === 'pending').length,
      pending_invoices: invoices.filter(i => ['sent', 'overdue'].includes(i.status)).length,
      total_project_value: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      avg_project_progress: projects.length > 0 
        ? projects.reduce((sum, p) => sum + (p.progress || 0), 0) / projects.length 
        : 0
    };

    await req.clientPortal.logActivity(
      'dashboard_view',
      'Viewed dashboard',
      getClientIP(req)
    );

    res.json({
      client: {
        name: req.client.name,
        email: req.client.email,
        company: req.client.company
      },
      stats,
      projects,
      proposals,
      invoices,
      recent_tasks: recentTasks,
      branding: req.clientPortal.branding
    });
  } catch (error) {
    console.error('Client portal dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/client-portal/projects
// @desc    Get client projects
// @access  Private (Client Portal)
router.get('/projects', clientPortalAuth, async (req, res) => {
  try {
    if (!req.clientPortal.permissions.view_projects) {
      return res.status(403).json({ message: 'Access denied: No permission to view projects' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const clientId = req.client._id;

    const filter = { client_id: clientId };
    if (status) filter.status = status;

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('title description status start_date end_date budget progress milestones attachments');

    const total = await Project.countDocuments(filter);

    await req.clientPortal.logActivity(
      'projects_view',
      'Viewed projects list',
      getClientIP(req),
      { status, page, limit }
    );

    res.json({
      projects,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Client portal projects error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/client-portal/projects/:id
// @desc    Get specific project details
// @access  Private (Client Portal)
router.get('/projects/:id', clientPortalAuth, async (req, res) => {
  try {
    if (!req.clientPortal.permissions.view_projects) {
      return res.status(403).json({ message: 'Access denied: No permission to view projects' });
    }

    const project = await Project.findOne({ 
      _id: req.params.id, 
      client_id: req.client._id 
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get project tasks if permission allows
    let tasks = [];
    if (req.clientPortal.permissions.view_tasks) {
      tasks = await Task.find({ project_id: project._id })
        .sort({ created_at: -1 })
        .select('title description status priority due_date time_spent attachments');
    }

    await req.clientPortal.logActivity(
      'project_view',
      `Viewed project: ${project.title}`,
      getClientIP(req),
      { project_id: project._id }
    );

    res.json({
      project,
      tasks
    });
  } catch (error) {
    console.error('Client portal project details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/client-portal/invoices
// @desc    Get client invoices
// @access  Private (Client Portal)
router.get('/invoices', clientPortalAuth, async (req, res) => {
  try {
    if (!req.clientPortal.permissions.view_invoices) {
      return res.status(403).json({ message: 'Access denied: No permission to view invoices' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const clientId = req.client._id;

    const filter = { 'client.id': clientId };
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter)
      .sort({ created_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(filter);

    await req.clientPortal.logActivity(
      'invoices_view',
      'Viewed invoices list',
      getClientIP(req),
      { status, page, limit }
    );

    res.json({
      invoices,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Client portal invoices error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/client-portal/proposals
// @desc    Get client proposals
// @access  Private (Client Portal)
router.get('/proposals', clientPortalAuth, async (req, res) => {
  try {
    if (!req.clientPortal.permissions.view_proposals) {
      return res.status(403).json({ message: 'Access denied: No permission to view proposals' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const clientId = req.client._id;

    const filter = { client_id: clientId };
    if (status) filter.status = status;

    const proposals = await Proposal.find(filter)
      .sort({ created_date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Proposal.countDocuments(filter);

    await req.clientPortal.logActivity(
      'proposals_view',
      'Viewed proposals list',
      getClientIP(req),
      { status, page, limit }
    );

    res.json({
      proposals,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Client portal proposals error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/client-portal/proposals/:id/respond
// @desc    Respond to proposal (accept/reject)
// @access  Private (Client Portal)
router.put('/proposals/:id/respond', clientPortalAuth, async (req, res) => {
  try {
    const { action, feedback } = req.body; // action: 'accept' or 'reject'
    
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Invalid action. Use "accept" or "reject"' });
    }

    const proposal = await Proposal.findOne({ 
      _id: req.params.id, 
      client_id: req.client._id 
    });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({ message: 'Proposal has already been responded to' });
    }

    proposal.status = action === 'accept' ? 'accepted' : 'rejected';
    proposal.client_response = {
      action,
      feedback: feedback || '',
      responded_at: new Date(),
      responded_by: req.client._id
    };

    await proposal.save();

    await req.clientPortal.logActivity(
      'proposal_response',
      `${action === 'accept' ? 'Accepted' : 'Rejected'} proposal: ${proposal.title}`,
      getClientIP(req),
      { proposal_id: proposal._id, action, feedback }
    );

    res.json({
      message: `Proposal ${action}ed successfully`,
      proposal
    });
  } catch (error) {
    console.error('Client portal proposal response error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/client-portal/activity
// @desc    Get client portal activity log
// @access  Private (Client Portal)
router.get('/activity', clientPortalAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const activities = req.clientPortal.activity_log
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice((page - 1) * limit, page * limit);

    const total = req.clientPortal.activity_log.length;

    res.json({
      activities,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Client portal activity error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/client-portal/settings
// @desc    Update notification settings
// @access  Private (Client Portal)
router.put('/settings', clientPortalAuth, async (req, res) => {
  try {
    const { notification_settings } = req.body;

    if (notification_settings) {
      req.clientPortal.notification_settings = {
        ...req.clientPortal.notification_settings,
        ...notification_settings
      };
    }

    await req.clientPortal.save();

    await req.clientPortal.logActivity(
      'settings_update',
      'Updated notification settings',
      getClientIP(req),
      { updated_settings: notification_settings }
    );

    res.json({
      message: 'Settings updated successfully',
      notification_settings: req.clientPortal.notification_settings
    });
  } catch (error) {
    console.error('Client portal settings error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
