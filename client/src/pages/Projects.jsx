import React, { useState, useEffect } from "react";
import { Project } from "../entities/Project";
import { useAuth } from "../contexts/AuthContext";
import { Plus, FolderKanban, Users, Calendar, CheckCircle, XCircle } from "lucide-react";
import ProjectForm from "../components/Projects/ProjectForm";

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      try {
        const data = await Project.list();
        setProjects(data);
        console.log('Fetched projects:', data);
      } catch (e) {
        setProjects([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const handleCreate = async (formData) => {
    await Project.create(formData);
    const data = await Project.list();
    setProjects(data);
    setShowForm(false);
    console.log('Projects after create:', data);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FolderKanban className="h-7 w-7 text-primary-600" /> Projects
        </h1>
        <button
          className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg text-lg font-semibold shadow hover:bg-primary-700 transition-colors"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-5 w-5" /> New Project
        </button>
      </div>
      {/* Debug: Show raw projects array for troubleshooting */}
      <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
        <h3 className="font-bold mb-2 text-gray-700">Debug: Raw Projects Data</h3>
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap" style={{ maxHeight: 200 }}>
          {JSON.stringify(projects, null, 2)}
        </pre>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        {showForm && (
          <ProjectForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-400">Loading...</td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-400">No projects found.</td>
              </tr>
            ) : (
              projects.map((proj, idx) => (
                <tr key={proj._id || idx}>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{proj.name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{proj.clientName || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {proj.status === 'completed' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" /> Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-700">
                        <XCircle className="h-4 w-4 mr-1" /> In Progress
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{proj.dueDate ? new Date(proj.dueDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Projects;
