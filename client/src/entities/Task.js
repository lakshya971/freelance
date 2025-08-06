import api from '../api';

export const taskApi = {
  // Get all tasks for a project
  getByProject: async (projectId) => {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  },

  // Create a new task
  create: async (taskData) => {
    const formData = new FormData();
    
    // Add task data
    Object.keys(taskData).forEach(key => {
      if (key === 'attachments') {
        // Handle file attachments
        if (taskData[key]) {
          Array.from(taskData[key]).forEach(file => {
            formData.append('attachments', file);
          });
        }
      } else if (key === 'tags' && Array.isArray(taskData[key])) {
        formData.append(key, taskData[key].join(','));
      } else if (taskData[key] !== undefined && taskData[key] !== null) {
        formData.append(key, taskData[key]);
      }
    });

    const response = await api.post('/tasks', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Update a task
  update: async (id, taskData) => {
    const formData = new FormData();
    
    // Add task data
    Object.keys(taskData).forEach(key => {
      if (key === 'attachments') {
        // Handle file attachments
        if (taskData[key]) {
          Array.from(taskData[key]).forEach(file => {
            formData.append('attachments', file);
          });
        }
      } else if (key === 'tags' && Array.isArray(taskData[key])) {
        formData.append(key, taskData[key].join(','));
      } else if (taskData[key] !== undefined && taskData[key] !== null) {
        formData.append(key, taskData[key]);
      }
    });

    const response = await api.put(`/tasks/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Delete a task
  delete: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Reorder tasks (for drag and drop)
  reorder: async (tasksData) => {
    const response = await api.put('/tasks/reorder', { tasks: tasksData });
    return response.data;
  },

  // Time tracking
  trackTime: async (id, action, description = '') => {
    const response = await api.post(`/tasks/${id}/time`, { action, description });
    return response.data;
  },

  // Get task statistics
  getStats: async (projectId) => {
    const response = await api.get(`/tasks/stats/${projectId}`);
    return response.data;
  }
};

export default taskApi;
