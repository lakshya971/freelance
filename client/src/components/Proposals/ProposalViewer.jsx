import React from 'react'
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  User,
  Download,
  Mail,
  Share2
} from 'lucide-react'

const ProposalViewer = ({ proposal, onDownload, onShare, onEmail }) => {
  const formatProposalContent = (content) => {
    // Split content by sections marked with ---
    const sections = content.split('---').filter(section => section.trim())
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim()
      const lines = trimmedSection.split('\n').filter(line => line.trim())
      
      if (lines.length === 0) return null
      
      // Check if this is a header section (contains PROPOSAL FOR, COMPANY, DATE)
      if (trimmedSection.includes('PROPOSAL FOR:') || trimmedSection.includes('COMPANY:') || trimmedSection.includes('DATE:')) {
        return (
          <div key={index} className="proposal-header mb-8">
            {lines.map((line, lineIndex) => {
              if (line.includes('PROPOSAL FOR:')) {
                return (
                  <h1 key={lineIndex} className="text-2xl font-bold text-gray-900 mb-2">
                    {line.replace('PROPOSAL FOR:', '').trim()}
                  </h1>
                )
              }
              if (line.includes('COMPANY:')) {
                return (
                  <div key={lineIndex} className="text-right absolute top-4 right-6">
                    <div className="bg-gray-50 px-4 py-2 rounded-lg border">
                      <div className="flex items-center text-sm font-medium text-gray-700">
                        <Building2 className="h-4 w-4 mr-2 text-blue-600" />
                        {line.replace('COMPANY:', '').trim()}
                      </div>
                    </div>
                  </div>
                )
              }
              if (line.includes('DATE:')) {
                return (
                  <div key={lineIndex} className="flex items-center text-sm text-gray-600 mb-4">
                    <Calendar className="h-4 w-4 mr-2" />
                    {line.replace('DATE:', '').trim()}
                  </div>
                )
              }
              return null
            })}
          </div>
        )
      }
      
      // Check if this is a section header (all caps)
      const firstLine = lines[0]
      if (firstLine && firstLine === firstLine.toUpperCase() && !firstLine.includes(':') && firstLine.length < 50) {
        return (
          <div key={index} className="proposal-section mb-8">
            <h2 className="text-xl font-bold text-blue-900 border-b-2 border-blue-200 pb-2 mb-4">
              {firstLine}
            </h2>
            <div className="prose prose-gray max-w-none">
              {lines.slice(1).map((line, lineIndex) => {
                if (!line.trim()) return <br key={lineIndex} />
                
                // Handle bullet points
                if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('✓')) {
                  return (
                    <div key={lineIndex} className="flex items-start mb-2">
                      <span className="text-green-600 mr-2 mt-1">•</span>
                      <span>{line.trim().substring(1).trim()}</span>
                    </div>
                  )
                }
                
                // Handle numbered lists
                if (/^\d+\./.test(line.trim())) {
                  return (
                    <div key={lineIndex} className="mb-2 pl-4">
                      <span className="font-medium text-blue-700">{line.trim()}</span>
                    </div>
                  )
                }
                
                // Handle bold text (marked with **)
                if (line.includes('**')) {
                  const parts = line.split('**')
                  return (
                    <p key={lineIndex} className="mb-3">
                      {parts.map((part, partIndex) => 
                        partIndex % 2 === 1 ? 
                          <strong key={partIndex} className="font-semibold text-gray-900">{part}</strong> : 
                          part
                      )}
                    </p>
                  )
                }
                
                return <p key={lineIndex} className="mb-3 leading-relaxed">{line}</p>
              })}
            </div>
          </div>
        )
      }
      
      // Regular content section
      return (
        <div key={index} className="proposal-section mb-6">
          <div className="prose prose-gray max-w-none">
            {lines.map((line, lineIndex) => {
              if (!line.trim()) return <br key={lineIndex} />
              return <p key={lineIndex} className="mb-3 leading-relaxed">{line}</p>
            })}
          </div>
        </div>
      )
    })
  }

  return (
    <div className="bg-white shadow-2xl rounded-xl overflow-hidden max-w-5xl mx-auto">
      {/* Header with actions */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-white">
            <h1 className="text-xl font-bold">Professional Proposal</h1>
            <p className="text-blue-100 text-sm">Generated by FreelanceFlow AI</p>
          </div>
          <div className="flex items-center gap-3">
            {onDownload && (
              <button
                onClick={() => onDownload(proposal)}
                className="inline-flex items-center px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </button>
            )}
            {onShare && (
              <button
                onClick={() => onShare(proposal)}
                className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-medium text-sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            )}
            {onEmail && (
              <button
                onClick={() => onEmail(proposal)}
                className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400 transition-colors font-medium text-sm"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Proposal content */}
      <div className="relative p-8 bg-white min-h-[800px]" style={{ fontFamily: 'Georgia, serif' }}>
        {/* Company name in top right if exists */}
        {proposal.client.company && (
          <div className="absolute top-4 right-4 z-10">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 px-6 py-3 rounded-xl shadow-lg">
              <div className="flex items-center text-sm font-bold text-blue-900">
                <Building2 className="h-5 w-5 mr-2 text-blue-700" />
                {proposal.client.company}
              </div>
              <div className="text-xs text-blue-600 mt-1">Client Company</div>
            </div>
          </div>
        )}

        {/* Project summary bar */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 mb-8 mt-16 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2 text-blue-600" />
              <span className="font-medium">Client:</span>
              <span className="ml-1 font-semibold">{proposal.client.name}</span>
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-green-600" />
              <span className="font-medium">Budget:</span>
              <span className="ml-1 font-semibold text-green-700">${proposal.project.budget.amount.toLocaleString()}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-purple-600" />
              <span className="font-medium">Timeline:</span>
              <span className="ml-1 font-semibold">{proposal.project.timeline}</span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="proposal-content">
          {formatProposalContent(proposal.content)}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 mt-12 text-center text-sm text-gray-500">
          <p>This proposal was generated by FreelanceFlow AI • {new Date(proposal.createdAt).toLocaleDateString()}</p>
          <p className="mt-1">Proposal ID: {proposal._id.slice(-8)}</p>
        </div>
      </div>
    </div>
  )
}

export default ProposalViewer
