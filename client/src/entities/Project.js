export const Project = {
  list: async () => {
    try {
      const res = await fetch('/api/projects', { credentials: 'include' });
      const data = await res.json();
      return data.projects || [];
    } catch (e) {
      return [];
    }
  },
  create: async (project) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(project)
      });
      return await res.json();
    } catch (e) {
      return { error: true };
    }
  }
};
