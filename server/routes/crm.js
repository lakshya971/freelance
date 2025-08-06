import express from 'express';
import Activity from '../models/Activity.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import Proposal from '../models/Proposal.js';
import Invoice from '../models/Invoice.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/crm/dashboard
// @desc    Get CRM dashboard with activity summary and client insights
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Get activity summary
    const activitySummary = await Activity.getActivitySummary(req.user.id, startDate, now);

    // Get recent activities
    const recentActivities = await Activity.find({
      user_id: req.user.id,
      createdAt: { $gte: startDate }
    })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('related_to.entity_id', 'name title')
    .select('type title description related_to priority status createdAt contact_details financial_impact');

    // Get upcoming follow-ups
    const upcomingFollowUps = await Activity.find({
      user_id: req.user.id,
      'follow_up.is_required': true,
      'follow_up.completed': false,
      'follow_up.due_date': { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ 'follow_up.due_date': 1 })
    .limit(10)
    .populate('related_to.entity_id', 'name title');

    // Get client engagement metrics
    const clientActivities = await Activity.find({
      user_id: req.user.id,
      'related_to.entity_type': 'client',
      createdAt: { $gte: startDate }
    }).populate('related_to.entity_id', 'name company');

    // Group by client
    const clientEngagement = {};
    clientActivities.forEach(activity => {
      const clientId = activity.related_to.entity_id?._id?.toString();
      if (clientId) {
        if (!clientEngagement[clientId]) {
          clientEngagement[clientId] = {
            client_id: clientId,
            client_name: activity.related_to.entity_id.name,
            company: activity.related_to.entity_id.company,
            activity_count: 0,
            last_contact: null,
            engagement_score: 0
          };
        }
        clientEngagement[clientId].activity_count++;
        
        if (!clientEngagement[clientId].last_contact || 
            activity.createdAt > clientEngagement[clientId].last_contact) {
          clientEngagement[clientId].last_contact = activity.createdAt;
        }
      }
    });

    // Calculate engagement scores
    Object.values(clientEngagement).forEach(client => {
      const daysSinceContact = client.last_contact 
        ? (now - new Date(client.last_contact)) / (1000 * 60 * 60 * 24)
        : 999;
      
      // Score based on activity frequency and recency
      client.engagement_score = Math.max(0, 100 - (daysSinceContact * 2) + (client.activity_count * 5));
    });

    // Get overdue activities
    const overdueActivities = await Activity.find({
      user_id: req.user.id,
      status: { $in: ['pending', 'in_progress'] },
      scheduled_date: { $lt: now }
    }).sort({ scheduled_date: 1 }).limit(10);

    res.json({
      period,
      date_range: { start: startDate, end: now },
      activity_summary: activitySummary,
      recent_activities: recentActivities,
      upcoming_follow_ups: upcomingFollowUps,
      client_engagement: Object.values(clientEngagement)
        .sort((a, b) => b.engagement_score - a.engagement_score)
        .slice(0, 10),
      overdue_activities: overdueActivities,
      metrics: {
        total_clients_contacted: Object.keys(clientEngagement).length,
        average_engagement_score: Object.values(clientEngagement).length > 0
          ? Object.values(clientEngagement).reduce((sum, c) => sum + c.engagement_score, 0) / Object.values(clientEngagement).length
          : 0,
        activities_completed_on_time: await Activity.countDocuments({
          user_id: req.user.id,
          status: 'completed',
          completed_date: { $gte: startDate },
          $expr: { $lte: ['$completed_date', '$scheduled_date'] }
        })
      }
    });
  } catch (error) {
    console.error('CRM dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/crm/activities
// @desc    Get activities with filtering and pagination
// @access  Private
router.get('/activities', protect, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      status, 
      priority, 
      entity_type, 
      entity_id,
      start_date,
      end_date,
      search,
      tags
    } = req.query;

    // Build filter query
    const filter = { user_id: req.user.id };
    
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (entity_type) filter['related_to.entity_type'] = entity_type;
    if (entity_id) filter['related_to.entity_id'] = entity_id;
    if (tags) filter.tags = { $in: tags.split(',') };

    // Date range filter
    if (start_date || end_date) {
      filter.createdAt = {};
      if (start_date) filter.createdAt.$gte = new Date(start_date);
      if (end_date) filter.createdAt.$lte = new Date(end_date);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'related_to.entity_name': { $regex: search, $options: 'i' } }
      ];
    }

    const activities = await Activity.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('related_to.entity_id', 'name title company')
      .populate('created_by', 'name email')
      .populate('follow_up.assigned_to', 'name email');

    const total = await Activity.countDocuments(filter);

    // Get filter options for frontend
    const filterOptions = {
      types: await Activity.distinct('type', { user_id: req.user.id }),
      statuses: await Activity.distinct('status', { user_id: req.user.id }),
      priorities: await Activity.distinct('priority', { user_id: req.user.id }),
      entity_types: await Activity.distinct('related_to.entity_type', { user_id: req.user.id }),
      tags: await Activity.distinct('tags', { user_id: req.user.id })
    };

    res.json({
      activities,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      },
      filter_options: filterOptions
    });
  } catch (error) {
    console.error('Activities fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/crm/activities
// @desc    Create new activity
// @access  Private
router.post('/activities', protect, async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      user_id: req.user.id,
      created_by: req.user.id
    };

    // Auto-set entity_name if entity_id is provided
    if (activityData.related_to?.entity_id && activityData.related_to?.entity_type) {
      let entity;
      switch (activityData.related_to.entity_type) {
        case 'client':
          entity = await Client.findById(activityData.related_to.entity_id);
          activityData.related_to.entity_name = entity?.name;
          break;
        case 'project':
          entity = await Project.findById(activityData.related_to.entity_id);
          activityData.related_to.entity_name = entity?.title;
          break;
        case 'proposal':
          entity = await Proposal.findById(activityData.related_to.entity_id);
          activityData.related_to.entity_name = entity?.title;
          break;
        case 'invoice':
          entity = await Invoice.findById(activityData.related_to.entity_id);
          activityData.related_to.entity_name = entity?.invoice_number;
          break;
      }
    }

    const activity = new Activity(activityData);
    await activity.save();

    // Calculate metrics
    activity.calculateMetrics();
    await activity.save();

    // Create follow-up if required
    if (activity.follow_up?.is_required) {
      await activity.createFollowUp();
    }

    await activity.populate([
      { path: 'related_to.entity_id', select: 'name title company' },
      { path: 'created_by', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    console.error('Activity creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/crm/activities/:id
// @desc    Update activity
// @access  Private
router.put('/activities/:id', protect, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key !== 'user_id' && key !== 'created_by') {
        activity[key] = req.body[key];
      }
    });

    activity.updated_by = req.user.id;
    activity.calculateMetrics();
    
    await activity.save();

    await activity.populate([
      { path: 'related_to.entity_id', select: 'name title company' },
      { path: 'created_by', select: 'name email' },
      { path: 'updated_by', select: 'name email' }
    ]);

    res.json({
      message: 'Activity updated successfully',
      activity
    });
  } catch (error) {
    console.error('Activity update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/crm/activities/:id
// @desc    Delete activity
// @access  Private
router.delete('/activities/:id', protect, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Delete child activities if any
    if (activity.child_activities.length > 0) {
      await Activity.deleteMany({
        _id: { $in: activity.child_activities },
        user_id: req.user.id
      });
    }

    await Activity.deleteOne({ _id: activity._id });

    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Activity deletion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/crm/activities/:id
// @desc    Get single activity with full details
// @access  Private
router.get('/activities/:id', protect, async (req, res) => {
  try {
    const activity = await Activity.findOne({
      _id: req.params.id,
      user_id: req.user.id
    })
    .populate('related_to.entity_id')
    .populate('created_by', 'name email')
    .populate('updated_by', 'name email')
    .populate('follow_up.assigned_to', 'name email')
    .populate('parent_activity_id', 'title type createdAt')
    .populate('child_activities', 'title type status createdAt');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.json({ activity });
  } catch (error) {
    console.error('Activity fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/crm/activities/:id/complete
// @desc    Mark activity as completed
// @access  Private
router.put('/activities/:id/complete', protect, async (req, res) => {
  try {
    const { notes, outcome, next_steps } = req.body;
    
    const activity = await Activity.findOne({
      _id: req.params.id,
      user_id: req.user.id
    });

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    activity.status = 'completed';
    activity.completed_date = new Date();
    
    if (notes) activity.description = (activity.description || '') + '\n\nCompletion Notes: ' + notes;
    if (outcome) activity.contact_details = { ...activity.contact_details, outcome };
    if (next_steps) activity.contact_details = { ...activity.contact_details, next_steps };
    
    activity.calculateMetrics();
    await activity.save();

    // Create follow-up if required
    if (activity.follow_up?.is_required && !activity.follow_up?.completed) {
      const followUp = await activity.createFollowUp({ 
        description: next_steps || activity.follow_up.notes 
      });
      
      return res.json({
        message: 'Activity completed and follow-up created',
        activity,
        follow_up: followUp
      });
    }

    res.json({
      message: 'Activity completed successfully',
      activity
    });
  } catch (error) {
    console.error('Activity completion error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/crm/client-timeline/:clientId
// @desc    Get complete activity timeline for a specific client
// @access  Private
router.get('/client-timeline/:clientId', protect, async (req, res) => {
  try {
    const { clientId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    // Verify client belongs to user
    const client = await Client.findOne({
      _id: clientId,
      created_by: req.user.id
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Get all activities related to this client
    const activities = await Activity.find({
      user_id: req.user.id,
      'related_to.entity_id': clientId
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('created_by', 'name email');

    // Get related projects for context
    const projects = await Project.find({
      client_id: clientId,
      created_by: req.user.id
    }).select('title status start_date end_date budget');

    // Get related proposals
    const proposals = await Proposal.find({
      client_id: clientId,
      created_by: req.user.id
    }).select('title status total_amount created_date');

    // Get related invoices
    const invoices = await Invoice.find({
      'client.id': clientId,
      created_by: req.user.id
    }).select('invoice_number amount status due_date');

    const total = await Activity.countDocuments({
      user_id: req.user.id,
      'related_to.entity_id': clientId
    });

    // Calculate client engagement metrics
    const engagementMetrics = {
      total_interactions: activities.length,
      last_contact: activities.length > 0 ? activities[0].createdAt : null,
      interaction_frequency: activities.length > 0 ? activities.length / Math.max(1, (Date.now() - new Date(client.createdAt)) / (1000 * 60 * 60 * 24 * 30)) : 0, // per month
      most_common_interaction: activities.length > 0 ? 
        activities.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {}) : {},
      revenue_generated: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0)
    };

    res.json({
      client: {
        id: client._id,
        name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        created_at: client.createdAt
      },
      timeline: activities,
      related_data: {
        projects,
        proposals,
        invoices
      },
      engagement_metrics: engagementMetrics,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Client timeline error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/crm/quick-actions/contact-client
// @desc    Quick action to log client contact
// @access  Private
router.post('/quick-actions/contact-client', protect, async (req, res) => {
  try {
    const {
      client_id,
      contact_method,
      duration,
      outcome,
      next_steps,
      follow_up_required = false,
      follow_up_date,
      satisfaction_score
    } = req.body;

    // Verify client
    const client = await Client.findOne({
      _id: client_id,
      created_by: req.user.id
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Create contact activity
    const activity = new Activity({
      user_id: req.user.id,
      type: 'client_contacted',
      title: `${contact_method} with ${client.name}`,
      description: outcome || `Contacted ${client.name} via ${contact_method}`,
      related_to: {
        entity_type: 'client',
        entity_id: client_id,
        entity_name: client.name
      },
      contact_method,
      contact_details: {
        duration: parseInt(duration) || 0,
        outcome,
        next_steps
      },
      follow_up: {
        is_required: follow_up_required,
        due_date: follow_up_required ? new Date(follow_up_date) : null,
        notes: next_steps
      },
      metrics: {
        satisfaction_score: satisfaction_score ? parseInt(satisfaction_score) : null
      },
      created_by: req.user.id
    });

    activity.calculateMetrics();
    await activity.save();

    // Create follow-up if required
    let followUp = null;
    if (follow_up_required) {
      followUp = await activity.createFollowUp({
        title: `Follow-up: ${activity.title}`,
        description: next_steps,
        scheduled_date: new Date(follow_up_date)
      });
    }

    res.status(201).json({
      message: 'Client contact logged successfully',
      activity,
      follow_up: followUp
    });
  } catch (error) {
    console.error('Quick action contact client error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/crm/reports/engagement
// @desc    Get client engagement report
// @access  Private
router.get('/reports/engagement', protect, async (req, res) => {
  try {
    const { period = 'month', start_date, end_date } = req.query;
    
    // Calculate date range
    let startDate, endDate;
    if (start_date && end_date) {
      startDate = new Date(start_date);
      endDate = new Date(end_date);
    } else {
      const now = new Date();
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
        case 'quarter':
          const quarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), quarter * 3, 1);
          endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      }
    }

    // Get all client activities in period
    const activities = await Activity.find({
      user_id: req.user.id,
      'related_to.entity_type': 'client',
      createdAt: { $gte: startDate, $lte: endDate }
    }).populate('related_to.entity_id', 'name company');

    // Group by client and calculate metrics
    const clientMetrics = {};
    
    activities.forEach(activity => {
      const clientId = activity.related_to.entity_id?._id?.toString();
      if (!clientId) return;

      if (!clientMetrics[clientId]) {
        clientMetrics[clientId] = {
          client_id: clientId,
          client_name: activity.related_to.entity_id.name,
          company: activity.related_to.entity_id.company,
          total_activities: 0,
          contact_methods: {},
          satisfaction_scores: [],
          total_contact_time: 0,
          last_contact: null,
          first_contact: null
        };
      }

      const client = clientMetrics[clientId];
      client.total_activities++;
      
      if (activity.contact_method) {
        client.contact_methods[activity.contact_method] = (client.contact_methods[activity.contact_method] || 0) + 1;
      }
      
      if (activity.metrics?.satisfaction_score) {
        client.satisfaction_scores.push(activity.metrics.satisfaction_score);
      }
      
      if (activity.contact_details?.duration) {
        client.total_contact_time += activity.contact_details.duration;
      }
      
      if (!client.last_contact || activity.createdAt > client.last_contact) {
        client.last_contact = activity.createdAt;
      }
      
      if (!client.first_contact || activity.createdAt < client.first_contact) {
        client.first_contact = activity.createdAt;
      }
    });

    // Calculate final metrics
    Object.values(clientMetrics).forEach(client => {
      client.average_satisfaction = client.satisfaction_scores.length > 0
        ? client.satisfaction_scores.reduce((sum, score) => sum + score, 0) / client.satisfaction_scores.length
        : null;
      
      client.engagement_frequency = client.total_activities / Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24 * 7)); // per week
      
      client.preferred_contact_method = Object.keys(client.contact_methods).length > 0
        ? Object.keys(client.contact_methods).reduce((a, b) => client.contact_methods[a] > client.contact_methods[b] ? a : b)
        : null;
    });

    // Sort by engagement score
    const sortedClients = Object.values(clientMetrics)
      .sort((a, b) => b.total_activities - a.total_activities);

    // Calculate overall metrics
    const overallMetrics = {
      total_clients_engaged: Object.keys(clientMetrics).length,
      total_activities: activities.length,
      average_activities_per_client: Object.keys(clientMetrics).length > 0
        ? activities.length / Object.keys(clientMetrics).length
        : 0,
      most_active_day: activities.length > 0
        ? activities.reduce((acc, activity) => {
            const day = activity.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
            acc[day] = (acc[day] || 0) + 1;
            return acc;
          }, {})
        : {},
      contact_method_distribution: activities.reduce((acc, activity) => {
        if (activity.contact_method) {
          acc[activity.contact_method] = (acc[activity.contact_method] || 0) + 1;
        }
        return acc;
      }, {})
    };

    res.json({
      period,
      date_range: { start: startDate, end: endDate },
      overall_metrics: overallMetrics,
      client_engagement: sortedClients,
      top_engaged_clients: sortedClients.slice(0, 10),
      engagement_trends: {
        daily_activity: activities.reduce((acc, activity) => {
          const date = activity.createdAt.toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Engagement report error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
