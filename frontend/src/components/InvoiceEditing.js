import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BACKEND_URL } from './config';
import { useAuth } from './AuthContext';
import Sidebar from './Sidebar';

function InvoiceEdit() {
  const navigate = useNavigate();
  const { token, currentUser } = useAuth();
  
  const [invoice, setInvoice] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation(); 
  
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !currentUser) {
        setError('You must be logged in to edit invoices');
        setLoading(false); // Set loading to false immediately
        return;
      }
  
      try {
        setLoading(true); // Start loading indicator
        // Only try to auto-select if there's an invoiceId in URL
        const queryParams = new URLSearchParams(location.search);
        const invoiceId = queryParams.get('invoiceId');

        console.log("Token:", token); // Check if the token is being passed

        // Fetch the invoice by ID
        const response = await fetch(`${BACKEND_URL}/api/invoice/get/${invoiceId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

  
        const data = await response.json();
  
        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Invoice not found');
        }
  
        console.log('Invoice data:', data.data); // Debugging: Check invoice data in the console
        // Transform API data to match your form field names
        setInvoice({
            id: data.data.invoice.id,
            invoiceNumber: data.data.invoice.invoice_number,
            clientId: data.data.invoice.contact_id,
            clientName: data.data.invoice.client,
            clientCity: data.data.invoice.client_city,
            clientStreet: data.data.invoice.client_street, 
            clientPostCode: data.data.invoice.client_post_code,
            clientEmail: data.data.invoice.client_email,
            clientTaxNumber: data.data.invoice.client_tax_number,
            issueDate: data.data.invoice.issue_date,
            dueDate: data.data.invoice.due_date,
            subtotal: data.data.invoice.subtotal,
            tax: data.data.invoice.tax,
            total: data.data.invoice.total,
            status: data.data.invoice.status,
            notes: data.data.invoice.notes,
            terms: data.data.invoice.terms,
            // Map items array
            items: data.data.items.map(item => ({
              id: item.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              taxRate: item.tax_rate
            }))
          });
        
  
        // Fetch clients (using the /api/contact/getClients route)
        const clientsResponse = await fetch(`${BACKEND_URL}/api/contact/getClients`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
  
        const clientsData = await clientsResponse.json();
  
        if (!clientsResponse.ok) {
          throw new Error(clientsData.error || 'Failed to fetch clients');
        }
  
        setClients(clientsData.data); // Set clients data
        console.log('Clients data:', clientsData.data); // Debugging: Check clients data in the console
  
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false); // Ensure that loading is set to false when all fetches are done
      }
    };
  
    fetchData();
  }, [token, currentUser]); // Re-run when token, currentUser, or invoiceId changes

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
      const updatedInvoice = {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        contactId: invoice.clientId,
        clientName: invoice.clientName,
        clientCity: invoice.clientCity,
        clientStreet: invoice.clientStreet,
        clientPostCode: invoice.clientPostCode,
        clientEmail: invoice.clientEmail,
        clientTaxNumber: invoice.clientTaxNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        subtotal: calculateSubtotal(),
        tax: calculateTotalTax(),
        total: calculateTotal(),
        status: invoice.status,
        items: invoice.items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate
        })),
        notes: invoice.notes,
        terms: invoice.terms
      };
  
      // Send updated invoice to backend API using fetch
      const response = await fetch('http://localhost:5000/api/invoice/edit', {  // Adjust URL if necessary
        method: 'PUT',  // Use PUT for editing data (instead of POST for creation)
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedInvoice),
      });
  
      if (!response.ok) {
        throw new Error('Failed to update invoice');
      }
  
      const responseData = await response.json();
  
      // Show success message and redirect
      alert('Invoice updated successfully!');
      navigate(`/invoicehistory`);
    } catch (error) {
      console.error('Error updating invoice:', error);
      setError(`Failed to update invoice: ${error.message}`);
      alert('Failed to update invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Edit Invoice</h1>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="invoice-creation-container">
          {loading || !invoice ? (
            <div className="loading-overlay">
              <div className="loading-content">
                <i className="fas fa-spinner fa-spin fa-2x"></i>
                <p>Loading Invoice...</p>
              </div>
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

              {/* Render invoice items and summary here, similar to the Create Invoice page */}
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
                  onClick={() => navigate('/invoicehistory')}
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <><i className="fas fa-spinner fa-spin"></i> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default InvoiceEdit;
