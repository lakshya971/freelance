import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Share2, 
  Star,
  Filter,
  Search,
  FileText,
  Layers,
  Zap,
  Globe,
  Lock
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const TemplateBuilder = () => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'web-development', label: 'Web Development' },
    { value: 'mobile-app', label: 'Mobile App' },
    { value: 'design', label: 'Design' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'content', label: 'Content' },
    { value: 'custom', label: 'Custom' }
  ]

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'custom',
    isPublic: false,
    sections: {
      executiveSummary: {
        title: 'Executive Summary',
        content: '',
        enabled: true
      },
      projectUnderstanding: {
        title: 'Project Understanding',
        content: '',
        enabled: true
      },
      proposedSolution: {
        title: 'Proposed Solution',
        content: '',
        enabled: true
      },
      scopeOfWork: {
        title: 'Scope of Work',
        content: '',
        enabled: true
      },
      timeline: {
        title: 'Timeline & Process',
        content: '',
        enabled: true
      },
      investment: {
        title: 'Investment',
        content: '',
        enabled: true
      },
      whyChooseUs: {
        title: 'Why Choose Us',
        content: '',
        enabled: true
      },
      nextSteps: {
        title: 'Next Steps',
        content: '',
        enabled: true
      }
    },
    customSections: []
  })

  useEffect(() => {
    fetchTemplates()
  }, [categoryFilter])

  const fetchTemplates = async () => {
    try {
      const params = categoryFilter !== 'all' ? { category: categoryFilter } : {}
      const response = await axios.get('/api/templates', { params })
      setTemplates(response.data.templates || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingTemplate) {
        await axios.put(`/api/templates/${editingTemplate._id}`, formData)
        toast.success('Template updated successfully')
      } else {
        await axios.post('/api/templates', formData)
        toast.success('Template created successfully')
      }
      
      setShowForm(false)
      setEditingTemplate(null)
      resetForm()
      fetchTemplates()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving template')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      isPublic: template.isPublic,
      sections: template.sections,
      customSections: template.customSections || []
    })
    setShowForm(true)
  }

  const handleDelete = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      await axios.delete(`/api/templates/${templateId}`)
      setTemplates(templates.filter(t => t._id !== templateId))
      toast.success('Template deleted successfully')
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const handleDuplicate = async (template) => {
    try {
      const duplicateData = {
        ...template,
        name: `${template.name} (Copy)`,
        isPublic: false
      }
      delete duplicateData._id
      delete duplicateData.createdBy
      delete duplicateData.createdAt
      delete duplicateData.updatedAt
      delete duplicateData.usageCount

      await axios.post('/api/templates', duplicateData)
      toast.success('Template duplicated successfully')
      fetchTemplates()
    } catch (error) {
      toast.error('Failed to duplicate template')
    }
  }

  const handleUseTemplate = async (templateId) => {
    try {
      await axios.post(`/api/templates/${templateId}/use`)
      toast.success('Template usage recorded')
    } catch (error) {
      console.error('Error recording template usage:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'custom',
      isPublic: false,
      sections: {
        executiveSummary: { title: 'Executive Summary', content: '', enabled: true },
        projectUnderstanding: { title: 'Project Understanding', content: '', enabled: true },
        proposedSolution: { title: 'Proposed Solution', content: '', enabled: true },
        scopeOfWork: { title: 'Scope of Work', content: '', enabled: true },
        timeline: { title: 'Timeline & Process', content: '', enabled: true },
        investment: { title: 'Investment', content: '', enabled: true },
        whyChooseUs: { title: 'Why Choose Us', content: '', enabled: true },
        nextSteps: { title: 'Next Steps', content: '', enabled: true }
      },
      customSections: []
    })
  }

  const addCustomSection = () => {
    setFormData({
      ...formData,
      customSections: [
        ...formData.customSections,
        { title: '', content: '', order: formData.customSections.length, enabled: true }
      ]
    })
  }

  const updateCustomSection = (index, field, value) => {
    const updatedSections = [...formData.customSections]
    updatedSections[index][field] = value
    setFormData({ ...formData, customSections: updatedSections })
  }

  const removeCustomSection = (index) => {
    const updatedSections = formData.customSections.filter((_, i) => i !== index)
    setFormData({ ...formData, customSections: updatedSections })
  }

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const getCategoryIcon = (category) => {
    const icons = {
      'web-development': '🌐',
      'mobile-app': '📱',
      'design': '🎨',
      'marketing': '📢',
      'consulting': '💼',
      'content': '✍️',
      'custom': '⚡'
    }
    return icons[category] || '📄'
  }

  if (loading && templates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Layers className="h-8 w-8 text-green-500 mr-3" />
                Proposal Templates
              </h1>
              <p className="text-gray-600 mt-1">
                Create and manage reusable proposal templates
              </p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Template
            </button>
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
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {templates.length === 0 ? 'No templates yet' : 'No templates found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {templates.length === 0 
                ? 'Create your first reusable template to save time on future proposals.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {templates.length === 0 && (
              <button
                onClick={() => {
                  resetForm()
                  setShowForm(true)
                }}
                className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Your First Template
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template._id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className="text-2xl mr-2">{getCategoryIcon(template.category)}</span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {template.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {template.isPublic ? (
                              <div className="flex items-center text-xs text-blue-600">
                                <Globe className="h-3 w-3 mr-1" />
                                Public
                              </div>
                            ) : (
                              <div className="flex items-center text-xs text-gray-500">
                                <Lock className="h-3 w-3 mr-1" />
                                Private
                              </div>
                            )}
                            {template.usageCount > 0 && (
                              <div className="flex items-center text-xs text-green-600">
                                <Star className="h-3 w-3 mr-1" />
                                {template.usageCount} uses
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {template.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {categories.find(c => c.value === template.category)?.label || template.category}
                    </span>
                  </div>

                  {/* Enabled Sections Count */}
                  <div className="mb-4">
                    <div className="text-sm text-gray-600">
                      {Object.values(template.sections || {}).filter(s => s.enabled).length + (template.customSections?.length || 0)} sections
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUseTemplate(template._id)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Use
                    </button>
                    
                    {template.createdBy === user?.id && (
                      <button
                        onClick={() => handleEdit(template)}
                        className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDuplicate(template)}
                      className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    
                    {template.createdBy === user?.id && (
                      <button
                        onClick={() => handleDelete(template._id)}
                        className="p-2 text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Template Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false)
                    setEditingTemplate(null)
                    resetForm()
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {categories.slice(1).map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Make this template public (other users can use it)
                    </span>
                  </label>
                </div>

                {/* Sections */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Template Sections</h4>
                  <div className="space-y-4">
                    {Object.entries(formData.sections).map(([key, section]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={section.enabled}
                              onChange={(e) => setFormData({
                                ...formData,
                                sections: {
                                  ...formData.sections,
                                  [key]: { ...section, enabled: e.target.checked }
                                }
                              })}
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
                            onChange={(e) => setFormData({
                              ...formData,
                              sections: {
                                ...formData.sections,
                                [key]: { ...section, content: e.target.value }
                              }
                            })}
                            rows={3}
                            placeholder={`Enter content for ${section.title}...`}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Sections */}
                <div className="mb-6">
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

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingTemplate(null)
                      resetForm()
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (editingTemplate ? 'Update Template' : 'Create Template')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default TemplateBuilder
