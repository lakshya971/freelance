import React, { useState } from 'react';

export default function ProjectForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    status: 'in progress',
    dueDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const dataToSend = { ...formData };
    if (dataToSend.dueDate) {
      dataToSend.dueDate = new Date(dataToSend.dueDate).toISOString();
    } else {
      delete dataToSend.dueDate;
    }
    await onSubmit(dataToSend);
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">New Project</h2>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Project Name</label>
          <input name="name" value={formData.name} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Client Name</label>
          <input name="clientName" value={formData.clientName} onChange={handleChange} required className="w-full border rounded px-3 py-2" />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Status</label>
          <select name="status" value={formData.status} onChange={handleChange} className="w-full border rounded px-3 py-2">
            <option value="in progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-semibold">Due Date</label>
          <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} className="w-full border rounded px-3 py-2" />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700 font-semibold">
            {isSubmitting ? 'Saving...' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}
