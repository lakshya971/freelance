import express from 'express';
import Analytics from '../models/Analytics.js';
import Project from '../models/Project.js';
import Invoice from '../models/Invoice.js';
import Proposal from '../models/Proposal.js';
import Client from '../models/Client.js';
import Task from '../models/Task.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper function to get date ranges
const getDateRange = (period, customStart, customEnd) => {
  const now = new Date();
  let start, end;

  switch (period) {
    case 'daily':
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      const weekStart = now.getDate() - now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), weekStart);
      end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      break;
    case 'custom':
      start = new Date(customStart);
      end = new Date(customEnd);
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return { start, end };
};

// @route   GET /api/analytics/dashboard
// @desc    Get comprehensive analytics dashboard
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    const { period = 'monthly', start_date, end_date } = req.query;
    const { start, end } = getDateRange(period, start_date, end_date);

    // Check if analytics already exist for this period
    let analytics = await Analytics.findOne({
      user_id: req.user.id,
      period,
      start_date: start,
      end_date: end
    });

    // If analytics don't exist or are older than 1 hour, regenerate
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (!analytics || analytics.generated_at < oneHourAgo) {
      if (analytics) {
        await Analytics.deleteOne({ _id: analytics._id });
      }

      analytics = new Analytics({
        user_id: req.user.id,
        period,
        start_date: start,
        end_date: end
      });

      await analytics.generateCompleteAnalytics();
      await analytics.save();
    }

    res.json({
      period,
      date_range: { start, end },
      analytics: analytics.toObject(),
      generated_at: analytics.generated_at,
      computation_time: analytics.computation_time
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/revenue
// @desc    Get detailed revenue analytics
// @access  Private
router.get('/revenue', protect, async (req, res) => {
  try {
    const { period = 'monthly', months = 12 } = req.query;
    const results = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const invoices = await Invoice.find({
        created_by: req.user.id,
        created_date: { $gte: start, $lte: end }
      });

      const monthlyData = {
        month: start.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        total_revenue: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (inv.amount || 0), 0),
        pending_revenue: invoices.filter(inv => inv.status === 'sent').reduce((sum, inv) => sum + (inv.amount || 0), 0),
        overdue_revenue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (inv.amount || 0), 0),
        invoice_count: invoices.length,
        paid_count: invoices.filter(inv => inv.status === 'paid').length
      };

      results.push(monthlyData);
    }

    // Calculate cumulative data
    let cumulative = 0;
    results.forEach(month => {
      cumulative += month.total_revenue;
      month.cumulative_revenue = cumulative;
    });

    // Calculate growth rates
    for (let i = 1; i < results.length; i++) {
      const current = results[i].total_revenue;
      const previous = results[i - 1].total_revenue;
      results[i].growth_rate = previous > 0 ? ((current - previous) / previous) * 100 : 0;
    }

    res.json({
      period: `${months} months`,
      revenue_trend: results,
      summary: {
        total_revenue: results.reduce((sum, month) => sum + month.total_revenue, 0),
        average_monthly: results.reduce((sum, month) => sum + month.total_revenue, 0) / results.length,
        peak_month: results.reduce((max, month) => month.total_revenue > max.total_revenue ? month : max, results[0]),
        growth_trend: results.length > 1 ? results[results.length - 1].growth_rate : 0
      }
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/clients
// @desc    Get client analytics and insights
// @access  Private
router.get('/clients', protect, async (req, res) => {
  try {
    const { period = 'yearly' } = req.query;
    const { start, end } = getDateRange(period);

    // Get all clients with their project and revenue data
    const clients = await Client.find({ created_by: req.user.id });
    const projects = await Project.find({ 
      created_by: req.user.id,
      createdAt: { $gte: start, $lte: end }
    });
    const invoices = await Invoice.find({ 
      created_by: req.user.id,
      created_date: { $gte: start, $lte: end },
      status: 'paid'
    });

    // Calculate client metrics
    const clientMetrics = clients.map(client => {
      const clientProjects = projects.filter(p => p.client_id?.toString() === client._id.toString());
      const clientInvoices = invoices.filter(inv => inv.client?.id?.toString() === client._id.toString());
      
      const totalRevenue = clientInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
      const lastProject = clientProjects.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      return {
        client_id: client._id,
        client_name: client.name,
        company: client.company,
        email: client.email,
        phone: client.phone,
        total_revenue: totalRevenue,
        project_count: clientProjects.length,
        active_projects: clientProjects.filter(p => ['active', 'in_progress'].includes(p.status)).length,
        completed_projects: clientProjects.filter(p => p.status === 'completed').length,
        last_project_date: lastProject ? lastProject.createdAt : null,
        average_project_value: clientProjects.length > 0 
          ? clientProjects.reduce((sum, p) => sum + (p.budget || 0), 0) / clientProjects.length 
          : 0,
        client_since: client.createdAt,
        lifetime_value: totalRevenue,
        status: lastProject && lastProject.createdAt > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) ? 'active' : 'inactive'
      };
    });

    // Sort by total revenue
    clientMetrics.sort((a, b) => b.total_revenue - a.total_revenue);

    // Calculate summary statistics
    const totalRevenue = clientMetrics.reduce((sum, client) => sum + client.total_revenue, 0);
    const activeClients = clientMetrics.filter(c => c.status === 'active').length;
    const newClients = clientMetrics.filter(c => new Date(c.client_since) >= start).length;

    // Client concentration risk (top client percentage)
    const topClientPercentage = clientMetrics.length > 0 && totalRevenue > 0 
      ? (clientMetrics[0].total_revenue / totalRevenue) * 100 
      : 0;

    // Client retention calculation
    const existingClients = clientMetrics.filter(c => new Date(c.client_since) < start).length;
    const retainedClients = clientMetrics.filter(c => 
      new Date(c.client_since) < start && c.status === 'active'
    ).length;
    const retentionRate = existingClients > 0 ? (retainedClients / existingClients) * 100 : 0;

    res.json({
      period,
      date_range: { start, end },
      summary: {
        total_clients: clients.length,
        active_clients: activeClients,
        new_clients: newClients,
        retention_rate: retentionRate,
        total_revenue: totalRevenue,
        average_client_value: clientMetrics.length > 0 ? totalRevenue / clientMetrics.length : 0,
        concentration_risk: topClientPercentage
      },
      top_clients: clientMetrics.slice(0, 10),
      client_distribution: {
        by_status: [
          { status: 'active', count: activeClients },
          { status: 'inactive', count: clients.length - activeClients }
        ],
        by_revenue: [
          { range: '$10k+', count: clientMetrics.filter(c => c.total_revenue >= 10000).length },
          { range: '$5k-$10k', count: clientMetrics.filter(c => c.total_revenue >= 5000 && c.total_revenue < 10000).length },
          { range: '$1k-$5k', count: clientMetrics.filter(c => c.total_revenue >= 1000 && c.total_revenue < 5000).length },
          { range: '<$1k', count: clientMetrics.filter(c => c.total_revenue < 1000).length }
        ]
      }
    });
  } catch (error) {
    console.error('Client analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/projects
// @desc    Get project performance analytics
// @access  Private
router.get('/projects', protect, async (req, res) => {
  try {
    const { period = 'yearly' } = req.query;
    const { start, end } = getDateRange(period);

    const projects = await Project.find({ 
      created_by: req.user.id,
      createdAt: { $gte: start, $lte: end }
    }).populate('client_id', 'name company');

    const tasks = await Task.find({
      created_by: req.user.id,
      created_at: { $gte: start, $lte: end }
    });

    // Calculate project metrics
    const projectMetrics = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id?.toString() === project._id.toString());
      const completedTasks = projectTasks.filter(t => t.status === 'completed');
      const totalTimeSpent = projectTasks.reduce((sum, t) => sum + (t.time_spent || 0), 0);

      const isCompleted = project.status === 'completed';
      const isOnTime = isCompleted && project.end_date && project.expected_end_date 
        ? new Date(project.end_date) <= new Date(project.expected_end_date)
        : null;

      const profitMargin = project.budget && totalTimeSpent > 0 
        ? ((project.budget - (totalTimeSpent * (project.hourly_rate || 50))) / project.budget) * 100
        : 0;

      return {
        project_id: project._id,
        project_name: project.title,
        client_name: project.client_id?.name || 'Unknown',
        status: project.status,
        budget: project.budget || 0,
        progress: project.progress || 0,
        start_date: project.start_date,
        end_date: project.end_date,
        expected_end_date: project.expected_end_date,
        total_tasks: projectTasks.length,
        completed_tasks: completedTasks.length,
        task_completion_rate: projectTasks.length > 0 ? (completedTasks.length / projectTasks.length) * 100 : 0,
        time_spent: totalTimeSpent,
        estimated_hours: project.estimated_hours || 0,
        is_on_time: isOnTime,
        profit_margin: profitMargin,
        created_at: project.createdAt
      };
    });

    // Calculate summary statistics
    const completedProjects = projectMetrics.filter(p => p.status === 'completed');
    const onTimeProjects = completedProjects.filter(p => p.is_on_time === true);
    
    const summary = {
      total_projects: projects.length,
      active_projects: projectMetrics.filter(p => ['active', 'in_progress'].includes(p.status)).length,
      completed_projects: completedProjects.length,
      cancelled_projects: projectMetrics.filter(p => p.status === 'cancelled').length,
      on_time_completion_rate: completedProjects.length > 0 ? (onTimeProjects.length / completedProjects.length) * 100 : 0,
      average_completion_rate: projectMetrics.length > 0 
        ? projectMetrics.reduce((sum, p) => sum + p.task_completion_rate, 0) / projectMetrics.length 
        : 0,
      total_budget: projectMetrics.reduce((sum, p) => sum + p.budget, 0),
      average_project_value: projectMetrics.length > 0 
        ? projectMetrics.reduce((sum, p) => sum + p.budget, 0) / projectMetrics.length 
        : 0,
      total_time_spent: projectMetrics.reduce((sum, p) => sum + p.time_spent, 0)
    };

    // Project status distribution
    const statusDistribution = [
      { status: 'active', count: projectMetrics.filter(p => p.status === 'active').length },
      { status: 'in_progress', count: projectMetrics.filter(p => p.status === 'in_progress').length },
      { status: 'completed', count: projectMetrics.filter(p => p.status === 'completed').length },
      { status: 'on_hold', count: projectMetrics.filter(p => p.status === 'on_hold').length },
      { status: 'cancelled', count: projectMetrics.filter(p => p.status === 'cancelled').length }
    ];

    res.json({
      period,
      date_range: { start, end },
      summary,
      projects: projectMetrics.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
      status_distribution: statusDistribution,
      performance_metrics: {
        most_profitable: projectMetrics.filter(p => p.profit_margin > 0).sort((a, b) => b.profit_margin - a.profit_margin).slice(0, 5),
        least_profitable: projectMetrics.filter(p => p.profit_margin < 0).sort((a, b) => a.profit_margin - b.profit_margin).slice(0, 5),
        highest_value: projectMetrics.sort((a, b) => b.budget - a.budget).slice(0, 5)
      }
    });
  } catch (error) {
    console.error('Project analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/proposals
// @desc    Get proposal performance analytics
// @access  Private
router.get('/proposals', protect, async (req, res) => {
  try {
    const { period = 'yearly', months = 12 } = req.query;
    
    const proposals = await Proposal.find({
      created_by: req.user.id,
      created_date: { 
        $gte: new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000)
      }
    }).populate('client_id', 'name company');

    // Calculate monthly proposal metrics
    const monthlyMetrics = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthProposals = proposals.filter(p => {
        const proposalDate = new Date(p.created_date);
        return proposalDate >= start && proposalDate <= end;
      });

      const sent = monthProposals.length;
      const accepted = monthProposals.filter(p => p.status === 'accepted').length;
      const rejected = monthProposals.filter(p => p.status === 'rejected').length;
      const pending = monthProposals.filter(p => p.status === 'pending').length;

      monthlyMetrics.push({
        month: start.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        sent,
        accepted,
        rejected,
        pending,
        win_rate: sent > 0 ? (accepted / sent) * 100 : 0,
        total_value: monthProposals.reduce((sum, p) => sum + (p.total_amount || 0), 0),
        accepted_value: monthProposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + (p.total_amount || 0), 0)
      });
    }

    // Overall summary
    const totalProposals = proposals.length;
    const acceptedProposals = proposals.filter(p => p.status === 'accepted').length;
    const rejectedProposals = proposals.filter(p => p.status === 'rejected').length;
    const pendingProposals = proposals.filter(p => p.status === 'pending').length;

    const summary = {
      total_proposals: totalProposals,
      accepted_proposals: acceptedProposals,
      rejected_proposals: rejectedProposals,
      pending_proposals: pendingProposals,
      overall_win_rate: totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0,
      total_proposal_value: proposals.reduce((sum, p) => sum + (p.total_amount || 0), 0),
      accepted_value: proposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + (p.total_amount || 0), 0),
      average_proposal_value: totalProposals > 0 ? proposals.reduce((sum, p) => sum + (p.total_amount || 0), 0) / totalProposals : 0,
      conversion_to_revenue: acceptedProposals > 0 ? proposals.filter(p => p.status === 'accepted').reduce((sum, p) => sum + (p.total_amount || 0), 0) : 0
    };

    // Response time analysis
    const respondedProposals = proposals.filter(p => ['accepted', 'rejected'].includes(p.status) && p.client_response?.responded_at);
    const avgResponseTime = respondedProposals.length > 0 
      ? respondedProposals.reduce((sum, p) => {
          const responseTime = new Date(p.client_response.responded_at) - new Date(p.created_date);
          return sum + (responseTime / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0) / respondedProposals.length 
      : 0;

    res.json({
      period: `${months} months`,
      summary: {
        ...summary,
        average_response_time_days: avgResponseTime
      },
      monthly_trend: monthlyMetrics,
      top_proposals: proposals
        .sort((a, b) => (b.total_amount || 0) - (a.total_amount || 0))
        .slice(0, 10)
        .map(p => ({
          id: p._id,
          title: p.title,
          client_name: p.client_id?.name || 'Unknown',
          total_amount: p.total_amount,
          status: p.status,
          created_date: p.created_date,
          valid_until: p.valid_until
        })),
      status_breakdown: [
        { status: 'accepted', count: acceptedProposals, percentage: totalProposals > 0 ? (acceptedProposals / totalProposals) * 100 : 0 },
        { status: 'rejected', count: rejectedProposals, percentage: totalProposals > 0 ? (rejectedProposals / totalProposals) * 100 : 0 },
        { status: 'pending', count: pendingProposals, percentage: totalProposals > 0 ? (pendingProposals / totalProposals) * 100 : 0 }
      ]
    });
  } catch (error) {
    console.error('Proposal analytics error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/analytics/custom-kpi
// @desc    Add custom KPI tracking
// @access  Private
router.post('/custom-kpi', protect, async (req, res) => {
  try {
    const { name, value, unit, description, period = 'monthly' } = req.body;
    const { start, end } = getDateRange(period);

    let analytics = await Analytics.findOne({
      user_id: req.user.id,
      period,
      start_date: start,
      end_date: end
    });

    if (!analytics) {
      analytics = new Analytics({
        user_id: req.user.id,
        period,
        start_date: start,
        end_date: end
      });
    }

    // Add or update custom metric
    const existingMetricIndex = analytics.custom_metrics.findIndex(m => m.name === name);
    if (existingMetricIndex > -1) {
      analytics.custom_metrics[existingMetricIndex] = { name, value, unit, description };
    } else {
      analytics.custom_metrics.push({ name, value, unit, description });
    }

    analytics.updatedAt = new Date();
    await analytics.save();

    res.json({
      message: 'Custom KPI added successfully',
      metric: { name, value, unit, description }
    });
  } catch (error) {
    console.error('Custom KPI error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/analytics/export
// @desc    Export analytics data to CSV
// @access  Private
router.get('/export', protect, async (req, res) => {
  try {
    const { period = 'yearly', format = 'json' } = req.query;
    const { start, end } = getDateRange(period);

    const analytics = await Analytics.findOne({
      user_id: req.user.id,
      period,
      start_date: start,
      end_date: end
    });

    if (!analytics) {
      return res.status(404).json({ message: 'No analytics data found for the specified period' });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = [
        ['Metric', 'Value', 'Unit'],
        ['Total Revenue', analytics.revenue.total_earned, 'USD'],
        ['Pending Revenue', analytics.revenue.total_pending, 'USD'],
        ['Total Projects', analytics.projects.total_projects, 'count'],
        ['Active Projects', analytics.projects.active_projects, 'count'],
        ['Completed Projects', analytics.projects.completed_projects, 'count'],
        ['Total Clients', analytics.clients.total_clients, 'count'],
        ['Active Clients', analytics.clients.active_clients, 'count'],
        ['Win Rate', analytics.proposals.win_rate, 'percentage'],
        ['On-time Completion Rate', analytics.projects.on_time_completion_rate, 'percentage']
      ].map(row => row.join(',')).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}-${Date.now()}.csv`);
      res.send(csvData);
    } else {
      res.json(analytics);
    }
  } catch (error) {
    console.error('Analytics export error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
