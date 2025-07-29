export const Invoice = {
  list: async () => {
    try {
      const res = await fetch('/api/invoices', { credentials: 'include' });
      const data = await res.json();
      return data.invoices || [];
    } catch (e) {
      return [];
    }
  },
  create: async (invoice) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(invoice)
      });
      return await res.json();
    } catch (e) {
      return { error: true };
    }
  },
  update: async (id, updates) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates)
      });
      return await res.json();
    } catch (e) {
      return { error: true };
    }
  },
  delete: async (id) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      return await res.json();
    } catch (e) {
      return { error: true };
    }
  }
};
