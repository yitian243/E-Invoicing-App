import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './../InvoiceSending.css';
import Sidebar from './Sidebar';

function InvoiceSending() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [sendingOptions, setSendingOptions] = useState({
    method: 'email',
    emailRecipients: '',
    emailCc: '',
    emailBcc: '',
    emailSubject: '',
    emailMessage: '',
    includeAttachment: true,
    includePaymentLink: true,
    scheduleTime: '',
    autoReminders: false,
    reminderDays: 3
  });
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingComplete, setSendingComplete] = useState(false);
  const [emailPreview, setEmailPreview] = useState(false);

  // Load invoices from localStorage
  useEffect(() => {
    const savedInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    // Filter for validated invoices or pending invoices
    const validInvoices = savedInvoices.filter(inv => 
      inv.validated || (inv.status && inv.status === 'pending')
    );
    setInvoices(validInvoices);
  }, []);

  // Select an invoice
  const handleInvoiceSelect = (e) => {
    const id = e.target.value;
    setSelectedInvoiceId(id);
    
    if (!id) {
      setSelectedInvoice(null);
      setEmailSubjectAndMessage('', null);
      return;
    }
    
    setLoading(true);
    const invoice = invoices.find(inv => inv.id === id);
    setSelectedInvoice(invoice);
    
    // Set default email subject and message based on selected invoice
    setEmailSubjectAndMessage(id, invoice);
    
    setLoading(false);
  };

  // Set email subject and message with invoice details
  const setEmailSubjectAndMessage = (id, invoice) => {
    if (!id || !invoice) {
      setSendingOptions(prev => ({
        ...prev,
        emailSubject: '',
        emailMessage: ''
      }));
      return;
    }
    
    const subject = `Invoice ${invoice.invoiceNumber} from Your Company`;
    
    const dueDate = new Date(invoice.dueDate).toLocaleDateString('en-US', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });
    
    const message = `Dear ${invoice.client},

We hope this email finds you well. Please find attached invoice ${invoice.invoiceNumber} for your recent services.

Invoice Details:
- Invoice Number: ${invoice.invoiceNumber}
- Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
- Due Date: ${dueDate}
- Total Amount: $${invoice.total.toFixed(2)}

Payment Methods:
- Online: Click the payment link in this email
- Bank Transfer: [Your Bank Details Here]

If you have any questions, please don't hesitate to contact us.

Thank you for your business!

Best regards,
Your Company`;
    
    setSendingOptions(prev => ({
      ...prev,
      emailSubject: subject,
      emailMessage: message
    }));
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setSendingOptions(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Toggle email preview
  const toggleEmailPreview = () => {
    setEmailPreview(!emailPreview);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    
    setSending(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mark invoice as sent in localStorage
      const updatedInvoices = invoices.map(inv => {
        if (inv.id === selectedInvoiceId) {
          return {
            ...inv,
            status: 'sent',
            sentDate: new Date().toISOString(),
            sentMethod: sendingOptions.method,
            sentTo: sendingOptions.emailRecipients
          };
        }
        return inv;
      });
      
      // Update all invoices in localStorage
      const allInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const updatedAllInvoices = allInvoices.map(inv => {
        const updatedInv = updatedInvoices.find(u => u.id === inv.id);
        return updatedInv || inv;
      });
      
      localStorage.setItem('invoices', JSON.stringify(updatedAllInvoices));
      
      setSending(false);
      setSendingComplete(true);
    }, 2000);
  };

  // Handle going back to invoice history
  const handleGoToHistory = () => {
    navigate('/invoicehistory');
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Send Invoice</h1>
          <Link to="/invoices/new">
            <button className="btn-primary">New Invoice</button>
          </Link>
        </div>
        
        <div className="sending-container">
          {!sendingComplete ? (
            <form onSubmit={handleSubmit} className="sending-form">
              <div className="sending-step">
                <h2>1. Select an Invoice to Send</h2>
                <div className="form-group">
                  <select 
                    value={selectedInvoiceId} 
                    onChange={handleInvoiceSelect}
                    className="invoice-select"
                    required
                  >
                    <option value="">Select an invoice...</option>
                    {invoices.map(invoice => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoiceNumber} - {invoice.client} (${invoice.total.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {loading && (
                <div className="loading-indicator">
                  <i className="fas fa-spinner fa-spin"></i> Loading invoice details...
                </div>
              )}
              
              {selectedInvoice && !loading && (
                <>
                  <div className="sending-step">
                    <h2>2. Invoice Preview</h2>
                    <div className="invoice-preview">
                      <div className="preview-header">
                        <div className="company-logo">
                          <i className="fas fa-building"></i> Your Company
                        </div>
                        <div className="invoice-badge">INVOICE</div>
                      </div>
                      
                      <div className="preview-details">
                        <div className="detail-column">
                          <div className="detail-section">
                            <h4>Bill To:</h4>
                            <p>{selectedInvoice.client}</p>
                            <p>Client Address</p>
                            <p>City, State ZIP</p>
                          </div>
                          
                          <div className="detail-section">
                            <h4>Issue Date:</h4>
                            <p>{formatDate(selectedInvoice.issueDate)}</p>
                            
                            <h4>Due Date:</h4>
                            <p>{formatDate(selectedInvoice.dueDate)}</p>
                          </div>
                        </div>
                        
                        <div className="detail-column">
                          <div className="detail-section">
                            <h4>Invoice Number:</h4>
                            <p>{selectedInvoice.invoiceNumber}</p>
                            
                            <h4>Total Due:</h4>
                            <p className="total-amount">${selectedInvoice.total.toFixed(2)}</p>
                          </div>
                          
                          <div className="detail-section">
                            <h4>Status:</h4>
                            <p className="invoice-status">{selectedInvoice.status || 'Pending'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="preview-items">
                        <table className="items-table">
                          <thead>
                            <tr>
                              <th>Description</th>
                              <th>Quantity</th>
                              <th>Unit Price</th>
                              <th>Tax</th>
                              <th>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedInvoice.items && selectedInvoice.items.map((item, index) => {
                              const itemTotal = item.quantity * item.unitPrice;
                              const itemTax = itemTotal * (item.taxRate / 100);
                              const itemAmount = itemTotal + itemTax;
                              
                              return (
                                <tr key={index}>
                                  <td>{item.description}</td>
                                  <td>{item.quantity}</td>
                                  <td>${item.unitPrice.toFixed(2)}</td>
                                  <td>{item.taxRate}%</td>
                                  <td>${itemAmount.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="4" className="text-right">Subtotal:</td>
                              <td>${selectedInvoice.subtotal?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr>
                              <td colSpan="4" className="text-right">Tax:</td>
                              <td>${selectedInvoice.tax?.toFixed(2) || '0.00'}</td>
                            </tr>
                            <tr className="total-row">
                              <td colSpan="4" className="text-right">Total:</td>
                              <td>${selectedInvoice.total.toFixed(2)}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  <div className="sending-step">
                    <h2>3. Sending Options</h2>
                    
                    <div className="sending-methods">
                      <label className={`method-option ${sendingOptions.method === 'email' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="method"
                          value="email"
                          checked={sendingOptions.method === 'email'}
                          onChange={handleInputChange}
                        />
                        <div className="method-icon">
                          <i className="fas fa-envelope"></i>
                        </div>
                        <div className="method-details">
                          <h4>Email</h4>
                          <p>Send invoice via email</p>
                        </div>
                      </label>
                      
                      <label className={`method-option ${sendingOptions.method === 'sftp' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="method"
                          value="sftp"
                          checked={sendingOptions.method === 'sftp'}
                          onChange={handleInputChange}
                        />
                        <div className="method-icon">
                          <i className="fas fa-server"></i>
                        </div>
                        <div className="method-details">
                          <h4>SFTP</h4>
                          <p>Send invoice via SFTP</p>
                        </div>
                      </label>
                      
                      <label className={`method-option ${sendingOptions.method === 'portal' ? 'selected' : ''}`}>
                        <input
                          type="radio"
                          name="method"
                          value="portal"
                          checked={sendingOptions.method === 'portal'}
                          onChange={handleInputChange}
                        />
                        <div className="method-icon">
                          <i className="fas fa-globe"></i>
                        </div>
                        <div className="method-details">
                          <h4>Client Portal</h4>
                          <p>Make available on client portal</p>
                        </div>
                      </label>
                    </div>
                    
                    {sendingOptions.method === 'email' && (
                      <div className="email-options">
                        <div className="form-row">
                          <div className="form-group full-width">
                            <label htmlFor="emailRecipients">To:</label>
                            <input
                              type="text"
                              id="emailRecipients"
                              name="emailRecipients"
                              value={sendingOptions.emailRecipients}
                              onChange={handleInputChange}
                              placeholder="client@example.com"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group">
                            <label htmlFor="emailCc">CC:</label>
                            <input
                              type="text"
                              id="emailCc"
                              name="emailCc"
                              value={sendingOptions.emailCc}
                              onChange={handleInputChange}
                              placeholder="Optional"
                            />
                          </div>
                          
                          <div className="form-group">
                            <label htmlFor="emailBcc">BCC:</label>
                            <input
                              type="text"
                              id="emailBcc"
                              name="emailBcc"
                              value={sendingOptions.emailBcc}
                              onChange={handleInputChange}
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group full-width">
                            <label htmlFor="emailSubject">Subject:</label>
                            <input
                              type="text"
                              id="emailSubject"
                              name="emailSubject"
                              value={sendingOptions.emailSubject}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="form-row">
                          <div className="form-group full-width">
                            <div className="message-header">
                              <label htmlFor="emailMessage">Message:</label>
                              <button 
                                type="button"
                                className="preview-toggle"
                                onClick={toggleEmailPreview}
                              >
                                {emailPreview ? 'Edit Message' : 'Preview'}
                              </button>
                            </div>
                            
                            {emailPreview ? (
                              <div className="email-preview">
                                {sendingOptions.emailMessage.split('\n').map((line, i) => (
                                  <p key={i}>{line}</p>
                                ))}
                              </div>
                            ) : (
                              <textarea
                                id="emailMessage"
                                name="emailMessage"
                                value={sendingOptions.emailMessage}
                                onChange={handleInputChange}
                                rows="8"
                                required
                              ></textarea>
                            )}
                          </div>
                        </div>
                        
                        <div className="form-row checkbox-row">
                          <div className="form-group checkbox-group">
                            <input
                              type="checkbox"
                              id="includeAttachment"
                              name="includeAttachment"
                              checked={sendingOptions.includeAttachment}
                              onChange={handleInputChange}
                            />
                            <label htmlFor="includeAttachment">Attach invoice PDF</label>
                          </div>
                          
                          <div className="form-group checkbox-group">
                            <input
                              type="checkbox"
                              id="includePaymentLink"
                              name="includePaymentLink"
                              checked={sendingOptions.includePaymentLink}
                              onChange={handleInputChange}
                            />
                            <label htmlFor="includePaymentLink">Include payment link</label>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {sendingOptions.method === 'sftp' && (
                      <div className="sftp-options">
                        <p className="option-description">
                          The invoice will be uploaded to the configured SFTP server. 
                          Please make sure your SFTP settings are configured in the Settings page.
                        </p>
                      </div>
                    )}
                    
                    {sendingOptions.method === 'portal' && (
                      <div className="portal-options">
                        <p className="option-description">
                          The invoice will be made available on your client portal. 
                          Your client will receive a notification to view the invoice.
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="sending-step">
                    <h2>4. Additional Options</h2>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="scheduleTime">Schedule Sending:</label>
                        <input
                          type="datetime-local"
                          id="scheduleTime"
                          name="scheduleTime"
                          value={sendingOptions.scheduleTime}
                          onChange={handleInputChange}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                    </div>
                    
                    <div className="form-row checkbox-row">
                      <div className="form-group checkbox-group">
                        <input
                          type="checkbox"
                          id="autoReminders"
                          name="autoReminders"
                          checked={sendingOptions.autoReminders}
                          onChange={handleInputChange}
                        />
                        <label htmlFor="autoReminders">Send automatic reminders</label>
                      </div>
                    </div>
                    
                    {sendingOptions.autoReminders && (
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="reminderDays">Remind before due date:</label>
                          <select
                            id="reminderDays"
                            name="reminderDays"
                            value={sendingOptions.reminderDays}
                            onChange={handleInputChange}
                          >
                            <option value="1">1 day</option>
                            <option value="2">2 days</option>
                            <option value="3">3 days</option>
                            <option value="5">5 days</option>
                            <option value="7">7 days</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="sending-actions">
                    <Link to="/invoicehistory" className="btn-secondary">
                      <i className="fas fa-times"></i> Cancel
                    </Link>
                    <button 
                      type="submit" 
                      className="btn-primary"
                      disabled={sending}
                    >
                      {sending ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Sending...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane"></i> Send Invoice
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
              
              {!selectedInvoice && !loading && invoices.length > 0 && (
                <div className="select-prompt">
                  <i className="fas fa-arrow-up"></i>
                  <p>Please select an invoice to send</p>
                </div>
              )}
              
              {invoices.length === 0 && (
                <div className="no-invoices">
                  <i className="fas fa-file-invoice"></i>
                  <p>No invoices available for sending</p>
                  <Link to="/invoices/new">
                    <button className="btn-primary">Create Your First Invoice</button>
                  </Link>
                </div>
              )}
            </form>
          ) : (
            <div className="sending-success">
              <div className="success-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h2>Invoice Sent Successfully!</h2>
              <p>
                {sendingOptions.method === 'email' ? (
                  <>The invoice has been sent to <strong>{sendingOptions.emailRecipients}</strong>.</>
                ) : sendingOptions.method === 'sftp' ? (
                  <>The invoice has been uploaded to the SFTP server.</>
                ) : (
                  <>The invoice is now available on the client portal.</>
                )}
              </p>
              
              {sendingOptions.scheduleTime && (
                <p className="scheduled-note">
                  <i className="fas fa-clock"></i> This invoice is scheduled to be sent on {new Date(sendingOptions.scheduleTime).toLocaleString()}.
                </p>
              )}
              
              <div className="success-actions">
                <button 
                  className="btn-primary"
                  onClick={handleGoToHistory}
                >
                  <i className="fas fa-list"></i> View Invoice History
                </button>
                <Link to="/invoices/new" className="btn-secondary">
                  <i className="fas fa-plus"></i> Create New Invoice
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default InvoiceSending;