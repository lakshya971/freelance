import express from 'express';
import Proposal from '../models/Proposal.js';
import { protect, restrictTo } from '../middleware/auth.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const router = express.Router();

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// @desc    Get all proposals for authenticated user
// @route   GET /api/proposals
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { createdBy: req.user.id };
    
    if (status) query.status = status;

    const proposals = await Proposal.find(query)
      .populate('templateUsed', 'name category')
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
    const proposal = await Proposal.findById(req.params.id)
      .populate('templateUsed', 'name category')
      .populate('createdBy', 'name email');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check ownership
    if (proposal.createdBy._id.toString() !== req.user.id) {
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

// @desc    Share proposal via link
// @route   POST /api/proposals/:id/share
// @access  Private
router.post('/:id/share', protect, async (req, res) => {
  try {
    const { password, expiresIn = 30, allowDownload = true } = req.body;
    
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check ownership
    if (proposal.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to share this proposal' });
    }

    // Generate share token and update sharing settings
    const shareToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);

    proposal.sharing = {
      isPublic: true,
      shareToken,
      sharedAt: new Date(),
      password: password || undefined,
      expiresAt,
      allowDownload
    };

    await proposal.save();

    const shareLink = `${process.env.CLIENT_URL}/shared/proposal/${shareToken}`;

    res.json({
      success: true,
      message: 'Proposal shared successfully',
      shareLink,
      expiresAt
    });
  } catch (error) {
    console.error('Share proposal error:', error);
    res.status(500).json({ 
      message: 'Error sharing proposal', 
      error: error.message 
    });
  }
});

// @desc    Send proposal via email
// @route   POST /api/proposals/:id/send
// @access  Private
router.post('/:id/send', protect, async (req, res) => {
  try {
    const { recipientEmail, message, includeLink = true } = req.body;
    
    const proposal = await Proposal.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check ownership
    if (proposal.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to send this proposal' });
    }

    // Create share link if requested
    let shareLink = '';
    if (includeLink) {
      if (!proposal.sharing.shareToken) {
        proposal.sharing = {
          isPublic: true,
          shareToken: crypto.randomBytes(32).toString('hex'),
          sharedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          allowDownload: true
        };
        await proposal.save();
      }
      shareLink = `${process.env.CLIENT_URL}/shared/proposal/${proposal.sharing.shareToken}`;
    }

    // Send email
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">New Proposal from ${proposal.createdBy.name}</h1>
        </div>
        
        <div style="padding: 30px; background-color: #f9fafb;">
          <h2 style="color: #1f2937; margin-bottom: 10px;">${proposal.title}</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Project Details:</h3>
            <p><strong>Budget:</strong> $${proposal.project.budget.amount.toLocaleString()}</p>
            <p><strong>Timeline:</strong> ${proposal.project.timeline}</p>
            <p><strong>Description:</strong> ${proposal.project.description.substring(0, 200)}...</p>
          </div>
          
          ${message ? `
            <div style="background: #e5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1e40af; margin-top: 0;">Personal Message:</h4>
              <p style="color: #1f2937;">${message}</p>
            </div>
          ` : ''}
          
          ${shareLink ? `
            <div style="text-align: center; margin: 30px 0;">
              <a href="${shareLink}" style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                View Proposal
              </a>
            </div>
          ` : ''}
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px;">
            <p>This proposal was sent via FreelanceFlow</p>
            ${shareLink ? `<p>Link expires on: ${proposal.sharing.expiresAt.toLocaleDateString()}</p>` : ''}
          </div>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${proposal.createdBy.name}" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Proposal: ${proposal.title}`,
      html: emailContent
    });

    // Update proposal status and metadata
    proposal.status = 'sent';
    proposal.sentAt = new Date();
    proposal.metadata.emailsSent.push({
      sentAt: new Date(),
      recipient: recipientEmail,
      type: 'proposal_sent',
      status: 'sent'
    });

    await proposal.save();

    res.json({
      success: true,
      message: 'Proposal sent successfully',
      shareLink
    });
  } catch (error) {
    console.error('Send proposal error:', error);
    res.status(500).json({ 
      message: 'Error sending proposal', 
      error: error.message 
    });
  }
});

// @desc    View shared proposal (public access)
// @route   GET /api/proposals/shared/:token
// @access  Public
router.get('/shared/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;
    
    const proposal = await Proposal.findOne({ 'sharing.shareToken': token })
      .populate('createdBy', 'name email company')
      .select('-createdBy.password');

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found or link expired' });
    }

    // Check if proposal has expired
    if (proposal.sharing.expiresAt && new Date() > proposal.sharing.expiresAt) {
      return res.status(410).json({ message: 'This proposal link has expired' });
    }

    // Check password if required
    if (proposal.sharing.password && proposal.sharing.password !== password) {
      return res.status(401).json({ 
        message: 'Password required',
        passwordRequired: true 
      });
    }

    // Update view metadata
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    proposal.metadata.viewCount += 1;
    proposal.metadata.lastViewed = new Date();
    proposal.metadata.viewHistory.push({
      viewedAt: new Date(),
      ipAddress: clientIP,
      userAgent: userAgent
    });

    // Update status to viewed if it was just sent
    if (proposal.status === 'sent') {
      proposal.status = 'viewed';
      proposal.viewedAt = new Date();
    }

    await proposal.save();

    // Send notification to proposal owner if enabled
    if (proposal.notifications.viewNotifications) {
      // Send email notification (implement as needed)
      console.log(`Proposal viewed: ${proposal.title} by IP: ${clientIP}`);
    }

    res.json({
      success: true,
      proposal: {
        _id: proposal._id,
        title: proposal.title,
        content: proposal.content,
        client: proposal.client,
        project: proposal.project,
        createdBy: proposal.createdBy,
        createdAt: proposal.createdAt,
        sharing: {
          allowDownload: proposal.sharing.allowDownload
        }
      }
    });
  } catch (error) {
    console.error('View shared proposal error:', error);
    res.status(500).json({ 
      message: 'Error viewing proposal', 
      error: error.message 
    });
  }
});

// @desc    Sign proposal (client e-signature)
// @route   POST /api/proposals/shared/:token/sign
// @access  Public
router.post('/shared/:token/sign', async (req, res) => {
  try {
    const { token } = req.params;
    const { signature, clientName, clientTitle, password } = req.body;
    
    const proposal = await Proposal.findOne({ 'sharing.shareToken': token });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check password if required
    if (proposal.sharing.password && proposal.sharing.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Check if already signed
    if (proposal.signature.clientSigned) {
      return res.status(400).json({ message: 'Proposal already signed' });
    }

    // Update signature
    const clientIP = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    proposal.signature = {
      clientSigned: true,
      signedAt: new Date(),
      clientSignature: signature,
      clientName: clientName || proposal.client.name,
      clientTitle: clientTitle || '',
      ipAddress: clientIP,
      userAgent: userAgent
    };

    proposal.status = 'accepted';
    proposal.respondedAt = new Date();

    await proposal.save();

    // Send notification to proposal owner
    if (proposal.notifications.responseNotifications) {
      // Send email notification (implement as needed)
      console.log(`Proposal signed: ${proposal.title} by ${clientName}`);
    }

    res.json({
      success: true,
      message: 'Proposal signed successfully'
    });
  } catch (error) {
    console.error('Sign proposal error:', error);
    res.status(500).json({ 
      message: 'Error signing proposal', 
      error: error.message 
    });
  }
});

// @desc    Add comment to proposal (client feedback)
// @route   POST /api/proposals/shared/:token/comment
// @access  Public
router.post('/shared/:token/comment', async (req, res) => {
  try {
    const { token } = req.params;
    const { comment, password } = req.body;
    
    const proposal = await Proposal.findOne({ 'sharing.shareToken': token });

    if (!proposal) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    // Check password if required
    if (proposal.sharing.password && proposal.sharing.password !== password) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Add comment
    proposal.feedback.clientComments.push({
      comment,
      createdAt: new Date()
    });

    await proposal.save();

    res.json({
      success: true,
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      message: 'Error adding comment', 
      error: error.message 
    });
  }
});

export default router;

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