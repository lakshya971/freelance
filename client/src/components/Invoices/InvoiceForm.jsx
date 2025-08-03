import { useState } from 'react';
import { Receipt, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoiceForm({ invoice, clients, projects, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    invoice_number: invoice?.invoice_number || `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    client_id: invoice?.client_id || '',
    project_id: invoice?.project_id || '',
    title: invoice?.title || '',
    status: invoice?.status || 'draft',
    issue_date: invoice?.issue_date ? new Date(invoice.issue_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date ? new Date(invoice.due_date).toISOString().split('T')[0] : new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    line_items: invoice?.line_items || [{ description: '', quantity: 1, rate: 0, amount: 0 }],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotals = (items) => {
    const subtotal = items.reduce((acc, item) => acc + (item.amount || 0), 0);
    // Add tax logic here if needed
    return { subtotal, total_amount: subtotal };
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
    setFormData(prev => ({
      ...prev,
      line_items: prev.line_items.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const totals = calculateTotals(formData.line_items);
      // Find clientName and correct clientId from clients list
      const client = clients?.find(c => (c.id === formData.client_id || c._id === formData.client_id));
      const payload = {
        clientName: client ? client.name : '',
        clientId: client ? (client._id || client.id) : formData.client_id,
        total_amount: totals.total_amount,
        status: formData.status === 'paid' ? 'paid' : 'unpaid',
        date: formData.issue_date ? new Date(formData.issue_date).toISOString() : new Date().toISOString(),
        invoice_number: formData.invoice_number,
        title: formData.title,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
        line_items: formData.line_items,
      };
      await onSubmit(payload);
    } catch (error) {
      console.error('Error saving invoice:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = projects?.filter(p => (p.client_id === formData.client_id || p.clientId === formData.client_id)) || [];
  const totalAmount = calculateTotals(formData.line_items).total_amount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            {invoice ? 'Edit Invoice' : 'New Invoice'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Client *</label>
              <select 
                value={formData.client_id} 
                onChange={(e) => setFormData(p => ({ ...p, client_id: e.target.value, project_id: '' }))} 
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select a client</option>
                {(clients || []).map(c => (
                  <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Project</label>
              <select 
                value={formData.project_id} 
                onChange={(e) => setFormData(p => ({ ...p, project_id: e.target.value }))} 
                disabled={!formData.client_id}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
              >
                <option value="">Select a project</option>
                {filteredProjects.map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Title *</label>
            <input 
              type="text"
              value={formData.title} 
              onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} 
              required 
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Invoice # *</label>
              <input 
                type="text"
                value={formData.invoice_number} 
                onChange={e => setFormData(p => ({ ...p, invoice_number: e.target.value }))} 
                required 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Issue Date</label>
              <input 
                type="date" 
                value={formData.issue_date} 
                onChange={e => setFormData(p => ({ ...p, issue_date: e.target.value }))} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Due Date</label>
              <input 
                type="date" 
                value={formData.due_date} 
                onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} 
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <label className="block text-sm font-medium text-gray-700">Line Items</label>
            {formData.line_items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <input 
                  type="text"
                  placeholder="Description" 
                  value={item.description} 
                  onChange={e => handleItemChange(index, 'description', e.target.value)} 
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
                <input 
                  type="number" 
                  placeholder="Qty" 
                  value={item.quantity} 
                  onChange={e => handleItemChange(index, 'quantity', e.target.value)} 
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
                <input 
                  type="number" 
                  placeholder="Rate" 
                  value={item.rate} 
                  onChange={e => handleItemChange(index, 'rate', e.target.value)} 
                  className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
                <span className="w-24 text-right pr-2">${item.amount.toFixed(2)}</span>
                <button 
                  type="button" 
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-md"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={addItem}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>

          <div className="text-right font-bold text-lg pt-4">
            Total: ${totalAmount.toFixed(2)}
          </div>
        </form>

        <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-4 py-2 bg-emerald-500 text-white rounded-md hover:bg-emerald-600 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}