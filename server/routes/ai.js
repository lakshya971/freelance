import express from 'express';
import OpenAI from 'openai';
import { protect, restrictTo } from '../middleware/auth.js';
import Proposal from '../models/Proposal.js';

const router = express.Router();

// Function to get OpenAI instance (lazy initialization)
function getOpenAI() {
  console.log('🔍 Checking OpenAI configuration...');
  console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
  console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in environment variables.');
  }
  
  console.log('✅ Creating OpenAI instance...');
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// @desc    Generate AI proposal
// @route   POST /api/ai/generate-proposal
// @access  Private (Freelancers only)
router.post('/generate-proposal', protect, restrictTo('freelancer'), async (req, res) => {
  console.log('📥 POST /api/ai/generate-proposal - Route hit');
  
  try {
    console.log('🤖 AI proposal generation started for user:', req.user?.email || 'Unknown user');
    console.log('📊 Request body keys:', Object.keys(req.body));
    console.log('📊 Request body:', req.body);

    // Check if user exists
    if (!req.user) {
      console.log('❌ No user found in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if user can create more proposals
    console.log('🔍 Checking user proposal limits...');
    console.log('User subscription:', req.user.subscription);
    
    if (!req.user.canCreateProposal()) {
      console.log('❌ User has reached proposal limit');
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

    console.log('✅ User can create proposal. Validating request data...');
    
    // Validate required fields
    if (!clientName || !clientEmail || !projectDescription || !projectScope || !timeline || !budget) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['clientName', 'clientEmail', 'projectDescription', 'projectScope', 'timeline', 'budget']
      });
    }

    console.log('✅ Request data validated. Constructing OpenAI prompt...');

    // Construct the AI prompt
    const prompt = `You are a professional freelance proposal writer. Create a comprehensive, compelling business proposal based on the following information:

CLIENT INFORMATION:
- Client Name: ${clientName}
- Company: ${clientCompany || 'Individual/Personal'}
- Email: ${clientEmail}

PROJECT DETAILS:
- Description: ${projectDescription}
- Scope of Work: ${projectScope}
- Timeline: ${timeline}
- Budget: $${budget}
${additionalRequirements ? `- Additional Requirements: ${additionalRequirements}` : ''}

Please create a professional proposal with the following structure:

1. **Executive Summary** - Brief overview and value proposition
2. **Project Understanding** - Demonstrate clear understanding of client needs
3. **Proposed Solution** - Detailed approach and methodology
4. **Scope of Work** - Specific deliverables and milestones
5. **Timeline & Process** - Project phases and estimated completion
6. **Investment** - Pricing breakdown and payment terms
7. **Why Choose Me** - Qualifications and unique value
8. **Next Steps** - Clear call to action

Make the proposal:
- Professional and persuasive
- Tailored specifically to the client's needs
- Results-oriented with clear benefits
- Well-structured and easy to read
- Include specific deliverables and timelines
- Address potential concerns proactively

Write in a confident, professional tone that builds trust and demonstrates expertise.`;

    console.log('🔥 Calling OpenAI API...');

    let generatedContent;

    // Check if we should use mock response (for testing when OpenAI quota is exceeded)
    if (process.env.USE_MOCK_AI === 'true') {
      console.log('🎭 Using mock AI response for testing...');
      
      // Generate a professional mock proposal
      generatedContent = `# Executive Summary

Dear ${clientName},

Thank you for considering our services for your ${projectDescription.split(' ').slice(0, 5).join(' ')} project. We are excited about the opportunity to partner with ${clientCompany || 'your organization'} and deliver exceptional results within your $${budget} budget and ${timeline}-week timeline.

## Project Understanding

Based on our discussion, we understand that you need:
${projectScope.split('\n').slice(0, 3).map(item => `• ${item.trim()}`).join('\n')}

## Proposed Solution

Our comprehensive approach includes:

### Phase 1: Discovery & Planning (Week 1)
• Requirements analysis and technical specification
• Project roadmap and milestone definition
• Risk assessment and mitigation strategies

### Phase 2: Development & Implementation (Weeks 2-${Math.max(2, parseInt(timeline) - 1)})
• Core system development
• Feature implementation and testing
• Regular progress updates and client feedback

### Phase 3: Delivery & Launch (Week ${timeline})
• Final testing and quality assurance
• Deployment and go-live support
• Documentation and training delivery

## Scope of Work

**Deliverables:**
${projectScope.split('\n').map((item, index) => `${index + 1}. ${item.trim()}`).join('\n')}

**Timeline:** ${timeline} weeks from project kickoff
**Budget:** $${budget} USD

## Investment Breakdown

• Development: ${Math.round(parseFloat(budget) * 0.7)} USD (70%)
• Project Management: ${Math.round(parseFloat(budget) * 0.2)} USD (20%)
• Testing & QA: ${Math.round(parseFloat(budget) * 0.1)} USD (10%)

**Payment Terms:** 50% upfront, 50% upon completion

## Why Choose Our Team

• 5+ years of experience in similar projects
• Proven track record of on-time delivery
• Comprehensive post-launch support
• Transparent communication throughout the project

## Next Steps

1. **Project Kickoff:** Schedule within 3 business days of agreement
2. **Regular Updates:** Weekly progress reports and demos
3. **Final Delivery:** Complete project within ${timeline} weeks

We're confident this proposal meets your requirements and budget. We look forward to discussing this opportunity further and answering any questions you may have.

Best regards,
FreelanceFlow Team

---
*This proposal is valid for 30 days from the date of submission.*`;

      console.log('✅ Mock AI response generated');
      console.log('📝 Generated content preview:', generatedContent.substring(0, 200) + '...');
    } else {
      // Get OpenAI instance
      const openai = getOpenAI();

      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert freelance proposal writer with 10+ years of experience creating winning proposals that convert prospects into clients. You understand client psychology and write persuasive, professional content."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2500,
        temperature: 0.7,
      });

      generatedContent = completion.choices[0].message.content;

      console.log('✅ OpenAI API response received');
      console.log('📝 Generated content preview:', generatedContent?.substring(0, 200) + '...');
    }

    console.log('💾 Creating proposal in database...');
    
    // Create and save the proposal
    const proposalData = {
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
          amount: parseFloat(budget),
          currency: 'USD'
        }
      },
      content: generatedContent,
      status: 'draft',
      createdBy: req.user.id,
      aiGenerated: true
    };
    
    console.log('📊 Proposal data to save:', {
      title: proposalData.title,
      clientName: proposalData.client.name,
      budget: proposalData.project.budget.amount,
      createdBy: proposalData.createdBy
    });
    
    const proposal = await Proposal.create(proposalData);

    console.log('💾 Proposal saved to database with ID:', proposal._id);

    // Increment user's proposal usage
    await req.user.incrementProposalUsage();

    console.log('✅ AI proposal generation completed successfully');

    res.status(201).json({
      success: true,
      message: 'AI proposal generated successfully',
      proposal,
      remainingProposals: req.user.subscription.proposalsLimit - req.user.subscription.proposalsUsed
    });

  } catch (error) {
    console.error('❌ AI generation error:', error.message);
    console.error('❌ Full error:', error);
    console.error('📊 Error stack:', error.stack);
    
    // Handle configuration errors
    if (error.message.includes('OpenAI API key is not configured')) {
      console.log('🔧 Configuration error detected');
      return res.status(500).json({ 
        message: 'AI service configuration error. Please contact support.' 
      });
    }
    
    // Handle OpenAI API errors
    if (error.code) {
      console.log('🔥 OpenAI API error code:', error.code);
      
      if (error.code === 'insufficient_quota') {
        return res.status(429).json({ 
          message: 'OpenAI API quota exceeded. Please try again later or contact support.' 
        });
      }
      
      if (error.code === 'invalid_api_key') {
        return res.status(500).json({ 
          message: 'AI service configuration error. Please contact support.' 
        });
      }

      if (error.code === 'model_not_found') {
        return res.status(500).json({ 
          message: 'AI model not available. Please contact support.' 
        });
      }

      if (error.code === 'rate_limit_exceeded') {
        return res.status(429).json({ 
          message: 'Too many requests. Please wait a moment and try again.' 
        });
      }
    }
    
    // Handle database errors
    if (error.name === 'ValidationError') {
      console.log('💾 Database validation error:', error.message);
      return res.status(400).json({
        message: 'Invalid data provided',
        error: error.message
      });
    }
    
    // Handle mongoose errors
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      console.log('💾 Database error:', error.message);
      return res.status(500).json({
        message: 'Database error occurred',
        error: error.message
      });
    }

    console.log('❓ Unhandled error type:', error.constructor.name);
    res.status(500).json({ 
      message: 'Error generating AI proposal. Please try again.',
      error: error.message,
      type: error.constructor.name
    });
  }
});

// @desc    Get AI service status
// @route   GET /api/ai/status
// @access  Private
router.get('/status', protect, async (req, res) => {
  try {
    // Simple health check for OpenAI service
    const openai = getOpenAI();
    const healthCheck = await openai.models.list();
    
    res.json({
      success: true,
      user: {
        email: req.user.email,
        role: req.user.role,
        subscription: req.user.subscription
      },
      aiService: {
        status: 'available',
        provider: 'OpenAI',
        model: 'gpt-3.5-turbo',
        remainingProposals: req.user.subscription.proposalsLimit === -1 
          ? 'unlimited' 
          : req.user.subscription.proposalsLimit - req.user.subscription.proposalsUsed
      }
    });
  } catch (error) {
    console.error('OpenAI health check failed:', error);
    
    // Check if it's a configuration error
    if (error.message.includes('OpenAI API key is not configured')) {
      return res.json({
        success: false,
        user: {
          email: req.user.email,
          role: req.user.role,
          subscription: req.user.subscription
        },
        aiService: {
          status: 'configuration_error',
          provider: 'OpenAI',
          model: 'gpt-3.5-turbo',
          error: 'API key not configured',
          remainingProposals: req.user.subscription.proposalsLimit === -1 
            ? 'unlimited' 
            : req.user.subscription.proposalsLimit - req.user.subscription.proposalsUsed
        }
      });
    }
    
    res.json({
      success: true,
      user: {
        email: req.user.email,
        role: req.user.role,
        subscription: req.user.subscription
      },
      aiService: {
        status: 'available', // Still show as available for user experience
        provider: 'OpenAI',
        model: 'gpt-3.5-turbo',
        remainingProposals: req.user.subscription.proposalsLimit === -1 
          ? 'unlimited' 
          : req.user.subscription.proposalsLimit - req.user.subscription.proposalsUsed,
        warning: 'Health check failed'
      }
    });
  }
});

// @desc    Reset user proposal usage (for testing)
// @route   POST /api/ai/reset-usage
// @access  Private
router.post('/reset-usage', protect, async (req, res) => {
  try {
    req.user.subscription.proposalsUsed = 0;
    await req.user.save();
    
    res.json({
      success: true,
      message: 'Proposal usage reset successfully',
      subscription: req.user.subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting usage',
      error: error.message
    });
  }
});

// @desc    Reset all users proposal usage (for testing - remove in production)
// @route   POST /api/ai/reset-all-usage
// @access  Public (for testing only)
router.post('/reset-all-usage', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    
    // Reset all users' proposal usage
    await User.updateMany(
      {},
      { 
        $set: { 
          'subscription.proposalsUsed': 0,
          'subscription.proposalsLimit': 5
        } 
      }
    );
    
    res.json({
      success: true,
      message: 'All users proposal usage reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resetting usage',
      error: error.message
    });
  }
});

export default router;