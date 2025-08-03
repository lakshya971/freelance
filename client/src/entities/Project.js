import axios from 'axios';

export const Project = {
  list: async () => {
    try {
      const res = await axios.get('/api/projects');
      return res.data.projects || [];
    } catch (e) {
      console.error('Project list error:', e);
      return [];
    }
  },
  create: async (project) => {
    try {
      const res = await axios.post('/api/projects', project);
      return res.data;
    } catch (e) {
      console.error('Project create error:', e);
      return { error: true };
    }
  }
};
