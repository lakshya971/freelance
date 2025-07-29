import express from 'express';
import Invoice from '../models/Invoice.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all invoices for authenticated user
// @route   GET /api/invoices
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const invoices = await Invoice.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, invoices });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

// @desc    Create a new invoice
// @route   POST /api/invoices
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { clientName, clientId, total_amount, status, date } = req.body;
    const invoice = await Invoice.create({
      clientName,
      clientId,
      total_amount,
      status,
      date,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
});

export default router;
