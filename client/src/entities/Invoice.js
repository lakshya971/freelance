import axios from 'axios';

export const Invoice = {
  list: async () => {
    try {
      const res = await axios.get('/api/invoices');
      return res.data.invoices || [];
    } catch (e) {
      console.error('Invoice list error:', e);
      return [];
    }
  },
  create: async (invoice) => {
    try {
      const res = await axios.post('/api/invoices', invoice);
      return res.data;
    } catch (e) {
      console.error('Invoice create error:', e);
      return { error: true };
    }
  },
  update: async (id, updates) => {
    try {
      const res = await axios.put(`/api/invoices/${id}`, updates);
      return res.data;
    } catch (e) {
      console.error('Invoice update error:', e);
      return { error: true };
    }
  },
  delete: async (id) => {
    try {
      const res = await axios.delete(`/api/invoices/${id}`);
      return res.data;
    } catch (e) {
      console.error('Invoice delete error:', e);
      return { error: true };
    }
  }
};
