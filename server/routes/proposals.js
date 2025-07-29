import express from 'express';
import Proposal from '../models/Proposal.js';
import { protect, restrictTo } from '../middleware/auth.js';

const router = express.Router();

// @desc    Get all proposals for authenticated user
// @route   GET /api/proposals
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { createdBy: req.user.id };
    
    if (status) query.status = status;

    const proposals = await Proposal.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Proposal.countDocuments(query);

    res.json({
      success: true,
      proposals,
      pagination: {
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Get proposals error:', error);
    res.status(500).json({ 
      message: 'Error fetching proposals', 
      error: error.message 
    });
  }
});

// @desc    Get single proposal
// @route   GET /api/proposals/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check ownership
    if (proposal.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view this proposal' });
    }

    res.json({
      success: true,
      proposal
    });
  } catch (error) {
    console.error('Get proposal error:', error);
    res.status(500).json({ 
      message: 'Error fetching proposal', 
      error: error.message 
    });
  }
});

// @desc    Create new proposal
// @route   POST /api/proposals
// @access  Private (Freelancers only)
router.post('/', protect, restrictTo('freelancer'), async (req, res) => {
  try {
    // Check if user can create more proposals
    if (!req.user.canCreateProposal()) {
      return res.status(403).json({ 
        message: 'Proposal limit reached. Please upgrade your plan to create more proposals.',
        needsUpgrade: true
      });
    }

    const proposalData = {
      ...req.body,
      createdBy: req.user.id
    };

    const proposal = await Proposal.create(proposalData);

    // Increment user's proposal usage
    await req.user.incrementProposalUsage();

    res.status(201).json({
      success: true,
      message: 'Proposal created successfully',
      proposal
    });
  } catch (error) {
    console.error('Create proposal error:', error);
    res.status(500).json({ 
      message: 'Error creating proposal', 
      error: error.message 
    });
  }
});

// @desc    Update proposal
// @route   PUT /api/proposals/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check ownership
    if (proposal.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this proposal' });
    }

    // Don't allow updates to accepted proposals
    if (proposal.status === 'accepted') {
      return res.status(400).json({ message: 'Cannot update accepted proposals' });
    }

    const updatedProposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Proposal updated successfully',
      proposal: updatedProposal
    });
  } catch (error) {
    console.error('Update proposal error:', error);
    res.status(500).json({ 
      message: 'Error updating proposal', 
      error: error.message 
    });
  }
});

// @desc    Delete proposal
// @route   DELETE /api/proposals/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check ownership
    if (proposal.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this proposal' });
    }

    await Proposal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    console.error('Delete proposal error:', error);
    res.status(500).json({ 
      message: 'Error deleting proposal', 
      error: error.message 
    });
  }
});

export default router;