import React, { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    const totals = calculateTotals(formData.line_items);
    // Find clientName and correct clientId from clients list
    const client = clients.find(c => c.id === formData.client_id || c._id === formData.client_id);
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
    setIsSubmitting(false);
  };

  const filteredProjects = projects.filter(p => p.client_id === formData.client_id);
  const totalAmount = calculateTotals(formData.line_items).total_amount;

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            {invoice ? 'Edit Invoice' : 'New Invoice'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={formData.client_id} onValueChange={(val) => setFormData(p => ({ ...p, client_id: val, project_id: '' }))} required>
                <SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger>
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project</Label>
              <Select value={formData.project_id} onValueChange={(val) => setFormData(p => ({ ...p, project_id: val }))} disabled={!formData.client_id}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>{filteredProjects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Invoice # *</Label>
              <Input value={formData.invoice_number} onChange={e => setFormData(p => ({ ...p, invoice_number: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>Issue Date</Label>
              <Input type="date" value={formData.issue_date} onChange={e => setFormData(p => ({ ...p, issue_date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={formData.due_date} onChange={e => setFormData(p => ({ ...p, due_date: e.target.value }))} />
            </div>
          </div>

          <div className="space-y-2 pt-4">
            <Label>Line Items</Label>
            {formData.line_items.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input placeholder="Description" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} className="flex-grow" />
                <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} className="w-20" />
                <Input type="number" placeholder="Rate" value={item.rate} onChange={e => handleItemChange(index, 'rate', e.target.value)} className="w-24" />
                <span className="w-24 text-right pr-2">${item.amount.toFixed(2)}</span>
                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addItem}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
          </div>

          <div className="text-right font-bold text-lg pt-4">
            Total: ${totalAmount.toFixed(2)}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600">
              {isSubmitting ? 'Saving...' : 'Save Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}