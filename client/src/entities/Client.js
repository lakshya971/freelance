import axios from 'axios';

export const Client = {
  list: async () => {
    try {
      const res = await axios.get('/api/clients');
      return res.data.clients || [];
    } catch (e) {
      console.error('Client list error:', e);
      return [];
    }
  }
};
