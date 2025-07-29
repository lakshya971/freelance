import { useState, useEffect } from "react";
import { Client } from "../entities/Client";
import { useAuth } from "../contexts/AuthContext";
import { Plus, Users } from "lucide-react";

const Clients = () => {
  useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClients() {
      setLoading(true);
      try {
        const data = await Client.list();
        setClients(data);
      } catch (e) {
        setClients([]);
      } finally {
        setLoading(false);
      }
    }
    fetchClients();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-7 w-7 text-primary-600" /> Clients
        </h1>
        <button className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg text-lg font-semibold shadow hover:bg-primary-700 transition-colors">
          <Plus className="h-5 w-5" /> New Client
        </button>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposals</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-400">Loading...</td>
              </tr>
            ) : clients.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-400">No clients found.</td>
              </tr>
            ) : (
              clients.map((client, idx) => (
                <tr key={client._id || idx}>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.name || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.email || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{client.company || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-primary-600 font-bold">{client.proposalsCount || 0}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Clients;
