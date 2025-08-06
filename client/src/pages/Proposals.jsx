import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { 
  FileText, 
  Download, 
  Eye, 
  Plus, 
  Calendar,
  DollarSign,
  User,
  Building2,
  Filter,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Sparkles
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import DeleteConfirmationModal from '../components/Shared/DeleteConfirmationModal'
import ProposalViewer from '../components/Proposals/ProposalViewer'

const Proposals = () => {
  const { user } = useAuth()
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedProposal, setSelectedProposal] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, proposal: null })
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      const response = await axios.get('/api/proposals')
      setProposals(response.data.proposals || [])
    } catch (error) {
      console.error('Error fetching proposals:', error)
      
      // Handle different types of errors
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        toast.error('Unable to connect to server. Please ensure the server is running.')
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in.')
      } else if (error.response?.status === 403) {
        toast.error('Access denied. Please check your permissions.')
      } else {
        toast.error('Failed to load proposals. Please try refreshing the page.')
      }
      
      // Set empty array so UI shows "no proposals" state instead of loading forever
      setProposals([])
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = async (proposal) => {
    try {
      toast.loading('Generating professional PDF...', { id: 'pdf-generation' })
      
      // Use jsPDF to generate PDF
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()
      
      // Set font
      doc.setFont('helvetica')
      
      // Header section with FreelanceFlow branding
      doc.setFillColor(37, 99, 235) // Blue color
      doc.rect(0, 0, 210, 30, 'F')
      
      // FreelanceFlow title
      doc.setFontSize(20)
      doc.setTextColor(255, 255, 255) // White text
      doc.text('FREELANCEFLOW', 20, 20)
      
      // Professional Proposal subtitle
      doc.setFontSize(12)
      doc.text('Professional Proposal', 140, 20)
      
      // Company name in top right if exists
      if (proposal.client.company) {
        doc.setFontSize(10)
        doc.setTextColor(255, 255, 255)
        doc.text(proposal.client.company, 20, 25)
      }
      
      // Reset text color
      doc.setTextColor(0, 0, 0)
      
      // Client info section
      let yPosition = 45
      doc.setFontSize(14)
      doc.setTextColor(37, 99, 235)
      doc.text('PROPOSAL FOR', 20, yPosition)
      
      yPosition += 10
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      doc.text(`Client: ${proposal.client.name}`, 20, yPosition)
      
      if (proposal.client.company) {
        yPosition += 7
        doc.text(`Company: ${proposal.client.company}`, 20, yPosition)
      }
      
      yPosition += 7
      doc.text(`Email: ${proposal.client.email}`, 20, yPosition)
      
      yPosition += 7
      doc.text(`Date: ${new Date(proposal.createdAt).toLocaleDateString()}`, 20, yPosition)
      
      // Project summary box
      yPosition += 15
      doc.setFillColor(248, 250, 252)
      doc.rect(20, yPosition, 170, 25, 'F')
      doc.setDrawColor(226, 232, 240)
      doc.rect(20, yPosition, 170, 25, 'S')
      
      yPosition += 8
      doc.setFontSize(10)
      doc.setTextColor(71, 85, 105)
      doc.text(`Budget: $${proposal.project.budget.amount.toLocaleString()}`, 25, yPosition)
      doc.text(`Timeline: ${proposal.project.timeline}`, 100, yPosition)
      
      yPosition += 6
      const description = proposal.project.description.length > 80 
        ? proposal.project.description.substring(0, 80) + '...'
        : proposal.project.description
      doc.text(`Description: ${description}`, 25, yPosition)
      
      // Proposal content section
      yPosition += 20
      doc.setFontSize(14)
      doc.setTextColor(37, 99, 235)
      doc.text('PROPOSAL CONTENT', 20, yPosition)
      
      yPosition += 10
      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      
      // Process content to handle formatting
      const content = proposal.content
      const sections = content.split('---').filter(section => section.trim())
      
      sections.forEach((section) => {
        const trimmedSection = section.trim()
        const lines = trimmedSection.split('\n').filter(line => line.trim())
        
        if (lines.length === 0) return
        
        // Check if this is a section header
        const firstLine = lines[0]
        if (firstLine && firstLine === firstLine.toUpperCase() && !firstLine.includes(':') && firstLine.length < 50) {
          // Add section header
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          
          yPosition += 5
          doc.setFontSize(12)
          doc.setTextColor(37, 99, 235)
          doc.text(firstLine, 20, yPosition)
          
          yPosition += 8
          doc.setFontSize(10)
          doc.setTextColor(0, 0, 0)
          
          // Add section content
          lines.slice(1).forEach((line) => {
            if (!line.trim()) return
            
            if (yPosition > 270) {
              doc.addPage()
              yPosition = 20
            }
            
            const wrappedLines = doc.splitTextToSize(line.trim(), 170)
            wrappedLines.forEach((wrappedLine) => {
              doc.text(wrappedLine, 20, yPosition)
              yPosition += 5
            })
          })
        }
      })
      
      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(128, 128, 128)
        doc.text(`Page ${i} of ${pageCount}`, 20, 290)
        doc.text('Generated by FreelanceFlow AI', 140, 290)
        doc.text(`Proposal ID: ${proposal._id.slice(-8)}`, 20, 285)
      }
      
      // Save PDF
      const fileName = `proposal-${proposal.client.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
      doc.save(fileName)
      
      toast.success('Professional PDF downloaded successfully!', { id: 'pdf-generation' })
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF', { id: 'pdf-generation' })
    }
  }

  const handleViewProposal = (proposal) => {
    setSelectedProposal(proposal)
    setShowPreview(true)
  }

  const handleDeleteProposal = async (proposalId) => {
    const proposal = proposals.find(p => p._id === proposalId)
    if (!proposal) return
    
    setDeleteModal({ open: true, proposal })
  }

  const confirmDelete = async () => {
    if (!deleteModal.proposal) return
    
    setDeleting(true)
    try {
      await axios.delete(`/api/proposals/${deleteModal.proposal._id}`)
      setProposals(proposals.filter(p => p._id !== deleteModal.proposal._id))
      toast.success('Proposal deleted successfully')
      setDeleteModal({ open: false, proposal: null })
      
      // Close preview if the deleted proposal was being previewed
      if (selectedProposal?._id === deleteModal.proposal._id) {
        setShowPreview(false)
      }
    } catch (error) {
      console.error('Error deleting proposal:', error)
      toast.error('Failed to delete proposal')
    } finally {
      setDeleting(false)
    }
  }

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.client.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'accepted': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading proposals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="h-8 w-8 text-green-500 mr-3" />
                My Proposals
              </h1>
              <p className="text-gray-600 mt-1">
                Manage and track your client proposals
              </p>
            </div>
            <Link
              to="/proposal-generator"
              className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium shadow-lg"
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Generate New Proposal
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Proposals Grid */}
        {filteredProposals.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {proposals.length === 0 ? 'No proposals yet' : 'No proposals found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {proposals.length === 0 
                ? 'Create your first AI-powered proposal to get started.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            <div className="flex items-center justify-center gap-4">
              {proposals.length === 0 && (
                <Link
                  to="/proposal-generator"
                  className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Generate Your First Proposal
                </Link>
              )}
              <button
                onClick={fetchProposals}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Refresh
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProposals.map((proposal) => (
              <div key={proposal._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                        {proposal.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-1" />
                        {proposal.client.name}
                      </div>
                      {proposal.client.company && (
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Building2 className="h-4 w-4 mr-1" />
                          {proposal.client.company}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {proposal.aiGenerated && (
                        <div className="p-1 bg-purple-100 rounded-lg">
                          <Sparkles className="h-4 w-4 text-purple-600" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                      {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                    </span>
                  </div>

                  {/* Project Details */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                      ${proposal.project.budget.amount.toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                      {proposal.project.timeline}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      Created {new Date(proposal.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewProposal(proposal)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                    <button
                      onClick={() => handleDownloadPDF(proposal)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </button>
                    <button
                      onClick={() => handleDeleteProposal(proposal._id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete proposal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && selectedProposal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Proposal Preview
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  ✕
                </button>
              </div>
              <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
                <ProposalViewer 
                  proposal={selectedProposal}
                  onDownload={handleDownloadPDF}
                  onShare={(proposal) => {
                    // Add share functionality here
                    toast.success('Share functionality coming soon!')
                  }}
                  onEmail={(proposal) => {
                    // Add email functionality here
                    toast.success('Email functionality coming soon!')
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, proposal: null })}
        onConfirm={confirmDelete}
        title="Delete Proposal"
        message={`Are you sure you want to delete "${deleteModal.proposal?.title}"?`}
        itemName={deleteModal.proposal?.client?.name ? `Client: ${deleteModal.proposal.client.name}` : ''}
        loading={deleting}
      />
    </div>
  )
}

export default Proposals
