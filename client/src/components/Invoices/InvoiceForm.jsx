import { useState } from 'react';
import { Receipt, Trash2, Plus, X } from 'lucide-react';

export default function InvoiceForm({ invoice, clients, projects, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: invoice?.title || '',
    client_id: invoice?.client?.id || '',
    manual_client: invoice?.client?.name || '',
    manual_client_email: invoice?.client?.email || '',
    manual_client_company: invoice?.client?.company || '',
    project_id: invoice?.project?.id || '',
    due_date: invoice?.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : 
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
    line_items: invoice?.line_items?.length > 0 ? invoice.line_items : [
      { description: '', quantity: 1, rate: 0, amount: 0 }
    ],
    tax_rate: invoice?.tax_rate || 0,
    discount: invoice?.discount || 0,
    notes: invoice?.notes || '',
    terms: invoice?.terms || 'Payment is due within 30 days of invoice date.',
    branding: {
      primary_color: invoice?.branding?.primary_color || '#10B981',
      company_name: invoice?.branding?.company_name || '',
      company_address: invoice?.branding?.company_address || '',
      company_email: invoice?.branding?.company_email || '',
      company_phone: invoice?.branding?.company_phone || ''
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const tax_amount = (subtotal * formData.tax_rate) / 100;
    const total_amount = subtotal + tax_amount - formData.discount;
    
    return { subtotal, tax_amount, total_amount };
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.line_items];
    const numericValue = ['quantity', 'rate'].includes(field) ? parseFloat(value) || 0 : value;
    newItems[index][field] = numericValue;

    if (field === 'quantity' || field === 'rate') {
      newItems[index].amount = (newItems[index].quantity || 0) * (newItems[index].rate || 0);
    }

    setFormData(prev => ({ ...prev, line_items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { description: '', quantity: 1, rate: 0, amount: 0 }],
    }));
  };

  const removeItem = (index) => {
    if (formData.line_items.length > 1) {
      setFormData(prev => ({
        ...prev,
        line_items: prev.line_items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Allow manual client entry for testing - no strict validation needed
    if (!formData.client_id && !formData.manual_client) {
      alert('Please select a client or enter client name manually');
      return;
    }
    
    if (formData.line_items.some(item => !item.description.trim())) {
      alert('Please fill in all item descriptions');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const totals = calculateTotals();
      const payload = {
        title: formData.title,
        client_id: formData.client_id,
        manual_client: formData.manual_client,
        manual_client_email: formData.manual_client_email,
        manual_client_company: formData.manual_client_company,
        project_id: formData.project_id || undefined,
        due_date: formData.due_date,
        line_items: formData.line_items,
        tax_rate: formData.tax_rate,
        discount: formData.discount,
        notes: formData.notes,
        terms: formData.terms,
        branding: formData.branding,
        // Include calculated totals
        subtotal: totals.subtotal,
        tax_amount: totals.tax_amount,
        total_amount: totals.total_amount
      };
      
      await onSubmit(payload);
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects?.filter(p => 
    p.client_id === formData.client_id || p.clientId === formData.client_id
  ) || [];
  
  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-green-600" />
            {invoice ? 'Edit Invoice' : 'Create New Invoice'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="max-h-[calc(95vh-160px)] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invoice Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Website Development - Phase 1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Selection
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    client_id: e.target.value, 
                    project_id: '',
                    manual_client: e.target.value ? '' : prev.manual_client
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select existing client (optional)</option>
                  {(clients || []).map(client => (
                    <option key={client._id} value={client._id}>
                      {client.name} {client.company ? `(${client.company})` : ''}
                    </option>
                  ))}
                </select>
                
                {!formData.client_id && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter client name"
                        value={formData.manual_client}
                        onChange={(e) => setFormData(prev => ({ ...prev, manual_client: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Client Email
                      </label>
                      <input
                        type="email"
                        placeholder="client@company.com"
                        value={formData.manual_client_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, manual_client_email: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Company name"
                        value={formData.manual_client_company}
                        onChange={(e) => setFormData(prev => ({ ...prev, manual_client_company: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project (optional)
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_id: e.target.value }))}
                  disabled={!formData.client_id}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">No project selected</option>
                  {filteredProjects.map(project => (
                    <option key={project._id} value={project._id}>
                      {project.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Invoice Items *
                </label>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </button>
              </div>
              
              <div className="space-y-3">
                {formData.line_items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-lg">
                    <div className="col-span-5">
                      <input
                        type="text"
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-right font-medium">
                        ${item.amount.toFixed(2)}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={formData.line_items.length === 1}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount ($)
                </label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Amount
                </label>
                <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-bold text-lg text-green-600">
                  ${totals.total_amount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Add any additional notes for the client..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Payment terms and conditions..."
                />
              </div>
            </div>

            {/* Totals Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                </div>
                {formData.tax_rate > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({formData.tax_rate}%):</span>
                    <span className="font-medium">${totals.tax_amount.toFixed(2)}</span>
                  </div>
                )}
                {formData.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="font-medium">-${formData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-green-600">${totals.total_amount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Saving...' : (invoice ? 'Update Invoice' : 'Create Invoice')}
          </button>
        </div>
      </div>
    </div>
  );
}