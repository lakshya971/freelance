import React, { useState, useEffect } from "react";
import { Invoice } from "../entities/Invoice";
import { Client } from "../entities/Client";
import { Project } from "../entities/Project";
import { useAuth } from "../contexts/AuthContext";
import { 
  Plus, 
  FileText, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  Eye,
  Download,
  Send,
  Edit,
  Trash2,
  Filter,
  Search,
  Calendar,
  TrendingUp,
  Users,
  CreditCard
} from "lucide-react";
import InvoiceForm from "../components/Invoices/InvoiceForm";
import InvoiceViewer from "../components/Invoices/InvoiceViewer";
import PaymentModal from "../components/Invoices/PaymentModal";
import DeleteConfirmationModal from "../components/Shared/DeleteConfirmationModal";
import toast from 'react-hot-toast';

const Invoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [viewingInvoice, setViewingInvoice] = useState(null);
  const [paymentModal, setPaymentModal] = useState({ open: false, invoice: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, invoice: null });
  const [filters, setFilters] = useState({
    status: 'all',
    client_id: '',
    search: '',
    from_date: '',
    to_date: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [filters]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [invoiceData, clientData, projectData, statsData] = await Promise.all([
        Invoice.list(),
        Client.list(),
        Project.list(),
        Invoice.getStats()
      ]);
      
      setInvoices(invoiceData.invoices || []);
      setClients(clientData.clients || []);
      setProjects(projectData.projects || []);
      setStats(statsData.stats || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const data = await Invoice.list(filters);
      setInvoices(data.invoices || []);
      setStats(data.summary || {});
    } catch (error) {
      console.error('Error fetching invoices:', error);
    }
  };

  const handleCreateInvoice = async (formData) => {
    try {
      const result = await Invoice.create(formData);
      if (result.error) {
        toast.error(result.message || 'Failed to create invoice');
        return;
      }
      toast.success('Invoice created successfully');
      setShowForm(false);
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  };

  const handleUpdateInvoice = async (formData) => {
    try {
      const result = await Invoice.update(editingInvoice._id, formData);
      if (result.error) {
        toast.error(result.message || 'Failed to update invoice');
        return;
      }
      toast.success('Invoice updated successfully');
      setEditingInvoice(null);
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to update invoice');
    }
  };

  const handleSendInvoice = async (invoice) => {
    try {
      const result = await Invoice.send(invoice._id);
      if (result.error) {
        toast.error(result.message || 'Failed to send invoice');
        return;
      }
      toast.success('Invoice sent successfully');
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to send invoice');
    }
  };

  const handleRecordPayment = async (paymentData) => {
    try {
      const result = await Invoice.recordPayment(paymentModal.invoice._id, paymentData);
      if (result.error) {
        toast.error(result.message || 'Failed to record payment');
        return;
      }
      toast.success('Payment recorded successfully');
      setPaymentModal({ open: false, invoice: null });
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleDeleteInvoice = async () => {
    try {
      const result = await Invoice.delete(deleteModal.invoice._id);
      if (result.error) {
        toast.error(result.message || 'Failed to delete invoice');
        return;
      }
      toast.success('Invoice deleted successfully');
      setDeleteModal({ open: false, invoice: null });
      fetchInvoices();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleDownloadPDF = async (invoice) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-download' });
      const result = await Invoice.downloadPDF(invoice._id);
      if (result.error) {
        toast.error(result.message || 'Failed to download PDF', { id: 'pdf-download' });
        return;
      }
      toast.success('PDF downloaded successfully', { id: 'pdf-download' });
    } catch (error) {
      toast.error('Failed to download PDF', { id: 'pdf-download' });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4" />;
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'sent': case 'viewed': return <Clock className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FileText className="h-8 w-8 text-green-500 mr-3" />
                Invoices & Payments
              </h1>
              <p className="text-gray-600 mt-1">
                Manage invoices, track payments, and monitor financial health
              </p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium shadow-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Invoice
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.total_amount)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outstanding</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(stats.total_outstanding)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_invoices || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue_count || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                value={filters.client_id}
                onChange={(e) => setFilters({ ...filters, client_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.from_date}
                onChange={(e) => setFilters({ ...filters, from_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.to_date}
                onChange={(e) => setFilters({ ...filters, to_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices yet</h3>
            <p className="text-gray-600 mb-6">Create your first invoice to start tracking payments.</p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Invoice
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {invoices.map((invoice) => (
                    <tr key={invoice._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            #{invoice.invoice_number}
                          </div>
                          <div className="text-sm text-gray-500">{invoice.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {invoice.client.name}
                          </div>
                          <div className="text-sm text-gray-500">{invoice.client.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(invoice.total_amount)}
                          </div>
                          {invoice.amount_due > 0 && (
                            <div className="text-sm text-red-600">
                              {formatCurrency(invoice.amount_due)} due
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {getStatusIcon(invoice.status)}
                          <span className="ml-1">{invoice.status.replace('_', ' ').toUpperCase()}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setViewingInvoice(invoice)}
                            className="text-gray-600 hover:text-gray-900"
                            title="View Invoice"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(invoice)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {invoice.status === 'draft' && (
                            <button
                              onClick={() => handleSendInvoice(invoice)}
                              className="text-green-600 hover:text-green-900"
                              title="Send Invoice"
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          )}
                          {invoice.amount_due > 0 && (
                            <button
                              onClick={() => setPaymentModal({ open: true, invoice })}
                              className="text-purple-600 hover:text-purple-900"
                              title="Record Payment"
                            >
                              <CreditCard className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setEditingInvoice(invoice)}
                            className="text-yellow-600 hover:text-yellow-900"
                            title="Edit Invoice"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteModal({ open: true, invoice })}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Invoice"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Form Modal */}
      {(showForm || editingInvoice) && (
        <InvoiceForm
          invoice={editingInvoice}
          clients={clients}
          projects={projects}
          onSubmit={editingInvoice ? handleUpdateInvoice : handleCreateInvoice}
          onCancel={() => {
            setShowForm(false);
            setEditingInvoice(null);
          }}
        />
      )}

      {/* Invoice Viewer Modal */}
      {viewingInvoice && (
        <InvoiceViewer
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
          onDownload={() => handleDownloadPDF(viewingInvoice)}
          onSend={() => handleSendInvoice(viewingInvoice)}
          onRecordPayment={() => setPaymentModal({ open: true, invoice: viewingInvoice })}
        />
      )}

      {/* Payment Modal */}
      {paymentModal.open && (
        <PaymentModal
          invoice={paymentModal.invoice}
          onSubmit={handleRecordPayment}
          onClose={() => setPaymentModal({ open: false, invoice: null })}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, invoice: null })}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice #${deleteModal.invoice?.invoice_number}?`}
        itemName={deleteModal.invoice?.client?.name ? `Client: ${deleteModal.invoice.client.name}` : ''}
      />
    </div>
  );
};

export default Invoices;
