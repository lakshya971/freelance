import axios from 'axios';

export const Invoice = {
  list: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      const res = await axios.get(`/api/invoices?${params}`);
      return res.data;
    } catch (e) {
      console.error('Invoice list error:', e);
      return { invoices: [], summary: {} };
    }
  },

  get: async (id) => {
    try {
      const res = await axios.get(`/api/invoices/${id}`);
      return res.data;
    } catch (e) {
      console.error('Invoice get error:', e);
      return { error: true };
    }
  },

  create: async (invoice) => {
    try {
      const res = await axios.post('/api/invoices', invoice);
      return res.data;
    } catch (e) {
      console.error('Invoice create error:', e);
      return { error: true, message: e.response?.data?.message || 'Failed to create invoice' };
    }
  },

  update: async (id, updates) => {
    try {
      const res = await axios.put(`/api/invoices/${id}`, updates);
      return res.data;
    } catch (e) {
      console.error('Invoice update error:', e);
      return { error: true, message: e.response?.data?.message || 'Failed to update invoice' };
    }
  },

  delete: async (id) => {
    try {
      const res = await axios.delete(`/api/invoices/${id}`);
      return res.data;
    } catch (e) {
      console.error('Invoice delete error:', e);
      return { error: true, message: e.response?.data?.message || 'Failed to delete invoice' };
    }
  },

  send: async (id) => {
    try {
      const res = await axios.post(`/api/invoices/${id}/send`);
      return res.data;
    } catch (e) {
      console.error('Invoice send error:', e);
      return { error: true, message: e.response?.data?.message || 'Failed to send invoice' };
    }
  },

  recordPayment: async (id, paymentData) => {
    try {
      const res = await axios.post(`/api/invoices/${id}/payments`, paymentData);
      return res.data;
    } catch (e) {
      console.error('Payment record error:', e);
      return { error: true, message: e.response?.data?.message || 'Failed to record payment' };
    }
  },

  downloadPDF: async (id) => {
    try {
      const res = await axios.get(`/api/invoices/${id}/pdf`, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (e) {
      console.error('PDF download error:', e);
      return { error: true, message: e.response?.data?.message || 'Failed to download PDF' };
    }
  },

  getStats: async (period = '30') => {
    try {
      const res = await axios.get(`/api/invoices/stats/overview?period=${period}`);
      return res.data;
    } catch (e) {
      console.error('Invoice stats error:', e);
      return { error: true };
    }
  }
};
