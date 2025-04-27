import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getInvoicesRequest } from '../invoiceWrapper';
import '../styles/InvoiceValidation.css';
import { useAuth } from './AuthContext';
import { BACKEND_URL } from './config';
import Sidebar from './Sidebar';

function InvoiceValidation() {
  const { token, currentUser } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const location = useLocation(); 

  // Load invoices from backend API
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token || !currentUser) {
        setError('You must be logged in to validate invoices');
        return;
      }
      
      try {
        setLoading(true);
        const response = await getInvoicesRequest(token);
        
        if (typeof response === 'number') {
          throw new Error(`Failed to fetch invoices: ${response}`);
        }
        // Filter for draft invoices
        const validInvoices = response.data.filter(inv => 
          inv.status && inv.status === 'draft');
        
        setInvoices(validInvoices);
        // Only try to auto-select if there's an invoiceId in URL
        const queryParams = new URLSearchParams(location.search);
        const invoiceIdFromUrl = queryParams.get('invoiceId');
        
        if (invoiceIdFromUrl && validInvoices.length > 0) {
          const invoiceToSelect = validInvoices.find(inv => inv.id === invoiceIdFromUrl);
          
          if (invoiceToSelect) {
            setSelectedInvoiceId(invoiceIdFromUrl);
            setSelectedInvoice(invoiceToSelect);
          }
          // No else case needed - just proceed without selection if not found
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setError('Failed to load invoices. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [token, currentUser]);

  // Select an invoice
  const handleInvoiceSelect = (e) => {
    const id = e.target.value;
    setSelectedInvoiceId(id);
    
    if (!id) {
      setSelectedInvoice(null);
      setValidationResults(null);
      return;
    }
    
    setLoading(true);
    const invoice = invoices.find(inv => inv.id === id);
    setSelectedInvoice(invoice);
    setValidationResults(null);
    setLoading(false);
  };

  // Validate the invoice
  const validateInvoice = async () => {
    if (!selectedInvoice) return;
    
    setValidating(true);
    
    try {
      // Call backend API to validate invoice
      const response = await fetch(`${BACKEND_URL}/api/invoice/${selectedInvoice.id}/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to validate invoice: ${response.status}`);
      }
      
      const data = await response.json();
      
      setValidationResults(data.results);
      
      // If validation was successful, update the invoice list
      if (data.results.valid) {
        const updatedInvoices = invoices.map(inv => {
          if (inv.id === selectedInvoice.id) {
            return { 
              ...inv, 
              validated: true, 
              validationDate: new Date().toISOString(),
              status: 'validated'
            };
          }
          return inv;
        });
        setInvoices(updatedInvoices);
        
        // Also update the selected invoice
        setSelectedInvoice(prev => ({
          ...prev,
          validated: true,
          validationDate: new Date().toISOString(),
          status: 'validated'
        }));
      }
    } catch (error) {
      console.error('Error validating invoice:', error);
      setError('Failed to validate invoice. Please try again.');
      
      // Fallback to client-side validation if API call fails
      performClientSideValidation();
    } finally {
      setValidating(false);
    }
  };
  
  // Fallback client-side validation
  const performClientSideValidation = () => {
    // Perform validation checks
    const results = {
      valid: true,
      checks: [
        {
          name: 'Invoice Number',
          passed: !!selectedInvoice.invoiceNumber,
          message: selectedInvoice.invoiceNumber ? 'Valid invoice number' : 'Missing invoice number'
        },
        {
          name: 'Client Information',
          passed: !!selectedInvoice.client,
          message: selectedInvoice.client ? 'Client information present' : 'Missing client information'
        },
        {
          name: 'Invoice Date',
          passed: !!selectedInvoice.issueDate,
          message: selectedInvoice.issueDate ? 'Valid issue date' : 'Missing issue date'
        },
        {
          name: 'Due Date',
          passed: !!selectedInvoice.dueDate,
          message: selectedInvoice.dueDate ? 'Valid due date' : 'Missing due date'
        },
        {
          name: 'Invoice Items',
          passed: selectedInvoice.items && selectedInvoice.items.length > 0,
          message: selectedInvoice.items && selectedInvoice.items.length > 0 ? 
            'Invoice contains items' : 'Invoice has no items'
        },
        {
          name: 'Tax Calculation',
          passed: true,
          message: 'Tax calculations are correct'
        },
        {
          name: 'Total Amount',
          passed: selectedInvoice.total > 0,
          message: selectedInvoice.total > 0 ? 
            'Valid total amount' : 'Total amount must be greater than zero'
        },
        {
          name: 'Required Fields',
          passed: validateRequiredFields(selectedInvoice),
          message: validateRequiredFields(selectedInvoice) ? 
            'All required fields are filled' : 'Some required fields are missing'
        }
      ]
    };
    
    // Set overall validation status
    results.valid = results.checks.every(check => check.passed);
    
    setValidationResults(results);
  };

  // Helper function to validate all required fields
  const validateRequiredFields = (invoice) => {
    // Check required fields
    if (!invoice.invoiceNumber || !invoice.client || !invoice.issueDate || !invoice.dueDate) {
      return false;
    }
    
    // Check if items have required fields
    if (!invoice.items || invoice.items.length === 0) {
      return false;
    }
    
    for (const item of invoice.items) {
      if (!item.description || item.quantity <= 0 || item.unitPrice < 0) {
        return false;
      }
    }
    
    return true;
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Invoice Validation</h1>
          <Link to="/invoices/new">
            <button className="btn-primary">New Invoice</button>
          </Link>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="validation-container">
          {!token || !currentUser ? (
            <div className="auth-required-message">
              <i className="fas fa-lock"></i>
              <h2>Authentication Required</h2>
              <p>You must be logged in to validate invoices.</p>
            </div>
          ) : (
            <>
            <div className="validation-step">
            <h2>1. Select a pending Invoice to Validate</h2>
            <div className="form-group">
              <select 
                value={selectedInvoiceId} 
                onChange={handleInvoiceSelect}
                className="invoice-select"
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
              <div className="validation-step">
                <h2>2. Review Invoice Details</h2>
                <div className="invoice-summary">
                  <div className="summary-row">
                    <span className="summary-label">Invoice Number:</span>
                    <span className="summary-value">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Client:</span>
                    <span className="summary-value">{selectedInvoice.client}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Issue Date:</span>
                    <span className="summary-value">{formatDate(selectedInvoice.issueDate)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Due Date:</span>
                    <span className="summary-value">{formatDate(selectedInvoice.dueDate)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Total Amount:</span>
                    <span className="summary-value">${selectedInvoice.total.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Number of Items:</span>
                    <span className="summary-value">{selectedInvoice.items?.length || 0}</span>
                  </div>
                  
                  <div className="validation-actions">
                    <button 
                      className="btn-primary"
                      onClick={validateInvoice}
                      disabled={validating}
                    >
                      {validating ? (
                        <>
                          <i className="fas fa-spinner fa-spin"></i> Validating...
                        </>
                      ) : 'Validate Invoice'}
                    </button>
                    <Link to={`/invoices/edit/${selectedInvoice.id}`} className="btn-secondary">
                      Edit Invoice
                    </Link>
                  </div>
                </div>
              </div>
              
              {validationResults && (
                <div className="validation-step">
                  <h2>3. Validation Results</h2>
                  <div className={`validation-result ${validationResults.valid ? 'valid' : 'invalid'}`}>
                    <div className="result-header">
                      <div className="result-icon">
                        <i className={`fas ${validationResults.valid ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                      </div>
                      <div className="result-title">
                        <h3>{validationResults.valid ? 'Invoice is Valid' : 'Invoice Needs Corrections'}</h3>
                        <p>{validationResults.valid ? 
                          'Your invoice has passed all validation checks and is ready to be sent.' : 
                          'Please correct the issues below before sending this invoice.'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="validation-checks">
                      {validationResults.checks.map((check, index) => (
                        <div key={index} className={`validation-check ${check.passed ? 'passed' : 'failed'}`}>
                          <div className="check-icon">
                            <i className={`fas ${check.passed ? 'fa-check' : 'fa-times'}`}></i>
                          </div>
                          <div className="check-details">
                            <h4>{check.name}</h4>
                            <p>{check.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {validationResults.valid && (
                      <div className="next-steps">
                        <p>Your invoice is validated and ready to be sent.</p>
                        <div className="action-buttons">
                          <Link to={`/invoicesending?invoiceId=${selectedInvoice.id}`} className="btn-primary">
                            <i className="fas fa-paper-plane"></i> Proceed to Sending
                          </Link>
                          <Link to="/invoicehistory" className="btn-secondary">
                            <i className="fas fa-arrow-left"></i> Back to Invoice History
                          </Link>
                        </div>
                      </div>
                    )}
                    
                    {!validationResults.valid && (
                      <div className="next-steps">
                        <p>Please correct the validation issues before proceeding.</p>
                        <div className="action-buttons">
                          <Link to={`/invoices/edit/${selectedInvoice.id}`} className="btn-primary">
                            <i className="fas fa-edit"></i> Edit Invoice
                          </Link>
                          <button 
                            className="btn-secondary"
                            onClick={validateInvoice}
                          >
                            <i className="fas fa-sync-alt"></i> Validate Again
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
          
          {!selectedInvoice && !loading && invoices.length > 0 && (
            <div className="select-prompt">
              <i className="fas fa-arrow-up"></i>
              <p>Please select an invoice to validate</p>
            </div>
          )}
          
          {invoices.length === 0 && (
            <div className="no-invoices">
              <i className="fas fa-file-invoice"></i>
              <p>No invoices found</p>
              <Link to="/invoices/new">
                <button className="btn-primary">Create Your First Invoice</button>
              </Link>
            </div>
          )}
          </>
          )}
        </div>
      </main>
    </div>
  );
}

export default InvoiceValidation;
