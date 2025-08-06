import React from 'react';
import { 
  X, 
  Download, 
  Send, 
  CreditCard,
  Calendar,
  DollarSign,
  User,
  Building2,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

const InvoiceViewer = ({ 
  invoice, 
  onClose, 
  onDownload, 
  onSend, 
  onRecordPayment 
}) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const isOverdue = invoice.amount_due > 0 && new Date() > new Date(invoice.due_date);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Invoice #{invoice.invoice_number}
            </h2>
            <p className="text-sm text-gray-600">{invoice.title}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Action Buttons */}
            <button
              onClick={() => onDownload(invoice)}
              className="inline-flex items-center px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </button>
            
            {invoice.status === 'draft' && (
              <button
                onClick={() => onSend(invoice)}
                className="inline-flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </button>
            )}
            
            {invoice.amount_due > 0 && (
              <button
                onClick={() => onRecordPayment(invoice)}
                className="inline-flex items-center px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
              >
                <CreditCard className="h-4 w-4 mr-1" />
                Record Payment
              </button>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <div className="p-8 bg-white" style={{ fontFamily: 'Arial, sans-serif' }}>
            {/* Invoice Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-4xl font-light tracking-wider text-gray-900 mb-2" style={{ letterSpacing: '0.2em' }}>
                  INVOICE
                </h1>
              </div>
              
              <div className="text-right">
                <div className="text-lg text-gray-900 font-medium">
                  #{invoice.invoice_number}
                </div>
              </div>
            </div>

            {/* Client and Company Information */}
            <div className="grid grid-cols-2 gap-16 mb-12">
              {/* Left Side - Client Info */}
              <div>
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">BILLED TO:</h3>
                  <div className="space-y-1">
                    <div className="font-medium text-gray-900">
                      {invoice.client.company || 'Really Great Company'}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">PAY TO:</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    <div className="font-medium">{invoice.client.name}</div>
                    <div>123 Anywhere St., Any City</div>
                    <div>123 456 7890</div>
                  </div>
                </div>
              </div>

              {/* Right Side - Bank/Payment Info */}
              <div>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-gray-600">Bank:</div>
                    <div className="font-medium">Really Great Bank</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-gray-600">Account Name:</div>
                    <div className="font-medium">John Smith</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-gray-600">BSB:</div>
                    <div className="font-medium">000 000</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-gray-600">Account Number:</div>
                    <div className="font-medium">0000 0000</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Line Items - Styled like template */}
            <div className="mb-12">
              <div className="border border-gray-300">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 uppercase tracking-wide">DESCRIPTION</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wide">RATE</th>
                      <th className="px-4 py-3 text-center text-sm font-bold text-gray-900 uppercase tracking-wide">HOURS</th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 uppercase tracking-wide">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.line_items?.map((item, index) => (
                      <tr key={index} className="border-b border-gray-200">
                        <td className="px-4 py-4 text-sm text-gray-900">{item.description}</td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-center">${item.rate}/hr</td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-center">{item.quantity}</td>
                        <td className="px-4 py-4 text-sm text-gray-900 text-right font-medium">${item.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals - Styled like template */}
            <div className="flex justify-end mb-12">
              <div className="w-80">
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-900 font-medium">Sub Total</span>
                    <span className="font-medium">${invoice.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  {invoice.discount > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-gray-900 font-medium">Package Discount (30%)</span>
                      <span className="font-medium">-${invoice.discount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between py-2">
                      <span className="text-xl font-bold text-gray-900 uppercase tracking-wide">TOTAL</span>
                      <span className="text-xl font-bold text-gray-900">${invoice.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Text - Like template */}
            <div className="border-t border-gray-300 pt-8">
              <div className="text-sm text-gray-700 leading-relaxed">
                <p className="mb-4">
                  Payment is required within 14 business days of invoice date. Please send 
                  remittance to {invoice.branding?.company_email || 'hello@reallygreatsite.com'}.
                </p>
                <p>
                  Thank you for your business.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewer;
