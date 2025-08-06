import puppeteer from 'puppeteer';

export const generateInvoicePDF = async (invoice) => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const html = generateInvoiceHTML(invoice);
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });

  await browser.close();
  return pdf;
};

const generateInvoiceHTML = (invoice) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: invoice.currency || 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.invoice_number}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          border-bottom: 3px solid ${invoice.branding?.primary_color || '#10B981'};
          padding-bottom: 20px;
        }
        
        .company-info {
          flex: 1;
        }
        
        .company-name {
          font-size: 28px;
          font-weight: bold;
          color: ${invoice.branding?.primary_color || '#10B981'};
          margin-bottom: 5px;
        }
        
        .company-details {
          color: #666;
          font-size: 12px;
        }
        
        .invoice-info {
          text-align: right;
          flex: 1;
        }
        
        .invoice-title {
          font-size: 36px;
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        
        .invoice-number {
          font-size: 18px;
          color: #666;
          margin-bottom: 20px;
        }
        
        .billing-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        
        .billing-info {
          flex: 1;
        }
        
        .billing-title {
          font-weight: bold;
          color: ${invoice.branding?.primary_color || '#10B981'};
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .client-info {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid ${invoice.branding?.primary_color || '#10B981'};
        }
        
        .dates-section {
          margin-bottom: 40px;
        }
        
        .dates-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 20px;
        }
        
        .date-item {
          text-align: center;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .date-label {
          font-size: 12px;
          color: #666;
          margin-bottom: 5px;
        }
        
        .date-value {
          font-weight: bold;
          color: #333;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        
        .items-table th {
          background: ${invoice.branding?.primary_color || '#10B981'};
          color: white;
          padding: 15px;
          text-align: left;
          font-weight: bold;
        }
        
        .items-table td {
          padding: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .items-table tr:nth-child(even) {
          background: #f8f9fa;
        }
        
        .text-right {
          text-align: right;
        }
        
        .totals-section {
          margin-left: auto;
          width: 300px;
          margin-bottom: 40px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        
        .total-row.final {
          border-bottom: 3px solid ${invoice.branding?.primary_color || '#10B981'};
          font-weight: bold;
          font-size: 18px;
          color: ${invoice.branding?.primary_color || '#10B981'};
          margin-top: 10px;
          padding-top: 15px;
        }
        
        .payment-info {
          background: #f0fdf4;
          border: 1px solid #10B981;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .payment-title {
          font-weight: bold;
          color: #059669;
          margin-bottom: 10px;
        }
        
        .notes-section {
          margin-top: 40px;
        }
        
        .notes-title {
          font-weight: bold;
          color: #333;
          margin-bottom: 10px;
        }
        
        .notes-content {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid ${invoice.branding?.primary_color || '#10B981'};
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-paid {
          background: #d1fae5;
          color: #059669;
        }
        
        .status-overdue {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .status-sent {
          background: #dbeafe;
          color: #2563eb;
        }
        
        .status-draft {
          background: #f3f4f6;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="company-info">
            <div class="company-name">${invoice.branding?.company_name || 'FreelanceFlow'}</div>
            <div class="company-details">
              ${invoice.branding?.company_address || ''}<br>
              ${invoice.branding?.company_email || ''}<br>
              ${invoice.branding?.company_phone || ''}
            </div>
          </div>
          <div class="invoice-info">
            <div class="invoice-title">INVOICE</div>
            <div class="invoice-number">#${invoice.invoice_number}</div>
            <div class="status-badge status-${invoice.status}">
              ${invoice.status.toUpperCase()}
            </div>
          </div>
        </div>

        <!-- Billing Information -->
        <div class="billing-section">
          <div class="billing-info">
            <div class="billing-title">Bill To:</div>
            <div class="client-info">
              <strong>${invoice.client.name}</strong><br>
              ${invoice.client.company ? `${invoice.client.company}<br>` : ''}
              ${invoice.client.email}<br>
              ${invoice.client.address || ''}
            </div>
          </div>
        </div>

        <!-- Dates Section -->
        <div class="dates-section">
          <div class="dates-grid">
            <div class="date-item">
              <div class="date-label">Issue Date</div>
              <div class="date-value">${formatDate(invoice.issue_date)}</div>
            </div>
            <div class="date-item">
              <div class="date-label">Due Date</div>
              <div class="date-value">${formatDate(invoice.due_date)}</div>
            </div>
            <div class="date-item">
              <div class="date-label">Amount Due</div>
              <div class="date-value" style="color: ${invoice.amount_due > 0 ? '#dc2626' : '#059669'}">
                ${formatCurrency(invoice.amount_due)}
              </div>
            </div>
          </div>
        </div>

        <!-- Line Items -->
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 50%">Description</th>
              <th style="width: 15%" class="text-right">Quantity</th>
              <th style="width: 20%" class="text-right">Rate</th>
              <th style="width: 15%" class="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.line_items.map(item => `
              <tr>
                <td>${item.description}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${formatCurrency(item.rate)}</td>
                <td class="text-right">${formatCurrency(item.amount)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <!-- Totals -->
        <div class="totals-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${invoice.tax_rate > 0 ? `
            <div class="total-row">
              <span>Tax (${invoice.tax_rate}%):</span>
              <span>${formatCurrency(invoice.tax_amount)}</span>
            </div>
          ` : ''}
          ${invoice.discount > 0 ? `
            <div class="total-row">
              <span>Discount:</span>
              <span>-${formatCurrency(invoice.discount)}</span>
            </div>
          ` : ''}
          <div class="total-row final">
            <span>Total:</span>
            <span>${formatCurrency(invoice.total_amount)}</span>
          </div>
          ${invoice.amount_paid > 0 ? `
            <div class="total-row">
              <span>Amount Paid:</span>
              <span style="color: #059669;">-${formatCurrency(invoice.amount_paid)}</span>
            </div>
            <div class="total-row final">
              <span>Amount Due:</span>
              <span>${formatCurrency(invoice.amount_due)}</span>
            </div>
          ` : ''}
        </div>

        <!-- Payment Information -->
        ${invoice.amount_due > 0 ? `
          <div class="payment-info">
            <div class="payment-title">Payment Information</div>
            <p>Please make payment by ${formatDate(invoice.due_date)}.</p>
            <p>Reference invoice number: <strong>${invoice.invoice_number}</strong></p>
          </div>
        ` : ''}

        <!-- Notes -->
        ${invoice.notes ? `
          <div class="notes-section">
            <div class="notes-title">Notes:</div>
            <div class="notes-content">
              ${invoice.notes.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}

        <!-- Terms -->
        ${invoice.terms ? `
          <div class="notes-section">
            <div class="notes-title">Terms & Conditions:</div>
            <div class="notes-content">
              ${invoice.terms.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}

        <!-- Footer -->
        <div class="footer">
          <p>Generated by FreelanceFlow on ${formatDate(new Date())}</p>
          <p>Thank you for your business!</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
