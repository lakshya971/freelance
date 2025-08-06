import express from 'express';
import Invoice from '../models/Invoice.js';
import Client from '../models/Client.js';
import Project from '../models/Project.js';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();

// @desc    Get all invoices for authenticated user
// @route   GET /api/invoices
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, client_id, from_date, to_date, overdue } = req.query;
    
    let filter = { createdBy: req.user.id };
    
    // Add status filter
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Add client filter
    if (client_id) {
      filter['client.id'] = client_id;
    }
    
    // Add date range filter
    if (from_date || to_date) {
      filter.issue_date = {};
      if (from_date) filter.issue_date.$gte = new Date(from_date);
      if (to_date) filter.issue_date.$lte = new Date(to_date);
    }
    
    // Add overdue filter
    if (overdue === 'true') {
      filter.due_date = { $lt: new Date() };
      filter.amount_due = { $gt: 0 };
    }
    
    const invoices = await Invoice.find(filter)
      .populate('client.id', 'name email company')
      .populate('project.id', 'title')
      .sort({ createdAt: -1 });
    
    // Calculate summary statistics
    const totalInvoices = invoices.length;
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalPaid = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
    const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.amount_due, 0);
    const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;
    
    res.json({ 
      success: true, 
      invoices,
      summary: {
        total_invoices: totalInvoices,
        total_amount: totalAmount,
        total_paid: totalPaid,
        total_outstanding: totalOutstanding,
        overdue_count: overdueCount
      }
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    })
    .populate('client.id', 'name email company address')
    .populate('project.id', 'title description');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
});

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      client_id,
      manual_client,
      manual_client_email,
      manual_client_company,
      project_id,
      line_items,
      due_date,
      tax_rate,
      discount,
      notes,
      terms,
      branding
    } = req.body;
    
    let clientInfo = {};
    
    // Handle client information - either from existing client or manual entry
    if (client_id) {
      // Use existing client
      const client = await Client.findOne({ _id: client_id, createdBy: req.user.id });
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      clientInfo = {
        id: client._id,
        name: client.name,
        email: client.email,
        company: client.company,
        address: client.address
      };
    } else if (manual_client) {
      // Use manual client entry for testing
      clientInfo = {
        id: null, // No database reference
        name: manual_client,
        email: manual_client_email || '',
        company: manual_client_company || '',
        address: ''
      };
    } else {
      return res.status(400).json({ message: 'Please provide client information' });
    }
    
    // Get project information if provided
    let project = null;
    if (project_id) {
      project = await Project.findOne({ _id: project_id, createdBy: req.user.id });
    }
    
    // Generate unique invoice number
    const year = new Date().getFullYear();
    const count = await Invoice.countDocuments({ createdBy: req.user.id }) + 1;
    const invoice_number = `INV-${year}-${String(count).padStart(4, '0')}`;
    
    // Get user branding settings
    const user = await User.findById(req.user.id);
    
    // Calculate totals
    const subtotal = line_items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax_amount = (subtotal * (tax_rate || 0)) / 100;
    const total_amount = subtotal + tax_amount - (discount || 0);
    
    const invoice = await Invoice.create({
      invoice_number,
      title,
      client: clientInfo,
      project: project ? {
        id: project._id,
        title: project.title
      } : undefined,
      line_items,
      subtotal,
      tax_amount,
      total_amount,
      amount_due: total_amount, // Initially, full amount is due
      due_date: due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
      tax_rate: tax_rate || 0,
      discount: discount || 0,
      notes,
      terms,
      branding: {
        ...branding,
        company_name: user.company_name || user.name,
        company_email: user.email
      },
      createdBy: req.user.id
    });
    
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    console.error('Error creating invoice:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Send detailed error for debugging
    res.status(500).json({ 
      message: 'Error creating invoice', 
      error: error.message,
      details: error.name === 'ValidationError' ? error.errors : null
    });
  }
});

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json({ success: true, invoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
});

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    res.json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ message: 'Error deleting invoice', error: error.message });
  }
});

// @desc    Send invoice to client
// @route   POST /api/invoices/:id/send
// @access  Private
router.post('/:id/send', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // Update invoice status
    invoice.status = 'sent';
    invoice.sent_at = new Date();
    await invoice.save();
    
    // TODO: Implement email sending logic
    // This would require setting up email service (nodemailer, sendgrid, etc.)
    
    res.json({ success: true, message: 'Invoice sent successfully' });
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ message: 'Error sending invoice', error: error.message });
  }
});

// @desc    Record payment for invoice
// @route   POST /api/invoices/:id/payments
// @access  Private
router.post('/:id/payments', protect, async (req, res) => {
  try {
    const { amount, payment_method, transaction_id, notes } = req.body;
    
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    });
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (amount <= 0 || amount > invoice.amount_due) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }
    
    // Add payment record
    invoice.payments.push({
      amount,
      payment_date: new Date(),
      payment_method,
      transaction_id,
      notes
    });
    
    // Update amount paid
    invoice.amount_paid += amount;
    
    await invoice.save();
    
    res.json({ success: true, invoice, message: 'Payment recorded successfully' });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Error recording payment', error: error.message });
  }
});

// @desc    Generate PDF for invoice
// @route   GET /api/invoices/:id/pdf
// @access  Private
router.get('/:id/pdf', protect, async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ 
      _id: req.params.id, 
      createdBy: req.user.id 
    })
    .populate('client.id', 'name email company address')
    .populate('project.id', 'title description');
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    // TODO: Implement PDF generation
    res.json({ success: true, message: 'PDF generation will be implemented soon', invoice });
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ message: 'Error generating PDF', error: error.message });
  }
});

// @desc    Mark invoice as viewed (for client tracking)
// @route   POST /api/invoices/:id/view
// @access  Public (for client access)
router.post('/:id/view', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    if (!invoice.viewed_at) {
      invoice.viewed_at = new Date();
      if (invoice.status === 'sent') {
        invoice.status = 'viewed';
      }
      await invoice.save();
    }
    
    res.json({ success: true, message: 'Invoice view recorded' });
  } catch (error) {
    console.error('Error recording view:', error);
    res.status(500).json({ message: 'Error recording view', error: error.message });
  }
});

// @desc    Get invoice statistics
// @route   GET /api/invoices/stats/overview
// @access  Private
router.get('/stats/overview', protect, async (req, res) => {
  try {
    const { period = '30' } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(period) * 24 * 60 * 60 * 1000);
    
    const stats = await Invoice.aggregate([
      { $match: { createdBy: req.user.id, createdAt: { $gte: daysAgo } } },
      {
        $group: {
          _id: null,
          total_invoices: { $sum: 1 },
          total_amount: { $sum: '$total_amount' },
          total_paid: { $sum: '$amount_paid' },
          total_outstanding: { $sum: '$amount_due' },
          avg_amount: { $avg: '$total_amount' }
        }
      }
    ]);
    
    const statusBreakdown = await Invoice.aggregate([
      { $match: { createdBy: req.user.id, createdAt: { $gte: daysAgo } } },
      { $group: { _id: '$status', count: { $sum: 1 }, amount: { $sum: '$total_amount' } } }
    ]);
    
    res.json({
      success: true,
      stats: stats[0] || {
        total_invoices: 0,
        total_amount: 0,
        total_paid: 0,
        total_outstanding: 0,
        avg_amount: 0
      },
      status_breakdown: statusBreakdown
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

export default router;
