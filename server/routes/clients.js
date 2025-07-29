import express from 'express';
import Client from '../models/Client.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all clients for authenticated user
// @route   GET /api/clients
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const clients = await Client.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, clients });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error: error.message });
  }
});

// @desc    Create a new client
// @route   POST /api/clients
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, email, company } = req.body;
    const client = await Client.create({
      name,
      email,
      company,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, client });
  } catch (error) {
    res.status(500).json({ message: 'Error creating client', error: error.message });
  }
});

export default router;
