import express from 'express';
import ProposalTemplate from '../models/ProposalTemplate.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all templates for authenticated user
// @route   GET /api/templates
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    
    // Get user's private templates and public templates
    const query = {
      $or: [
        { createdBy: req.user.id },
        { isPublic: true }
      ]
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }

    const templates = await ProposalTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort({ usageCount: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ProposalTemplate.countDocuments(query);

    res.json({
      success: true,
      templates,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ 
      message: 'Error fetching templates', 
      error: error.message 
    });
  }
});

// @desc    Get single template
// @route   GET /api/templates/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const template = await ProposalTemplate.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if user can access this template
    if (!template.isPublic && template.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this template' });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ 
      message: 'Error fetching template', 
      error: error.message 
    });
  }
});

// @desc    Create new template
// @route   POST /api/templates
// @access  Private (Freelancers only)
router.post('/', protect, restrictTo('freelancer'), async (req, res) => {
  try {
    const templateData = {
      ...req.body,
      createdBy: req.user.id
    };

    const template = await ProposalTemplate.create(templateData);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ 
      message: 'Error creating template', 
      error: error.message 
    });
  }
});

// @desc    Update template
// @route   PUT /api/templates/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const template = await ProposalTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check ownership
    if (template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this template' });
    }

    const updatedTemplate = await ProposalTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Template updated successfully',
      template: updatedTemplate
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ 
      message: 'Error updating template', 
      error: error.message 
    });
  }
});

// @desc    Delete template
// @route   DELETE /api/templates/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const template = await ProposalTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check ownership
    if (template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this template' });
    }

    await ProposalTemplate.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ 
      message: 'Error deleting template', 
      error: error.message 
    });
  }
});

// @desc    Use template (increment usage count)
// @route   POST /api/templates/:id/use
// @access  Private
router.post('/:id/use', protect, async (req, res) => {
  try {
    const template = await ProposalTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }

    // Check if user can access this template
    if (!template.isPublic && template.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to use this template' });
    }

    // Increment usage count and update last used
    await ProposalTemplate.findByIdAndUpdate(req.params.id, {
      $inc: { usageCount: 1 },
      lastUsed: new Date()
    });

    res.json({
      success: true,
      message: 'Template usage recorded',
      template
    });
  } catch (error) {
    console.error('Use template error:', error);
    res.status(500).json({ 
      message: 'Error using template', 
      error: error.message 
    });
  }
});

// @desc    Get default templates by category
// @route   GET /api/templates/defaults/:category
// @access  Private
router.get('/defaults/:category', protect, async (req, res) => {
  try {
    const { category } = req.params;
    
    const templates = await ProposalTemplate.find({
      category,
      $or: [
        { isDefault: true },
        { isPublic: true, usageCount: { $gte: 10 } } // Popular public templates
      ]
    })
    .populate('createdBy', 'name')
    .sort({ usageCount: -1 })
    .limit(5);

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get default templates error:', error);
    res.status(500).json({ 
      message: 'Error fetching default templates', 
      error: error.message 
    });
  }
});

export default router;
