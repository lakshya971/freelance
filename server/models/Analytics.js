import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  // User reference
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Time period for the analytics
  period: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  
  // Revenue Analytics
  revenue: {
    total_earned: { type: Number, default: 0 },
    total_pending: { type: Number, default: 0 },
    total_overdue: { type: Number, default: 0 },
    average_invoice_amount: { type: Number, default: 0 },
    payment_velocity: { type: Number, default: 0 }, // Average days to payment
    revenue_by_client: [{
      client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
      client_name: String,
      amount: Number,
      percentage: Number
    }],
    revenue_trend: [{
      date: Date,
      amount: Number,
      cumulative: Number
    }]
  },
  
  // Project Analytics
  projects: {
    total_projects: { type: Number, default: 0 },
    active_projects: { type: Number, default: 0 },
    completed_projects: { type: Number, default: 0 },
    cancelled_projects: { type: Number, default: 0 },
    average_project_duration: { type: Number, default: 0 }, // In days
    average_project_value: { type: Number, default: 0 },
    on_time_completion_rate: { type: Number, default: 0 }, // Percentage
    project_profitability: [{
      project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
      project_name: String,
      revenue: Number,
      estimated_hours: Number,
      actual_hours: Number,
      hourly_rate: Number,
      profit_margin: Number
    }],
    project_status_distribution: [{
      status: String,
      count: Number,
      percentage: Number
    }]
  },
  
  // Client Analytics
  clients: {
    total_clients: { type: Number, default: 0 },
    active_clients: { type: Number, default: 0 },
    new_clients: { type: Number, default: 0 },
    client_retention_rate: { type: Number, default: 0 },
    average_client_value: { type: Number, default: 0 },
    top_clients: [{
      client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
      client_name: String,
      total_revenue: Number,
      project_count: Number,
      last_project_date: Date
    }],
    client_acquisition_trend: [{
      month: String,
      new_clients: Number,
      total_clients: Number
    }]
  },
  
  // Time Tracking Analytics
  time_tracking: {
    total_hours_logged: { type: Number, default: 0 },
    billable_hours: { type: Number, default: 0 },
    non_billable_hours: { type: Number, default: 0 },
    average_daily_hours: { type: Number, default: 0 },
    productivity_score: { type: Number, default: 0 }, // Based on tasks completed vs time spent
    time_by_project: [{
      project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
      project_name: String,
      hours_spent: Number,
      percentage: Number
    }],
    time_distribution: [{
      category: String, // development, meeting, admin, etc.
      hours: Number,
      percentage: Number
    }]
  },
  
  // Proposal Analytics
  proposals: {
    total_proposals: { type: Number, default: 0 },
    accepted_proposals: { type: Number, default: 0 },
    rejected_proposals: { type: Number, default: 0 },
    pending_proposals: { type: Number, default: 0 },
    win_rate: { type: Number, default: 0 },
    average_proposal_value: { type: Number, default: 0 },
    proposal_to_project_conversion: { type: Number, default: 0 },
    response_time_average: { type: Number, default: 0 }, // Average days for client response
    proposal_trend: [{
      month: String,
      sent: Number,
      accepted: Number,
      rejected: Number,
      win_rate: Number
    }]
  },
  
  // Financial Health Indicators
  financial_health: {
    cash_flow: { type: Number, default: 0 },
    accounts_receivable: { type: Number, default: 0 },
    monthly_recurring_revenue: { type: Number, default: 0 },
    client_concentration_risk: { type: Number, default: 0 }, // % of revenue from top client
    seasonal_variance: { type: Number, default: 0 },
    growth_rate: { type: Number, default: 0 }, // Period over period growth
    expense_ratio: { type: Number, default: 0 } // If expenses are tracked
  },
  
  // Performance Metrics
  performance: {
    client_satisfaction_score: { type: Number, default: 0 },
    repeat_client_rate: { type: Number, default: 0 },
    referral_rate: { type: Number, default: 0 },
    project_scope_creep: { type: Number, default: 0 }, // % of projects that went over budget/time
    deadline_adherence: { type: Number, default: 0 }, // % of projects delivered on time
    quality_score: { type: Number, default: 0 } // Based on revisions, feedback, etc.
  },
  
  // Forecasting Data
  forecasting: {
    projected_revenue_next_month: { type: Number, default: 0 },
    projected_revenue_next_quarter: { type: Number, default: 0 },
    capacity_utilization: { type: Number, default: 0 }, // % of available hours booked
    pipeline_value: { type: Number, default: 0 }, // Value of pending proposals
    runway: { type: Number, default: 0 } // Months of expenses covered by current revenue
  },
  
  // Custom KPIs
  custom_metrics: [{
    name: String,
    value: Number,
    unit: String,
    description: String
  }],
  
  // Generation metadata
  generated_at: { type: Date, default: Date.now },
  computation_time: { type: Number }, // Time taken to generate analytics in ms
  data_freshness: { type: Date }, // Timestamp of most recent data used
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Method to calculate revenue analytics
analyticsSchema.methods.calculateRevenueAnalytics = async function() {
  const Invoice = mongoose.model('Invoice');
  
  const invoices = await Invoice.find({
    created_by: this.user_id,
    created_date: { $gte: this.start_date, $lte: this.end_date }
  }).populate('client.id', 'name');

  this.revenue.total_earned = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  this.revenue.total_pending = invoices
    .filter(inv => inv.status === 'sent')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  this.revenue.total_overdue = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + (inv.amount || 0), 0);

  this.revenue.average_invoice_amount = invoices.length > 0 
    ? invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0) / invoices.length 
    : 0;

  // Calculate revenue by client
  const clientRevenue = {};
  invoices.forEach(inv => {
    if (inv.client?.id && inv.status === 'paid') {
      const clientId = inv.client.id._id.toString();
      const clientName = inv.client.id.name;
      if (!clientRevenue[clientId]) {
        clientRevenue[clientId] = { client_id: clientId, client_name: clientName, amount: 0 };
      }
      clientRevenue[clientId].amount += inv.amount || 0;
    }
  });

  this.revenue.revenue_by_client = Object.values(clientRevenue)
    .sort((a, b) => b.amount - a.amount)
    .map(client => ({
      ...client,
      percentage: this.revenue.total_earned > 0 ? (client.amount / this.revenue.total_earned) * 100 : 0
    }));

  return this;
};

// Method to calculate project analytics
analyticsSchema.methods.calculateProjectAnalytics = async function() {
  const Project = mongoose.model('Project');
  
  const projects = await Project.find({
    created_by: this.user_id,
    createdAt: { $gte: this.start_date, $lte: this.end_date }
  });

  this.projects.total_projects = projects.length;
  this.projects.active_projects = projects.filter(p => ['active', 'in_progress'].includes(p.status)).length;
  this.projects.completed_projects = projects.filter(p => p.status === 'completed').length;
  this.projects.cancelled_projects = projects.filter(p => p.status === 'cancelled').length;

  // Calculate average project duration for completed projects
  const completedProjects = projects.filter(p => p.status === 'completed' && p.start_date && p.end_date);
  if (completedProjects.length > 0) {
    const totalDuration = completedProjects.reduce((sum, p) => {
      const duration = (new Date(p.end_date) - new Date(p.start_date)) / (1000 * 60 * 60 * 24);
      return sum + duration;
    }, 0);
    this.projects.average_project_duration = totalDuration / completedProjects.length;
  }

  this.projects.average_project_value = projects.length > 0 
    ? projects.reduce((sum, p) => sum + (p.budget || 0), 0) / projects.length 
    : 0;

  // Calculate on-time completion rate
  const onTimeProjects = completedProjects.filter(p => {
    return new Date(p.end_date) <= new Date(p.expected_end_date || p.end_date);
  });
  this.projects.on_time_completion_rate = completedProjects.length > 0 
    ? (onTimeProjects.length / completedProjects.length) * 100 
    : 0;

  return this;
};

// Method to generate complete analytics
analyticsSchema.methods.generateCompleteAnalytics = async function() {
  const startTime = Date.now();
  
  await this.calculateRevenueAnalytics();
  await this.calculateProjectAnalytics();
  // Add more calculation methods as needed
  
  this.computation_time = Date.now() - startTime;
  this.data_freshness = new Date();
  this.updatedAt = new Date();
  
  return this;
};

analyticsSchema.index({ user_id: 1, period: 1, start_date: 1 });
analyticsSchema.index({ user_id: 1, generated_at: -1 });

export default mongoose.model('Analytics', analyticsSchema);
