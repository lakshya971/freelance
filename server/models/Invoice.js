import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  rate: { type: Number, required: true, min: 0 },
  amount: { type: Number, required: true, min: 0 }
});

const reminderSchema = new mongoose.Schema({
  type: { type: String, enum: ['before_due', 'on_due', 'after_due'], required: true },
  sent_date: { type: Date, required: true },
  sent_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  payment_date: { type: Date, required: true },
  payment_method: { type: String, enum: ['stripe', 'razorpay', 'paypal', 'bank_transfer', 'cash', 'other'], required: true },
  transaction_id: { type: String },
  notes: { type: String }
});

const invoiceSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  
  // Client Information
  client: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' }, // Made optional for manual entries
    name: { type: String, required: true },
    email: { type: String, required: true },
    company: { type: String },
    address: { type: String }
  },
  
  // Project Reference
  project: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    title: { type: String }
  },
  
  // Dates
  issue_date: { type: Date, required: true, default: Date.now },
  due_date: { type: Date, required: true },
  
  // Financial Details
  line_items: [lineItemSchema],
  subtotal: { type: Number, required: true, min: 0 },
  tax_rate: { type: Number, default: 0, min: 0, max: 100 },
  tax_amount: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  total_amount: { type: Number, required: true, min: 0 },
  
  // Payment Details
  payments: [paymentSchema],
  amount_paid: { type: Number, default: 0, min: 0 },
  amount_due: { type: Number, required: true, min: 0 },
  
  // Status and Tracking
  status: { 
    type: String, 
    enum: ['draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'cancelled'], 
    default: 'draft' 
  },
  
  // Reminders
  reminders: [reminderSchema],
  reminder_settings: {
    before_due_days: { type: Number, default: 3 },
    on_due_date: { type: Boolean, default: true },
    after_due_days: [{ type: Number }] // e.g., [1, 7, 14, 30]
  },
  
  // Branding
  branding: {
    logo_url: { type: String },
    primary_color: { type: String, default: '#10B981' },
    company_name: { type: String },
    company_address: { type: String },
    company_email: { type: String },
    company_phone: { type: String }
  },
  
  // Metadata
  currency: { type: String, default: 'USD' },
  language: { type: String, default: 'en' },
  notes: { type: String },
  terms: { type: String },
  
  // Tracking
  viewed_at: { type: Date },
  sent_at: { type: Date },
  paid_at: { type: Date },
  
  // User Reference
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to update amounts and status
invoiceSchema.pre('save', function(next) {
  // Calculate subtotal
  this.subtotal = this.line_items.reduce((sum, item) => sum + item.amount, 0);
  
  // Calculate tax amount
  this.tax_amount = (this.subtotal * this.tax_rate) / 100;
  
  // Calculate total amount
  this.total_amount = this.subtotal + this.tax_amount - this.discount;
  
  // Calculate amount due
  this.amount_due = this.total_amount - this.amount_paid;
  
  // Update status based on payment
  if (this.amount_paid === 0) {
    if (this.status === 'paid' || this.status === 'partially_paid') {
      this.status = 'sent';
    }
  } else if (this.amount_paid >= this.total_amount) {
    this.status = 'paid';
    if (!this.paid_at) {
      this.paid_at = new Date();
    }
  } else {
    this.status = 'partially_paid';
  }
  
  // Check if overdue
  if (this.amount_due > 0 && new Date() > this.due_date && this.status !== 'paid') {
    this.status = 'overdue';
  }
  
  this.updatedAt = new Date();
  next();
});

// Index for better performance
invoiceSchema.index({ createdBy: 1, status: 1 });
invoiceSchema.index({ 'client.id': 1 });
invoiceSchema.index({ due_date: 1 });
invoiceSchema.index({ invoice_number: 1 });

export default mongoose.model('Invoice', invoiceSchema);
