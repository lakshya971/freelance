import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Lock, 
  Eye, 
  MessageCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  DollarSign,
  User,
  Calendar,
  Shield,
  Send,
  AlertCircle
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const PublicProposalViewer = () => {
  const { token } = useParams()
  const navigate = useNavigate()
  
  const [proposal, setProposal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [passwordRequired, setPasswordRequired] = useState(false)
  const [password, setPassword] = useState('')
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [responding, setResponding] = useState(false)

  useEffect(() => {
    fetchProposal()
  }, [token])

  const fetchProposal = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/proposals/shared/${token}`, {
        params: password ? { password } : {}
      })
      
      if (response.data.requiresPassword && !password) {
        setPasswordRequired(true)
        setLoading(false)
        return
      }
      
      setProposal(response.data.proposal)
      setComments(response.data.proposal.comments || [])
      setPasswordRequired(false)
      setError(null)
    } catch (error) {
      if (error.response?.status === 401) {
        setPasswordRequired(true)
        toast.error('Incorrect password')
      } else if (error.response?.status === 404) {
        setError('Proposal not found or has expired')
      } else {
        setError('Error loading proposal')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    fetchProposal()
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmittingComment(true)
    try {
      const response = await axios.post(`/api/proposals/shared/${token}/comment`, {
        content: newComment,
        password: password || undefined
      })
      
      setComments([...comments, response.data.comment])
      setNewComment('')
      toast.success('Comment added successfully')
    } catch (error) {
      toast.error('Error adding comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const respondToProposal = async (action) => {
    setResponding(true)
    try {
      await axios.post(`/api/proposals/shared/${token}/respond`, {
        action, // 'accept' or 'reject'
        password: password || undefined
      })
      
      setProposal(prev => ({ ...prev, status: action === 'accept' ? 'accepted' : 'rejected' }))
      toast.success(`Proposal ${action}ed successfully`)
    } catch (error) {
      toast.error(`Error ${action}ing proposal`)
    } finally {
      setResponding(false)
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-6">
            <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Required</h1>
            <p className="text-gray-600">This proposal is password protected.</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Access Proposal'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h1>
          <p className="text-gray-600">The proposal you're looking for doesn't exist or has expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{proposal.title}</h1>
                <p className="text-gray-600">From {proposal.freelancer?.name || 'Freelancer'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Proposal Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Proposal Overview</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Total Investment</p>
                    <p className="text-lg font-semibold text-gray-900">${proposal.total_amount?.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-blue-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Valid Until</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(proposal.valid_until)}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-purple-500 mr-2" />
                  <div>
                    <p className="text-sm text-gray-600">Submitted</p>
                    <p className="text-lg font-semibold text-gray-900">{formatDate(proposal.createdAt)}</p>
                  </div>
                </div>
              </div>

              {proposal.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Description</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{proposal.description}</p>
                </div>
              )}
            </div>

            {/* Proposal Sections */}
            {proposal.sections && (
              <div className="space-y-6">
                {Object.entries(proposal.sections)
                  .filter(([_, section]) => section.enabled && section.content)
                  .map(([key, section]) => (
                    <div key={key} className="bg-white rounded-xl shadow-sm p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h3>
                      <div className="prose max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                      </div>
                    </div>
                  ))}
                
                {/* Custom Sections */}
                {proposal.customSections?.map((section, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{section.title}</h3>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 whitespace-pre-wrap">{section.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comments Section */}
            {proposal.sharing?.allowComments && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Comments & Discussion</h3>
                
                {/* Existing Comments */}
                {comments.length > 0 && (
                  <div className="space-y-4 mb-6">
                    {comments.map((comment, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-500 mr-2" />
                            <span className="font-medium text-gray-900">{comment.author || 'Client'}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment Form */}
                <form onSubmit={submitComment}>
                  <div className="mb-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      placeholder="Leave a comment or ask a question..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submittingComment || !newComment.trim()}
                    className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Action Buttons */}
            {proposal.status === 'pending' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Take Action</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => respondToProposal('accept')}
                    disabled={responding}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Accept Proposal
                  </button>
                  
                  <button
                    onClick={() => respondToProposal('reject')}
                    disabled={responding}
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Decline Proposal
                  </button>
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex">
                    <Shield className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Secure Decision</p>
                      <p className="text-sm text-blue-700">Your response will be recorded and the freelancer will be notified.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Proposal Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Proposal Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="text-sm font-medium text-gray-900">{proposal.viewCount || 0}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Comments</span>
                  <span className="text-sm font-medium text-gray-900">{comments.length}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(proposal.createdAt)}</span>
                </div>
                
                {proposal.sharing?.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expires</span>
                    <span className="text-sm font-medium text-gray-900">{formatDate(proposal.sharing.expiresAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Freelancer</p>
                  <p className="text-sm font-medium text-gray-900">{proposal.freelancer?.name || 'Professional Freelancer'}</p>
                </div>
                
                {proposal.freelancer?.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm font-medium text-gray-900">{proposal.freelancer.email}</p>
                  </div>
                )}
                
                {proposal.freelancer?.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{proposal.freelancer.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PublicProposalViewer
