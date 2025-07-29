import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Client } from "../entities/Client";
import { Proposal } from "../entities/Proposal";
import { Invoice } from "../entities/Invoice";
import { Project } from "../entities/Project";
import { Users, FileText, FolderKanban, DollarSign, Sparkles } from "lucide-react";
import BuyProModal from "../components/BuyProModal";


export default function Dashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        clients: 0,
        proposals: 0,
        invoices: 0,
        projects: 0,
        revenue: 0
    });
    const [recentClients, setRecentClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBuyModal, setShowBuyModal] = useState(false);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const [clients, proposals, invoices, projects] = await Promise.all([
                    Client.list(),
                    Proposal.list(),
                    Invoice.list(),
                    Project.list()
                ]);
                const revenue = invoices
                    .filter(inv => inv.status === 'paid')
                    .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
                setStats({
                    clients: clients.length,
                    proposals: proposals.length,
                    invoices: invoices.length,
                    projects: projects.length,
                    revenue
                });
                setRecentClients(Array.isArray(clients) ? clients.slice(-5).reverse() : []);
            } catch (e) {
                setStats({ clients: 0, proposals: 0, invoices: 0, projects: 0, revenue: 0 });
                setRecentClients([]);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div>
            <div className="max-w-4xl mx-auto py-12">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                    <h1 className="text-3xl font-bold text-center md:text-left flex items-center gap-2">
                        <Sparkles className="h-7 w-7 text-primary-600" />
                        Welcome{user ? `, ${user.name}` : ''}!
                    </h1>
                    <button
                        className="btn-primary flex items-center gap-2 px-6 py-2 rounded-lg text-lg font-semibold shadow hover:bg-primary-700 transition-colors"
                        onClick={() => setShowBuyModal(true)}
                    >
                        <Sparkles className="h-5 w-5" /> Upgrade to Pro
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
                        <Users className="h-8 w-8 text-primary-600" />
                        <div>
                            <div className="text-lg font-semibold">Clients</div>
                            <div className="text-2xl font-bold">{loading ? '...' : stats.clients}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
                        <FileText className="h-8 w-8 text-primary-600" />
                        <div>
                            <div className="text-lg font-semibold">Proposals</div>
                            <div className="text-2xl font-bold">{loading ? '...' : stats.proposals}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
                        <FolderKanban className="h-8 w-8 text-primary-600" />
                        <div>
                            <div className="text-lg font-semibold">Projects</div>
                            <div className="text-2xl font-bold">{loading ? '...' : stats.projects}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow p-6 flex items-center space-x-4">
                        <DollarSign className="h-8 w-8 text-primary-600" />
                        <div>
                            <div className="text-lg font-semibold">Revenue</div>
                            <div className="text-2xl font-bold">{loading ? '...' : `$${stats.revenue.toLocaleString()}`}</div>
                        </div>
                    </div>
                </div>

                {/* Recent Clients Table */}
                <div className="bg-white rounded-xl shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Recent Clients</h2>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-6 text-gray-400">Loading...</td>
                                </tr>
                            ) : stats.clients === 0 ? (
                                <tr>
                                    <td colSpan="3" className="text-center py-6 text-gray-400">No clients found.</td>
                                </tr>
                            ) : (
                                recentClients.map((client, idx) => (
                                    <tr key={client._id || idx}>
                                        <td className="px-4 py-2 whitespace-nowrap">{client.name || '-'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{client.email || '-'}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{client.company || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            <BuyProModal open={showBuyModal} onClose={() => setShowBuyModal(false)} />
            {/* Debug: Show raw projects array for troubleshooting */}
            <div className="mt-8 p-4 bg-gray-50 rounded border border-gray-200">
                <h3 className="font-bold mb-2 text-gray-700">Debug: Raw Projects Data</h3>
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap" style={{ maxHeight: 200 }}>
                    {JSON.stringify(stats.projects, null, 2)}
                </pre>
            </div>
        </div>
    );
}