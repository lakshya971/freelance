import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  FileText, 
  Send, 
  Save, 
  Eye, 
  Share2, 
  Mail, 
  Lock,
  Globe,
  Clock,
  DollarSign,
  User,
  Layers,
  Plus,
  Trash2,
  AlertCircle,
  Wand2
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function ProposalForm({ proposal, clients, onSubmit, onCancel }) {
  const { user } = useAuth()
  const isEditing = Boolean(proposal)

  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSharingOptions, setShowSharingOptions] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const [formData, setFormData] = useState({
    title: proposal?.title || '',
    client_id: proposal?.client_id || '',
    description: proposal?.description || '',
    total_amount: proposal?.total_amount || '',
    status: proposal?.status || 'draft',
    valid_until: proposal?.valid_until ? new Date(proposal.valid_until).toISOString().split('T')[0] : '',
    // Enhanced sections
    sections: proposal?.sections || {
      executiveSummary: { title: 'Executive Summary', content: '', enabled: true },
      projectUnderstanding: { title: 'Project Understanding', content: '', enabled: true },
      proposedSolution: { title: 'Proposed Solution', content: '', enabled: true },
      scopeOfWork: { title: 'Scope of Work', content: '', enabled: true },
      timeline: { title: 'Timeline & Process', content: '', enabled: true },
      investment: { title: 'Investment', content: '', enabled: true },
      whyChooseUs: { title: 'Why Choose Us', content: '', enabled: true },
      nextSteps: { title: 'Next Steps', content: '', enabled: true }
    },
    customSections: proposal?.customSections || [],
    // Sharing settings
    sharing: proposal?.sharing || {
      isShared: false,
      shareToken: '',
      password: '',
      requirePassword: false,
      allowComments: true,
      expiresAt: null
    },
    // Notification settings
    notifications: proposal?.notifications || {
      emailOnView: true,
      emailOnComment: true,
      emailOnResponse: true
    }
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await axios.get('/api/templates')
      setTemplates(response.data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const proposalData = {
        ...formData,
        total_amount: parseFloat(formData.total_amount)
      }
      
      await onSubmit(proposalData)
    } catch (error) {
      toast.error('Error saving proposal')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const applyTemplate = async (template) => {
    try {
      // Record template usage
      await axios.post(`/api/templates/${template._id}/use`)
      
      // Apply template sections to form
      setFormData(prev => ({
        ...prev,
        sections: { ...prev.sections, ...template.sections },
        customSections: [...prev.customSections, ...(template.customSections || [])]
      }))
      
      setShowTemplates(false)
      toast.success('Template applied successfully')
    } catch (error) {
      toast.error('Error applying template')
    }
  }

  const addCustomSection = () => {
    setFormData(prev => ({
      ...prev,
      customSections: [
        ...prev.customSections,
        { title: '', content: '', order: prev.customSections.length, enabled: true }
      ]
    }))
  }

  const updateCustomSection = (index, field, value) => {
    const updatedSections = [...formData.customSections]
    updatedSections[index][field] = value
    setFormData(prev => ({ ...prev, customSections: updatedSections }))
  }

  const removeCustomSection = (index) => {
    const updatedSections = formData.customSections.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, customSections: updatedSections }))
  }

  const generateShareLink = async () => {
    try {
      const response = await axios.post(`/api/proposals/${proposal.id}/share`, {
        requirePassword: formData.sharing.requirePassword,
        password: formData.sharing.password,
        allowComments: formData.sharing.allowComments,
        expiresAt: formData.sharing.expiresAt
      })
      
      setFormData(prev => ({
        ...prev,
        sharing: { ...prev.sharing, ...response.data }
      }))
      
      toast.success('Share link generated')
    } catch (error) {
      toast.error('Error generating share link')
    }
  }

  const sendProposalEmail = async () => {
    try {
      const client = clients.find(c => c.id === formData.client_id)
      if (!client) {
        toast.error('Please select a client first')
        return
      }

      await axios.post(`/api/proposals/${proposal.id}/send-email`, {
        recipientEmail: client.email,
        message: `Please review your proposal: ${formData.title}`
      })
      
      toast.success('Proposal sent via email')
    } catch (error) {
      toast.error('Error sending email')
    }
  }

  const tabs = [
    { id: 'details', label: 'Basic Details', icon: FileText },
    { id: 'sections', label: 'Content Sections', icon: Layers },
    { id: 'sharing', label: 'Sharing & Delivery', icon: Share2 }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center">
            <FileText className="h-6 w-6 text-green-500 mr-3" />
            {isEditing ? 'Edit Proposal' : 'Create New Proposal'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Basic Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proposal Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client *
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => handleChange('client_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Amount ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) => handleChange('total_amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until *
                  </label>
                  <input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => handleChange('valid_until', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Content Sections Tab */}
          {activeTab === 'sections' && (
            <div className="space-y-6">
              {/* Template Selection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Quick Start with Templates</h4>
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    Browse Templates
                  </button>
                </div>
                
                {showTemplates && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                    {templates.map((template) => (
                      <div
                        key={template._id}
                        className="bg-white border rounded-lg p-3 hover:border-green-300 transition-colors cursor-pointer"
                        onClick={() => applyTemplate(template)}
                      >
                        <h5 className="font-medium text-gray-900 text-sm">{template.name}</h5>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">{template.category}</span>
                          <span className="text-xs text-green-600">{template.usageCount || 0} uses</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Standard Sections */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Proposal Sections</h4>
                <div className="space-y-4">
                  {Object.entries(formData.sections).map(([key, section]) => (
                    <div key={key} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={section.enabled}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              sections: {
                                ...prev.sections,
                                [key]: { ...section, enabled: e.target.checked }
                              }
                            }))}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <label className="ml-2 font-medium text-gray-900">
                            {section.title}
                          </label>
                        </div>
                      </div>
                      {section.enabled && (
                        <textarea
                          value={section.content}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            sections: {
                              ...prev.sections,
                              [key]: { ...section, content: e.target.value }
                            }
                          }))}
                          rows={4}
                          placeholder={`Enter content for ${section.title}...`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Sections */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Custom Sections</h4>
                  <button
                    type="button"
                    onClick={addCustomSection}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Section
                  </button>
                </div>
                
                {formData.customSections.map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => updateCustomSection(index, 'title', e.target.value)}
                        placeholder="Section title..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent mr-3"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomSection(index)}
                        className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateCustomSection(index, 'content', e.target.value)}
                      rows={3}
                      placeholder="Section content..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sharing Tab */}
          {activeTab === 'sharing' && (
            <div className="space-y-6">
              {/* Notification Settings */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Notification Preferences</h4>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifications.emailOnView}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailOnView: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Email me when client views the proposal
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifications.emailOnComment}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailOnComment: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Email me when client leaves comments
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.notifications.emailOnResponse}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, emailOnResponse: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Email me when client accepts/rejects proposal
                    </span>
                  </label>
                </div>
              </div>

              {/* Sharing Settings */}
              {isEditing && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Sharing Options</h4>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.sharing.requirePassword}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sharing: { ...prev.sharing, requirePassword: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Require password to view proposal
                      </span>
                    </label>

                    {formData.sharing.requirePassword && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          value={formData.sharing.password}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            sharing: { ...prev.sharing, password: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.sharing.allowComments}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sharing: { ...prev.sharing, allowComments: e.target.checked }
                        }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">
                        Allow client to leave comments
                      </span>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Link Expires (Optional)
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.sharing.expiresAt}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          sharing: { ...prev.sharing, expiresAt: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={generateShareLink}
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Generate Share Link
                      </button>
                      
                      <button
                        type="button"
                        onClick={sendProposalEmail}
                        className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send via Email
                      </button>
                    </div>

                    {formData.sharing.shareToken && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Share Link
                        </label>
                        <div className="flex">
                          <input
                            type="text"
                            value={`${window.location.origin}/proposal/${formData.sharing.shareToken}`}
                            readOnly
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg bg-gray-50"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/proposal/${formData.sharing.shareToken}`)
                              toast.success('Link copied to clipboard')
                            }}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-lg hover:bg-gray-300 transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6 mt-8 border-t">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? 'Update Proposal' : 'Create Proposal'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}