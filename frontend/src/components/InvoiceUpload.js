import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import Sidebar from './Sidebar';
import { useAuth } from './AuthContext';
import '../styles/InvoiceUpload.css';

function InvoiceUpload() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState('');
  const [clients, setClients] = useState([]);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const { token } = useAuth();

  // Fetch clients when component mounts
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/contact/getContacts', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }
  
        const { data } = await response.json();
        // Filter to only show contacts of type 'client'
        const clientContacts = data.filter(contact => contact.type === 'client');
        setClients(clientContacts);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };
  
    fetchClients();
  }, [token]);

  // Handle client selection
  const handleClientChange = (e) => {
    setClientId(e.target.value);
    // Reset files and processed data when client changes
    setFiles([]);
    setProcessedData(null);
  };

  // Handle file upload
  const handleFileUpload = (uploadedFiles) => {
    const newFiles = uploadedFiles.map(file => ({
      id: Date.now() + Math.random().toString(36).substring(2),
      file,
      name: file.name,
      type: getFileType(file),
      status: 'pending'
    }));

    setFiles(newFiles);
    processFiles(newFiles);
  };

  // Determine file type
  const getFileType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image';
    if (['xlsx', 'xls', 'csv'].includes(extension)) return 'spreadsheet';
    if (['doc', 'docx'].includes(extension)) return 'document';
    if (['xml'].includes(extension)) return 'xml';
    return 'other';
  };

  // Process uploaded files
  const processFiles = (filesToProcess) => {
    filesToProcess.forEach(fileObj => {
      if (fileObj.type === 'spreadsheet' && fileObj.file.name.endsWith('.csv')) {
        Papa.parse(fileObj.file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.data.length > 0) {
              const row = results.data[0];
              const processedInvoiceData = extractInvoiceData(row);
              setProcessedData(processedInvoiceData);
            }
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            alert('Could not read CSV - please check the format.');
          }
        });
      }
    });
  };

  // Extract invoice data from CSV row
  const extractInvoiceData = (row) => {
    // Basic invoice data extraction logic
    const items = Object.entries(row)
      .filter(([k]) => k.startsWith('itemDescription'))
      .map(([k, v]) => {
        const idx = k.replace('itemDescription', '');
        return {
          description: v,
          quantity: +row[`itemQuantity${idx}`] || 0,
          unitPrice: +row[`itemUnitPrice${idx}`] || 0,
          taxRate: +row[`itemTaxRate${idx}`] || 0
        };
      })
      .filter(i => i.description);

    const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const tax = items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.taxRate / 100), 0);
    const total = subtotal + tax;

    return {
      issueDate: row.issueDate || new Date().toISOString().split('T')[0],
      dueDate: row.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      subtotal,
      tax,
      total,
      items
    };
  };

  // Create invoice
  const handleCreateInvoice = async () => {
    if (!processedData || !clientId) return;

    setLoading(true);
    try {
      // Find selected client
      const selectedClient = clients.find(client => client.id.toString() === clientId.toString());
      if (!selectedClient) {
        throw new Error('Selected client not found');
      }

      // Prepare invoice data
      const invoiceData = {
        ...processedData,
        contactId: selectedClient.id,
        clientName: selectedClient.name,
        clientEmail: selectedClient.email,
        clientCity: selectedClient.city,
        clientStreet: selectedClient.street,
        clientPostCode: selectedClient.postcode,
        clientTaxNumber: selectedClient.tax_number
      };

      // Send invoice to backend
      const response = await fetch('http://localhost:5000/api/invoice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(invoiceData)
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      const result = await response.json();
      alert(`Invoice ${result.data.invoice_number} created successfully!`);
      
      // Navigate to invoice history
      navigate('/invoicehistory');
    } catch (error) {
      console.error('Invoice creation error:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    if (e.dataTransfer.files.length > 0) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  };

  // File input handler
  const handleFileInputChange = (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(Array.from(e.target.files));
    }
  };

  // Remove file
  const removeFile = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
    
    // If this was the only processed file, clear processed data
    if (files.length === 1) {
      setProcessedData(null);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Invoice Upload</h1>
          <Link to="/invoices/new">
            <button className="btn-primary">New Invoice</button>
          </Link>
        </div>
        
        <div className="upload-container">
          {/* Client Selection */}
          <div className="form-group">
            <label htmlFor="clientId">Select Client (Must Select to Proceed)</label>
            <select
              id="clientId"
              name="clientId"
              value={clientId}
              onChange={handleClientChange}
              required
            >
              <option value="">Choose a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Area (only visible after client selection) */}
          {clientId && (
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx,.xml"
                multiple
                className="file-input"
              />
              
              <div className="upload-content">
                <i className="fas fa-cloud-upload-alt upload-icon"></i>
                <h3>Drag & Drop Invoice Files</h3>
                <p>or</p>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={() => fileInputRef.current.click()}
                >
                  Browse Files
                </button>
                <p className="upload-info">
                  Supported: PDF, JPG, PNG, Excel, CSV
                </p>
              </div>
            </div>
          )}

          {/* Uploaded Files List */}
          {files.length > 0 && (
            <div className="uploaded-files">
              <h3>Uploaded Files</h3>
              {files.map(fileObj => (
                <div key={fileObj.id} className="file-item">
                  <div className="file-details">
                    <div className="file-name">{fileObj.name}</div>
                    <div className="file-type">{fileObj.type.toUpperCase()}</div>
                  </div>
                  <button 
                    className="remove-file-btn"
                    onClick={() => removeFile(fileObj.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Processed Data Preview */}
          {processedData && (
            <div className="processed-data-preview">
              <h3>Invoice Details</h3>
              <div className="preview-section">
                <div className="preview-row">
                  <span>Subtotal:</span>
                  <strong>${processedData.subtotal.toFixed(2)}</strong>
                </div>
                <div className="preview-row">
                  <span>Tax:</span>
                  <strong>${processedData.tax.toFixed(2)}</strong>
                </div>
                <div className="preview-row">
                  <span>Total:</span>
                  <strong>${processedData.total.toFixed(2)}</strong>
                </div>
              </div>
              
              <button 
                className="btn-primary create-invoice-btn"
                onClick={handleCreateInvoice}
              >
                Create Invoice
              </button>
            </div>
          )}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Creating Invoice...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default InvoiceUpload;