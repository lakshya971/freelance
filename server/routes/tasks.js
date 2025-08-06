import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Milestone from '../models/Milestone.js';
import { protect } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join('uploads', 'tasks');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|csv|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// @desc    Get all tasks for a project (Kanban board data)
// @route   GET /api/tasks/project/:projectId
// @access  Private
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify project ownership
    const project = await Project.findOne({ _id: projectId, createdBy: req.user.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const tasks = await Task.find({ project_id: projectId })
      .populate('milestone_id', 'title')
      .populate('assigned_to', 'name email')
      .sort({ order: 1, createdAt: -1 });
    
    // Group tasks by status for Kanban board
    const kanbanData = {
      todo: tasks.filter(task => task.status === 'todo'),
      in_progress: tasks.filter(task => task.status === 'in_progress'),
      done: tasks.filter(task => task.status === 'done')
    };
    
    res.json({ success: true, tasks, kanbanData });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
router.post('/', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      project_id,
      milestone_id,
      deadline,
      priority,
      estimated_hours,
      tags
    } = req.body;
    
    // Verify project ownership
    const project = await Project.findOne({ _id: project_id, createdBy: req.user.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Process file attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      original_name: file.originalname,
      file_path: file.path,
      file_size: file.size,
      mime_type: file.mimetype
    })) : [];
    
    const task = await Task.create({
      title,
      description,
      project_id,
      milestone_id: milestone_id || undefined,
      deadline: deadline || undefined,
      priority: priority || 'medium',
      estimated_hours: estimated_hours || 0,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      attachments,
      created_by: req.user.id,
      assigned_to: req.user.id // Default assign to creator
    });
    
    await task.populate(['milestone_id', 'assigned_to']);
    
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
});

// @desc    Update task (including status for drag-and-drop)
// @route   PUT /api/tasks/:id
// @access  Private
router.put('/:id', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project_id');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify project ownership
    if (task.project_id.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Process new file attachments
    const newAttachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      original_name: file.originalname,
      file_path: file.path,
      file_size: file.size,
      mime_type: file.mimetype
    })) : [];
    
    // Update task fields
    const updateData = { ...req.body };
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(tag => tag.trim());
    }
    
    // Add new attachments to existing ones
    if (newAttachments.length > 0) {
      updateData.attachments = [...task.attachments, ...newAttachments];
    }
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate(['milestone_id', 'assigned_to']);
    
    res.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
});

// @desc    Update task order (for drag-and-drop reordering)
// @route   PUT /api/tasks/reorder
// @access  Private
router.put('/reorder', protect, async (req, res) => {
  try {
    const { tasks } = req.body; // Array of {id, order, status}
    
    const updatePromises = tasks.map(taskUpdate => 
      Task.findByIdAndUpdate(
        taskUpdate.id,
        { 
          order: taskUpdate.order,
          status: taskUpdate.status 
        },
        { new: true }
      )
    );
    
    await Promise.all(updatePromises);
    
    res.json({ success: true, message: 'Tasks reordered successfully' });
  } catch (error) {
    console.error('Error reordering tasks:', error);
    res.status(500).json({ message: 'Error reordering tasks', error: error.message });
  }
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project_id');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify project ownership
    if (task.project_id.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Delete associated files
    task.attachments.forEach(attachment => {
      try {
        if (fs.existsSync(attachment.file_path)) {
          fs.unlinkSync(attachment.file_path);
        }
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    });
    
    await Task.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
});

// @desc    Start/stop time tracking for a task
// @route   POST /api/tasks/:id/time
// @access  Private
router.post('/:id/time', protect, async (req, res) => {
  try {
    const { action, description } = req.body; // action: 'start' or 'stop'
    const task = await Task.findById(req.params.id).populate('project_id');
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    // Verify project ownership
    if (task.project_id.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (action === 'start') {
      // Start new time entry
      task.time_entries.push({
        start_time: new Date(),
        description: description || ''
      });
    } else if (action === 'stop') {
      // Stop the most recent active time entry
      const activeEntry = task.time_entries.find(entry => !entry.end_time);
      if (activeEntry) {
        activeEntry.end_time = new Date();
        activeEntry.duration_minutes = Math.round(
          (activeEntry.end_time - activeEntry.start_time) / (1000 * 60)
        );
        
        // Update actual hours
        task.actual_hours = task.total_time_minutes / 60;
      }
    }
    
    await task.save();
    
    res.json({ success: true, task });
  } catch (error) {
    console.error('Error tracking time:', error);
    res.status(500).json({ message: 'Error tracking time', error: error.message });
  }
});

// @desc    Get task statistics for a project
// @route   GET /api/tasks/stats/:projectId
// @access  Private
router.get('/stats/:projectId', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify project ownership
    const project = await Project.findOne({ _id: projectId, createdBy: req.user.id });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const tasks = await Task.find({ project_id: projectId });
    
    const stats = {
      total_tasks: tasks.length,
      completed_tasks: tasks.filter(t => t.status === 'done').length,
      in_progress_tasks: tasks.filter(t => t.status === 'in_progress').length,
      todo_tasks: tasks.filter(t => t.status === 'todo').length,
      overdue_tasks: tasks.filter(t => t.deadline && new Date() > t.deadline && t.status !== 'done').length,
      total_estimated_hours: tasks.reduce((sum, t) => sum + t.estimated_hours, 0),
      total_actual_hours: tasks.reduce((sum, t) => sum + t.actual_hours, 0),
      completion_percentage: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0
    };
    
    // Update project progress
    await Project.findByIdAndUpdate(projectId, {
      progress_percentage: stats.completion_percentage,
      actual_hours: stats.total_actual_hours
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching task statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

export default router;
