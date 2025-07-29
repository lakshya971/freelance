export const Proposal = {
  list: async () => {
    try {
      const res = await fetch('/api/proposals', { credentials: 'include' });
      const data = await res.json();
      return data.proposals || [];
    } catch (e) {
      return [];
    }
  }
};
