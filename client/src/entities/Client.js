export const Client = {
  list: async () => {
    try {
      const res = await fetch('/api/clients', { credentials: 'include' });
      const data = await res.json();
      return data.clients || [];
    } catch (e) {
      return [];
    }
  }
};
