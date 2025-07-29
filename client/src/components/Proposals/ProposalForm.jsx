import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText } from 'lucide-react';

export default function ProposalForm({ proposal, clients, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: proposal?.title || '',
    client_id: proposal?.client_id || '',
    description: proposal?.description || '',
    total_amount: proposal?.total_amount || '',
    status: proposal?.status || 'draft',
    valid_until: proposal?.valid_until ? new Date(proposal.valid_until).toISOString().split('T')[0] : '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    await onSubmit({
      ...formData,
      total_amount: parseFloat(formData.total_amount),
    });
    setIsSubmitting(false);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            {proposal ? 'Edit Proposal' : 'New Proposal'}
          </DialogTitle>
          <DialogDescription>
            {proposal ? 'Update the proposal details.' : 'Create a new proposal for a client.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client_id">Client *</Label>
            <Select value={formData.client_id} onValueChange={(value) => handleChange('client_id', value)} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_amount">Amount ($) *</Label>
              <Input id="total_amount" type="number" value={formData.total_amount} onChange={(e) => handleChange('total_amount', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Valid Until *</Label>
              <Input id="valid_until" type="date" value={formData.valid_until} onChange={(e) => handleChange('valid_until', e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600">
              {isSubmitting ? 'Saving...' : 'Save Proposal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}