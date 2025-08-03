import axios from 'axios';

export const Proposal = {
  list: async () => {
    try {
      const res = await axios.get('/api/proposals');
      return res.data.proposals || [];
    } catch (e) {
      console.error('Proposal list error:', e);
      return [];
    }
  }
};
