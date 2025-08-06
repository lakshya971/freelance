import express from 'express';
import OpenAI from 'openai';
import { protect, restrictTo } from '../middleware/auth.js';
import Proposal from '../models/Proposal.js';
import ProposalTemplate from '../models/ProposalTemplate.js';

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

    // Construct the AI prompt for PDF-style formatting
    const prompt = `You are an expert freelance proposal writer creating a professional business proposal. Generate content in a clean, structured format suitable for PDF-style presentation.

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

Create a professional proposal using this EXACT structure and formatting:

---

PROPOSAL FOR: ${clientName}
${clientCompany ? `COMPANY: ${clientCompany}` : ''}
DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

EXECUTIVE SUMMARY

[Write 2-3 compelling paragraphs that summarize the project value proposition, your understanding of their needs, and the expected outcomes. Focus on benefits to the client.]

---

PROJECT UNDERSTANDING

[Demonstrate clear understanding of the client's specific needs and challenges. Show that you've listened and understood their requirements.]

---

PROPOSED SOLUTION

[Detail your approach and methodology. Break down into clear phases or components. Use bullet points and numbered lists for clarity.]

---

SCOPE OF WORK & DELIVERABLES

[List specific deliverables in a clean, numbered format:
1. [Deliverable 1]
2. [Deliverable 2]
3. [Deliverable 3]
etc.]

---

PROJECT TIMELINE

[Create a clear timeline with phases and milestones. Use this format:
Week 1-2: [Phase name and activities]
Week 3-4: [Phase name and activities]
etc.]

---

INVESTMENT & PAYMENT TERMS

Total Project Investment: $${budget}

Payment Schedule:
- 50% ($${Math.round(parseFloat(budget) * 0.5)}) - Upon project commencement
- 50% ($${Math.round(parseFloat(budget) * 0.5)}) - Upon project completion

[Include any additional payment terms or options]

---

WHY CHOOSE FREELANCEFLOW

[List 4-6 compelling reasons with specific benefits and qualifications]

---

NEXT STEPS

1. Review this proposal
2. Schedule a brief discussion call
3. Project kickoff within 3 business days of agreement
4. Begin work immediately upon contract signing

---

This proposal is valid for 30 days from the date above.

Requirements:
- Use clear section headers with --- separators
- Professional, confident tone
- Specific, measurable deliverables
- Clear value propositions
- No filler content - every sentence should add value
- Focus on client benefits and outcomes`;

    console.log('🔥 Calling OpenAI API...');

    let generatedContent;

    // Check if we should use mock response (for testing when OpenAI quota is exceeded)
    if (process.env.USE_MOCK_AI === 'true') {
      console.log('🎭 Using mock AI response for testing...');
      
      // Generate a professional mock proposal in PDF style
      generatedContent = `PROPOSAL FOR: ${clientName}
${clientCompany ? `COMPANY: ${clientCompany}` : ''}
DATE: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

---

EXECUTIVE SUMMARY

Thank you for considering FreelanceFlow for your ${projectDescription.split(' ').slice(0, 5).join(' ')} project. We understand the importance of delivering exceptional results that drive real business value. This proposal outlines our comprehensive approach to ${projectDescription.split(' ').slice(0, 3).join(' ')}, designed to exceed your expectations within your $${budget} budget and ${timeline} timeline.

Our proven methodology combines industry best practices with innovative solutions, ensuring your project not only meets but surpasses your objectives. We're committed to transparent communication, on-time delivery, and building a long-term partnership that supports your continued success.

---

PROJECT UNDERSTANDING

Based on our discussion, we recognize that you need ${projectScope.split('\n').slice(0, 2).map(item => item.trim()).join(' and ')}. We understand the critical importance of ${projectDescription.split(' ').slice(-5).join(' ')} and how this project will impact your business operations.

Your specific requirements include delivering a solution that balances quality, efficiency, and cost-effectiveness while maintaining the highest professional standards throughout the development process.

---

PROPOSED SOLUTION

Our comprehensive approach is structured in three distinct phases:

**Phase 1: Discovery & Foundation**
- Detailed requirements analysis and technical specification
- Project architecture and system design
- Risk assessment and mitigation planning
- Resource allocation and timeline optimization

**Phase 2: Development & Implementation**
- Core system development using industry best practices
- Iterative development with regular client feedback
- Quality assurance and testing protocols
- Performance optimization and security implementation

**Phase 3: Delivery & Support**
- Final testing and quality validation
- System deployment and go-live support
- Documentation and training delivery
- Post-launch support and optimization

---

SCOPE OF WORK & DELIVERABLES

${projectScope.split('\n').map((item, index) => `${index + 1}. ${item.trim()}`).join('\n')}

**Additional Deliverables:**
${projectScope.split('\n').length + 1}. Comprehensive project documentation
${projectScope.split('\n').length + 2}. Training materials and user guides
${projectScope.split('\n').length + 3}. 30-day post-launch support

---

PROJECT TIMELINE

**Week 1-2: Discovery & Planning**
Initial project setup, requirements gathering, and technical specification development.

**Week 3-${Math.max(3, parseInt(timeline) - 2)}: Development Phase**
Core development work, feature implementation, and regular progress reviews.

**Week ${Math.max(4, parseInt(timeline) - 1)}-${timeline}: Testing & Delivery**
Final testing, quality assurance, deployment, and project handover.

**Ongoing: Support & Optimization**
Continuous support and performance monitoring for optimal results.

---

INVESTMENT & PAYMENT TERMS

Total Project Investment: $${budget}

**Payment Schedule:**
- 50% ($${Math.round(parseFloat(budget) * 0.5)}) - Upon project commencement
- 50% ($${Math.round(parseFloat(budget) * 0.5)}) - Upon project completion

**Investment Breakdown:**
- Development & Implementation: ${Math.round(parseFloat(budget) * 0.70)}$ (70%)
- Project Management: $${Math.round(parseFloat(budget) * 0.20)} (20%)
- Testing & Quality Assurance: $${Math.round(parseFloat(budget) * 0.10)} (10%)

All payments can be made via bank transfer, PayPal, or other agreed methods.

---

WHY CHOOSE FREELANCEFLOW

✓ **Proven Track Record**: 5+ years of successful project delivery with 98% client satisfaction rate

✓ **Expert Team**: Certified professionals with extensive experience in your industry

✓ **Quality Assurance**: Rigorous testing protocols ensure bug-free, high-performance solutions

✓ **Transparent Communication**: Regular updates, progress reports, and open communication channels

✓ **On-Time Delivery**: Proven methodology ensures projects are completed on schedule

✓ **Ongoing Support**: Comprehensive post-launch support and maintenance services

---

NEXT STEPS

1. **Review this proposal** and let us know if you have any questions or require clarifications
2. **Schedule a brief discussion call** to finalize any remaining details
3. **Project kickoff** within 3 business days of signed agreement
4. **Begin development** immediately with regular progress updates

We're excited about the opportunity to work with ${clientCompany || 'you'} and deliver exceptional results for your ${projectDescription.split(' ').slice(0, 3).join(' ')} project.

---

This proposal is valid for 30 days from the date above.

Best regards,
FreelanceFlow Development Team`;

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