import express from 'express';
import Project from '../models/Project.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all projects for authenticated user
// @route   GET /api/projects
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const projects = await Project.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching projects', error: error.message });
  }
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, clientName, clientId, status, dueDate } = req.body;
    const project = await Project.create({
      name,
      clientName,
      clientId,
      status,
      dueDate,
      createdBy: req.user.id
    });
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

export default router;
