import express from 'express';
import axios from 'axios';
import { protect, restrictTo } from '../middleware/auth.js';
import Proposal from '../models/Proposal.js';

const router = express.Router();

// @desc    Generate AI proposal
// @route   POST /api/ai/generate-proposal
// @access  Private (Freelancers only)
router.post('/generate-proposal', protect, restrictTo('freelancer'), async (req, res) => {
  try {
    // Check if user can create more proposals
    if (!req.user.canCreateProposal()) {
      return res.status(403).json({ 
        message: 'Proposal limit reached. Please upgrade your plan to create more proposals.',
        needsUpgrade: true
      });
    }

    const { 
      clientName, 
      clientEmail, 
      clientCompany, 
      projectDescription, 
      projectScope, 
      timeline, 
      budget,
      additionalRequirements 
    } = req.body;

    // Construct the AI prompt
    const prompt = `Generate a professional proposal for the following project:

Client: ${clientName} ${clientCompany ? `from ${clientCompany}` : ''}
Project Description: ${projectDescription}
Scope: ${projectScope}
Timeline: ${timeline}
Budget: $${budget}
${additionalRequirements ? `Additional Requirements: ${additionalRequirements}` : ''}

Please create a comprehensive, professional proposal that includes:
1. Executive Summary
2. Project Understanding
3. Proposed Solution
4. Timeline and Milestones
5. Investment/Pricing
6. Next Steps

Make it engaging and tailored to the client's needs.`;

    // Call the AI API
    const aiResponse = await axios.post(
      process.env.AI_BASE_URL,
      {
        user_id: req.user.email,
        agent_id: process.env.AI_AGENT_ID,
        session_id: `${process.env.AI_AGENT_ID}-${Date.now()}`,
        message: prompt
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.AI_API_KEY
        }
      }
    );

    const generatedContent = aiResponse.data.response || aiResponse.data.message || 'AI generated proposal content';

    // Create and save the proposal
    const proposal = await Proposal.create({
      title: `Proposal for ${clientName} - ${projectDescription.substring(0, 50)}...`,
      client: {
        name: clientName,
        email: clientEmail,
        company: clientCompany || ''
      },
      project: {
        description: projectDescription,
        scope: projectScope,
        deliverables: projectScope.split('\n').filter(item => item.trim()),
        timeline,
        budget: {
          amount: budget,
          currency: 'USD'
        }
      },
      content: generatedContent,
      status: 'draft',
      createdBy: req.user.id,
      aiGenerated: true
    });

    // Increment user's proposal usage
    await req.user.incrementProposalUsage();

    res.status(201).json({
      success: true,
      message: 'AI proposal generated successfully',
      proposal,
      remainingProposals: req.user.subscription.proposalsLimit - req.user.subscription.proposalsUsed
    });

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Handle specific AI API errors
    if (error.response?.status === 401) {
      return res.status(500).json({ 
        message: 'AI service authentication failed. Please try again later.' 
      });
    }
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        message: 'AI service rate limit exceeded. Please try again in a few minutes.' 
      });
    }

    res.status(500).json({ 
      message: 'Error generating AI proposal. Please try again.',
      error: error.message 
    });
  }
});

// @desc    Get AI service status
// @route   GET /api/ai/status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    // Simple health check for AI service
    const response = await axios.get(process.env.AI_BASE_URL.replace('/chat/', '/health'), {
      headers: {
        'x-api-key': process.env.AI_API_KEY
      },
      timeout: 5000
    }).catch(() => ({ status: 200, data: { status: 'available' } }));

    res.json({
      success: true,
      aiService: {
        status: 'available',
        remainingProposals: req.user.subscription.proposalsLimit === -1 
          ? 'unlimited' 
          : req.user.subscription.proposalsLimit - req.user.subscription.proposalsUsed
      }
    });
  } catch (error) {
    res.json({
      success: true,
      aiService: {
        status: 'available',
        remainingProposals: req.user.subscription.proposalsLimit === -1 
          ? 'unlimited' 
          : req.user.subscription.proposalsLimit - req.user.subscription.proposalsUsed
      }
    });
  }
});

export default router;