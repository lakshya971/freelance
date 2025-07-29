import React, { useState, useEffect } from "react";
import { Invoice } from "../entities/Invoice";
import { useAuth } from "../contexts/AuthContext";
import { Plus, FileText, DollarSign, CheckCircle, XCircle } from "lucide-react";
import InvoiceForm from "../components/Invoices/InvoiceForm";

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      try {
        const data = await Invoice.list();
        setInvoices(data);
      } catch (e) {
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const handleCreate = async (formData) => {
    await Invoice.create(formData);
    const data = await Invoice.list();
    setInvoices(data);
    setShowForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary-600" /> Invoices
        </h1>
        <button
          className="btn-primary flex items-center gap-2 px-5 py-2 rounded-lg text-lg font-semibold shadow hover:bg-primary-700 transition-colors"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-5 w-5" /> New Invoice
        </button>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        {showForm && (
          <InvoiceForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        )}
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-400">Loading...</td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8 text-gray-400">No invoices found.</td>
              </tr>
            ) : (
              invoices.map((inv, idx) => (
                <tr key={inv._id || idx}>
                  <td className="px-6 py-4 whitespace-nowrap font-semibold">{idx + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{inv.clientName || "-"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-primary-600 font-bold">${inv.total_amount?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {inv.status === 'paid' ? (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700">
                        <CheckCircle className="h-4 w-4 mr-1" /> Paid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700">
                        <XCircle className="h-4 w-4 mr-1" /> Unpaid
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{inv.date ? new Date(inv.date).toLocaleDateString() : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Invoices;
