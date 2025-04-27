import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createInvoiceRequest, getContactsForInvoiceRequest } from '../invoiceWrapper';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';

function InvoiceCreation() {
  const navigate = useNavigate();
  const { token, currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [invoice, setInvoice] = useState({
    invoiceNumber: '',
    clientId: '',
    issueDate: formatDate(new Date()),
    dueDate: formatDate(getDatePlusDays(new Date(), 30)),
    items: [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0 }],
    notes: '',
    terms: 'Payment is due within 30 days',
  });

  // Fetch clients from the user's business
  useEffect(() => {
    const fetchClients = async () => {
      if (!token || !currentUser) {
        setError('You must be logged in to create invoices');
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching clients with token:', token);
        const response = await getContactsForInvoiceRequest(token);
        console.log('Response from getContactsForInvoiceRequest:', response);
        
        if (typeof response === 'number') {
          throw new Error(`Failed to fetch clients: ${response}`);
        }

        if (!response.data) {
          throw new Error('No data returned from server');
        }

        // Filter to only show contacts of type 'client'
        const clientContacts = response.data.filter(contact => contact.type === 'client');
        console.log('Filtered client contacts:', clientContacts);
        setClients(clientContacts);
      } catch (error) {
        console.error('Error fetching clients:', error);
        setError('Failed to load clients. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [token, currentUser]);

  // Format date as YYYY-MM-DD for input fields
  function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
  }

  // Get date plus specified days
  function getDatePlusDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInvoice({
      ...invoice,
      [name]: value,
    });
  };

  // Handle changes to line items
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const updatedItems = [...invoice.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [name]: name === 'description' ? value : parseFloat(value) || 0,
    };
    setInvoice({
      ...invoice,
      items: updatedItems,
    });
  };

  // Add a new line item
  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [
        ...invoice.items,
        { description: '', quantity: 1, unitPrice: 0, taxRate: 0 },
      ],
    });
  };

  // Remove a line item
  const removeItem = (index) => {
    if (invoice.items.length > 1) {
      const updatedItems = [...invoice.items];
      updatedItems.splice(index, 1);
      setInvoice({
        ...invoice,
        items: updatedItems,
      });
    }
  };

  // Calculate subtotal for an item
  const calculateItemSubtotal = (item) => {
    return item.quantity * item.unitPrice;
  };

  // Calculate tax for an item
  const calculateItemTax = (item) => {
    return calculateItemSubtotal(item) * (item.taxRate / 100);
  };

  // Calculate invoice subtotal (before tax)
  const calculateSubtotal = () => {
    return invoice.items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
  };

  // Calculate total tax
  const calculateTotalTax = () => {
    return invoice.items.reduce((sum, item) => sum + calculateItemTax(item), 0);
  };

  // Calculate invoice total
  const calculateTotal = () => {
    return calculateSubtotal() + calculateTotalTax();
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    
    try {
      console.log('Form submitted with clientId:', invoice.clientId);
      console.log('Available clients:', clients);
      
      if (!invoice.clientId) {
        setError('Please select a client');
        setLoading(false);
        return;
      }
      
      // Get client name for the invoice record
      const selectedClient = clients.find(client => client.id.toString() === invoice.clientId.toString());
      
      if (!selectedClient) {
        console.error('Selected client not found:', invoice.clientId);
        setError('Selected client not found');
        setLoading(false);
        return;
      }
      
      console.log('Selected client:', selectedClient);
      
      const clientId = selectedClient.id;
      const clientName = selectedClient.name || 'Unknown Client';
      const clientCity = selectedClient.city || '';
      const clientStreet = selectedClient.street || '';
      const clientPostCode = selectedClient.postcode || '';
      const clientEmail = selectedClient.email || '';
      const clientTaxNumber = selectedClient.tax_number || ''; // Note: using tax_number from the database

      // Calculate final amounts
      const subtotal = calculateSubtotal();
      const tax = calculateTotalTax();
      const total = calculateTotal();

      console.log('Calculated amounts:', { subtotal, tax, total });
      
      // back end will generate newId
      // Create invoice record for history
      const invoiceRecord = {
        contactId: clientId,
        clientName: clientName,
        clientCity: clientCity,
        clientStreet: clientStreet,
        clientPostCode: clientPostCode,
        clientEmail: clientEmail,
        clientTaxNumber: clientTaxNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: subtotal,
        tax: tax,
        total: total,
        status: 'pending', // Default status for new invoices
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate
        })),
        notes: invoice.notes,
        terms: invoice.terms
      };

      console.log('Sending invoice record:', invoiceRecord);

      // Send invoice to backend API using the wrapper function
      const response = await createInvoiceRequest(token, invoiceRecord);
      
      console.log('Create invoice response:', response);
      
      if (typeof response === 'number') {
        throw new Error(`Failed to create invoice: ${response}`);
      }
      
      // Show success message
      alert('Invoice created successfully!');
  
      // Redirect to invoice history page
      navigate('/invoicehistory');
          
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError(`Failed to create invoice: ${error.message}`);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Create New Invoice</h1>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="invoice-creation-container">
          {!token || !currentUser ? (
            <div className="auth-required-message">
              <i className="fas fa-lock"></i>
              <h2>Authentication Required</h2>
              <p>You must be logged in to create invoices.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="invoice-form">
            <div className="form-section">
              <h2>Invoice Details</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="invoiceNumber">Invoice Number</label>
                  <input
                    type="text"
                    id="invoiceNumber"
                    name="invoiceNumber"
                    value={invoice.invoiceNumber}
                    onChange={handleChange}
                    placeholder="Invoice Number will be generated"
                    readOnly
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="clientId">Client</label>
                  <select
                    id="clientId"
                    name="clientId"
                    value={invoice.clientId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="issueDate">Issue Date</label>
                  <input
                    type="date"
                    id="issueDate"
                    name="issueDate"
                    value={invoice.issueDate}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="dueDate">Due Date</label>
                  <input
                    type="date"
                    id="dueDate"
                    name="dueDate"
                    value={invoice.dueDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h2>Invoice Items</h2>
              
              <div className="invoice-items">
                <div className="invoice-item-header">
                  <div className="item-description">Description</div>
                  <div className="item-quantity">Quantity</div>
                  <div className="item-unit-price">Unit Price</div>
                  <div className="item-tax">Tax (%)</div>
                  <div className="item-total">Total</div>
                  <div className="item-actions">Actions</div>
                </div>
                
                {invoice.items.map((item, index) => (
                  <div key={index} className="invoice-item">
                    <div className="item-description">
                      <input
                        type="text"
                        name="description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, e)}
                        placeholder="Item description"
                        required
                      />
                    </div>
                    
                    <div className="item-quantity">
                      <input
                        type="number"
                        name="quantity"
                        min="1"
                        step="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                      />
                    </div>
                    
                    <div className="item-unit-price">
                      <input
                        type="number"
                        name="unitPrice"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, e)}
                        required
                      />
                    </div>
                    
                    <div className="item-tax">
                      <input
                        type="number"
                        name="taxRate"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.taxRate}
                        onChange={(e) => handleItemChange(index, e)}
                      />
                    </div>
                    
                    <div className="item-total">
                      ${(calculateItemSubtotal(item) + calculateItemTax(item)).toFixed(2)}
                    </div>
                    
                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => removeItem(index)}
                        disabled={invoice.items.length <= 1}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
                
                <div className="add-item">
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={addItem}
                  >
                    <i className="fas fa-plus"></i> Add Item
                  </button>
                </div>
                
                <div className="invoice-summary">
                  <div className="summary-row">
                    <div className="summary-label">Subtotal:</div>
                    <div className="summary-value">${calculateSubtotal().toFixed(2)}</div>
                  </div>
                  
                  <div className="summary-row">
                    <div className="summary-label">Tax:</div>
                    <div className="summary-value">${calculateTotalTax().toFixed(2)}</div>
                  </div>
                  
                  <div className="summary-row total">
                    <div className="summary-label">Total:</div>
                    <div className="summary-value">${calculateTotal().toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h2>Additional Information</h2>
              
              <div className="form-group">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={invoice.notes}
                  onChange={handleChange}
                  placeholder="Any additional notes for the client"
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-group">
                <label htmlFor="terms">Terms and Conditions</label>
                <textarea
                  id="terms"
                  name="terms"
                  value={invoice.terms}
                  onChange={handleChange}
                  rows="3"
                ></textarea>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate('/invoices')}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Creating Invoice...
                  </>
                ) : (
                  'Create Invoice'
                )}
              </button>
            </div>
          </form>
          )}
        </div>
        {loading && (
          <div className="loading-overlay">
            <div className="loading-content">
              <i className="fas fa-spinner fa-spin fa-2x"></i>
              <p>Creating your invoice...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default InvoiceCreation;