import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { 
  Sparkles, 
  FileText, 
  User, 
  Briefcase, 
  DollarSign, 
  Calendar,
  ArrowRight,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ProposalGenerator = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientCompany: '',
    projectDescription: '',
    projectScope: '',
    timeline: '',
    budget: '',
    additionalRequirements: ''
  })

  const canCreateProposal = user?.subscription?.proposalsUsed < user?.subscription?.proposalsLimit || user?.subscription?.proposalsLimit === -1
  const remainingProposals = user?.subscription?.proposalsLimit === -1 ? 'unlimited' : user?.subscription?.proposalsLimit - user?.subscription?.proposalsUsed

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!canCreateProposal) {
      toast.error('You have reached your proposal limit. Please upgrade your plan.')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post('/api/ai/generate-proposal', formData)
      
      if (response.data.success) {
        toast.success('Proposal generated successfully!')
        navigate('/proposals')
      }
    } catch (error) {
      if (error.response?.data?.needsUpgrade) {
        toast.error('Proposal limit reached. Please upgrade your plan.')
        navigate('/pricing')
      } else {
        toast.error(error.response?.data?.message || 'Error generating proposal')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1)
  }

  const prevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.clientName && formData.clientEmail
      case 2:
        return formData.projectDescription && formData.projectScope && formData.timeline
      case 3:
        return formData.budget
      default:
        return true
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Proposal Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            Create professional, tailored proposals in seconds with our AI assistant. 
            Just provide the project details and let our AI craft the perfect proposal.
          </p>
          
          {/* Proposal Limit Info */}
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
            canCreateProposal 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {canCreateProposal ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {remainingProposals === 'unlimited' 
                  ? 'Unlimited proposals remaining' 
                  : `${remainingProposals} proposal${remainingProposals !== 1 ? 's' : ''} remaining`
                }
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 mr-2" />
                Proposal limit reached - Upgrade to continue
              </>
            )}
          </div>
        </div>

        {!canCreateProposal ? (
          /* Upgrade Required */
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Upgrade Required
            </h2>
            <p className="text-gray-600 mb-8">
              You've used all your free proposals. Upgrade to a paid plan to continue generating 
              unlimited professional proposals with AI.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="btn-primary"
            >
              View Pricing Plans
            </button>
          </div>
        ) : (
          /* Form */
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Progress Bar */}
            <div className="bg-gray-50 px-8 py-4">
              <div className="flex items-center">
                {[1, 2, 3].map((stepNum) => (
                  <div key={stepNum} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNum 
                        ? 'bg-primary-600 text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {stepNum}
                    </div>
                    {stepNum < 3 && (
                      <div className={`w-12 h-1 mx-2 ${
                        step > stepNum ? 'bg-primary-600' : 'bg-gray-300'
                      }`} />
                    )}
                  </div>
                ))}
                <div className="ml-4 text-sm text-gray-600">
                  Step {step} of 3
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8">
              {/* Step 1: Client Information */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <User className="h-6 w-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Client Information</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Name *
                      </label>
                      <input
                        type="text"
                        name="clientName"
                        required
                        className="input-field"
                        placeholder="John Smith"
                        value={formData.clientName}
                        onChange={handleChange}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Client Email *
                      </label>
                      <input
                        type="email"
                        name="clientEmail"
                        required
                        className="input-field"
                        placeholder="john@company.com"
                        value={formData.clientEmail}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company Name (optional)
                    </label>
                    <input
                      type="text"
                      name="clientCompany"
                      className="input-field"
                      placeholder="Acme Corporation"
                      value={formData.clientCompany}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Project Details */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <Briefcase className="h-6 w-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Project Details</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Description *
                    </label>
                    <textarea
                      name="projectDescription"
                      required
                      rows={4}
                      className="input-field"
                      placeholder="Describe the project in detail. What does the client need? What are their goals?"
                      value={formData.projectDescription}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project Scope *
                    </label>
                    <textarea
                      name="projectScope"
                      required
                      rows={4}
                      className="input-field"
                      placeholder="List the specific deliverables and tasks you'll complete..."
                      value={formData.projectScope}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeline *
                    </label>
                    <input
                      type="text"
                      name="timeline"
                      required
                      className="input-field"
                      placeholder="2-3 weeks, 1 month, etc."
                      value={formData.timeline}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Budget & Final Details */}
              {step === 3 && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center space-x-3 mb-6">
                    <DollarSign className="h-6 w-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">Budget & Final Details</h2>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Budget (USD) *
                    </label>
                    <input
                      type="number"
                      name="budget"
                      required
                      min="0"
                      className="input-field"
                      placeholder="5000"
                      value={formData.budget}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Requirements (optional)
                    </label>
                    <textarea
                      name="additionalRequirements"
                      rows={3}
                      className="input-field"
                      placeholder="Any special requirements, preferences, or additional context..."
                      value={formData.additionalRequirements}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-8 mt-8 border-t border-gray-200">
                <div>
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="btn-secondary"
                    >
                      Previous
                    </button>
                  )}
                </div>

                <div>
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={nextStep}
                      disabled={!isStepValid()}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      Next
                      <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={loading || !isStepValid()}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed group bg-gradient-to-r from-primary-600 to-green-600 hover:from-primary-700 hover:to-green-700"
                    >
                      {loading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Generating...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Zap className="mr-2 h-5 w-5" />
                          Generate AI Proposal
                        </div>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Powered</h3>
            <p className="text-gray-600">Advanced AI creates personalized, professional proposals</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lightning Fast</h3>
            <p className="text-gray-600">Generate complete proposals in under 30 seconds</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional</h3>
            <p className="text-gray-600">Industry-standard formatting and structure</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProposalGenerator