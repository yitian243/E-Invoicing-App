import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/InvoiceUpload.css';
import Sidebar from './Sidebar';
import Papa from 'papaparse';
import { useAuth } from './AuthContext';
import { createInvoiceRequest, getContactsForInvoiceRequest } from '../invoiceWrapper';


function InvoiceUpload() {
  const navigate = useNavigate();
  const [clientId, setClientId] = useState(null);
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedInvoiceType, setSelectedInvoiceType] = useState('automatic');
  // eslint-disable-next-line
  const [processingFile, setProcessingFile] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const fileInputRef = useRef(null);
  const { token, currentUser } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  
  
  
  useEffect(() => {

    const fetchClients = async () => {
      try {
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


  // Handle form input changes
  const handleChange = (e) => {
    setClientId(e.target.value);
  };

  // Handle file selection from the input
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    handleFiles(selectedFiles);
  };

  // Process the files that were selected or dropped
  const handleFiles = (selectedFiles) => {
    const newFiles = [...files];
    
    // Create file objects with additional metadata
    selectedFiles.forEach(file => {
      // Check if file is already in the list
      if (!files.some(f => f.name === file.name && f.size === file.size)) {
        newFiles.push({
          file,
          id: Date.now() + Math.random().toString(36).substring(2),
          status: 'pending',
          progress: 0,
          type: getFileType(file)
        });
      }
    });
    
    setFiles(newFiles);
    
    // Start uploading the files
    newFiles.forEach(fileObj => {
      if (fileObj.status === 'pending') {
        simulateUpload(fileObj.id);
      }
    });
  };

  // Determine file type from the extension
  const getFileType = (file) => {
    const extension = file.name.split('.').pop().toLowerCase();
    
    if (['pdf'].includes(extension)) {
      return 'pdf';
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
      return 'image';
    } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
      return 'spreadsheet';
    } else if (['doc', 'docx'].includes(extension)) {
      return 'document';
    } else if (['xml'].includes(extension)) {
      return 'xml';
    } else {
      return 'other';
    }
  };

  // Simulate file upload progress
  const simulateUpload = (fileId) => {
    let progress = 0;
    
    const interval = setInterval(() => {
      progress += Math.random() * 10;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Update file status
        setFiles(prevFiles => prevFiles.map(f => {
          if (f.id === fileId) {
            return { ...f, status: 'uploaded', progress: 100 };
          }
          return f;
        }));
        
        // Clear from progress tracking
        setUploadProgress(prev => {
          const updated = { ...prev };
          delete updated[fileId];
          return updated;
        });
      } else {
        // Update progress
        setUploadProgress(prev => ({
          ...prev,
          [fileId]: Math.round(progress)
        }));
      }
    }, 200);
  };

  // Process the uploaded file
  const handleProcessFile = (fileId) => {
    const selectedFile = files.find(f => f.id === fileId);
    if (!selectedFile || selectedFile.status !== 'uploaded') return;
    
    setProcessingFile(true);
    
    // Update file status to processing
    setFiles(prevFiles => prevFiles.map(f => {
      if (f.id === fileId) {
        return { ...f, status: 'processing' };
      }
      return f;
    }));
    
    setTimeout(() => {
      // Update file status to processed
      setFiles(prevFiles => prevFiles.map(f => {
        if (f.id === fileId) {
          return { ...f, status: 'processed' };
        }
        return f;
      }));
      if (selectedFile.type === 'spreadsheet' && selectedFile.file.name.endsWith('.csv')) {
        console.log("here works4")
        Papa.parse(selectedFile.file, {
          header: true,
          skipEmptyLines: true,
          complete: ({ data }) => {
            const row = data[0];                 // header‑level fields
            const items = Object.entries(row)
              .filter(([k]) => k.startsWith('itemDescription'))
              .map(([k, v]) => {
                const idx = k.replace('itemDescription', '');
                return {
                  description : v,
                  quantity    : +row[`itemQuantity${idx}`]  || 0,
                  unitPrice   : +row[`itemUnitPrice${idx}`] || 0,
                  taxRate     : +row[`itemTaxRate${idx}`]   || 0
                };
              })
              .filter(i => i.description);
      
            const subtotal = items.reduce((s,i)=>s+i.quantity*i.unitPrice, 0);
            const tax      = items.reduce((s,i)=>s+i.quantity*i.unitPrice*(i.taxRate/100), 0);
            const total    = subtotal + tax;
            const issueDate = formatDate(row.issueDate)
            const dueDate = formatDate(row.dueDate)

            const extractedData = {
              issueDate,
              dueDate,
              subtotal, tax, total,
              status        : "pending",
              notes         : row.notes,
              terms         : row.terms,
              items
            };
      
            setProcessedData(extractedData);
            setProcessingFile(false);
            setFiles(prev => prev.map(f =>
              f.id === fileId ? { ...f, status: 'processed' } : f));
          },
          error: () => alert('Could not read CSV - please check the format.')
        });
        return;
      }
    }, 2000);
  };

  // Handle file deletion
  const handleDeleteFile = (fileId) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
    
    // If the deleted file is the one being processed, clear processed data
    if (processedData && files.find(f => f.id === fileId)?.status === 'processed') {
      setProcessedData(null);
    }
  };

  const handleCreateInvoice = async () => {
    if (!processedData) return;
    setLoading(true)
    try {

      console.log('Form submitted with clientId:', clientId);
      console.log('Available clients:', clients);

      if (!clientId) {
        setLoading(false)
        return;
      }
      // Get client name for the invoice record
      const selectedClient = clients.find(client => client.id.toString() === clientId.toString());
      console.log(selectedClient)
      if (!selectedClient) {
        setLoading(false)
        console.error('Selected client not found:', clientId);
        return;
      }
      
      console.log('Selected client:', selectedClient);

      const cId = selectedClient.id;
      const clientName = selectedClient.name || 'Unknown Client';
      const clientCity = selectedClient.city || '';
      const clientStreet = selectedClient.street || '';
      const clientPostCode = selectedClient.postcode || '';
      const clientEmail = selectedClient.email || '';
      const clientTaxNumber = selectedClient.tax_number || ''; // Note: using tax_number from the database

      const updatedData = {
        ...processedData,
        contactId: cId,
        clientName: clientName,
        clientCity: clientCity,
        clientStreet: clientStreet,
        clientPostCode: clientPostCode,
        clientEmail: clientEmail,
        clientTaxNumber: clientTaxNumber,
      };
      
      setProcessedData(updatedData);
      // const res = await createInvoiceRequest(token, invoiceRecord);
      const res = await fetch('http://localhost:5000/api/invoice/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData),
      });
      // const res = await fetch('http://localhost:5000/api/invoice/create', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body  : JSON.stringify(processedData),   // send the object you parsed
      // });

      if (!res.ok) {
        throw new Error('Server responded ${res.status}');
      }

      const { data } = await res.json();   // your backend returns { success, data }
      console.log(data)
      alert(`Invoice ${data.invoice_number} saved successfully!`);

      // reset UI
      setFiles([]);
      setProcessedData(null);

      // Redirect to invoice history page
      navigate('/invoicehistory');
    } catch (err) {
      console.error(err);
      alert('Failed to create invoice – see console for details.');
    } finally {
      setLoading(false)
    }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Trigger the file input click
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // Get icon for file type
  const getFileIcon = (type) => {
    switch (type) {
      case 'pdf':
        return 'fa-file-pdf';
      case 'image':
        return 'fa-file-image';
      case 'spreadsheet':
        return 'fa-file-excel';
      case 'document':
        return 'fa-file-word';
      case 'xml':
        return 'fa-file-code';
      default:
        return 'fa-file';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <div className="upload-options">
            <h2>Upload Options</h2>
            <div className="option-tabs">
              <button 
                className={`option-tab ${selectedInvoiceType === 'automatic' ? 'active' : ''}`}
                onClick={() => setSelectedInvoiceType('automatic')}
              >
                <i className="fas fa-magic"></i> Automatic Extraction
              </button>
              <button 
                className={`option-tab ${selectedInvoiceType === 'manual' ? 'active' : ''}`}
                onClick={() => setSelectedInvoiceType('manual')}
              >
                <i className="fas fa-edit"></i> Manual Entry
              </button>
            </div>
              
            <div className="option-description">
              {selectedInvoiceType === 'automatic' ? (
                <p>
                  Choose a client and then upload an invoice and we'll automatically extract the information. 
                  Supported formats: PDF, Images (JPG, PNG), Excel, CSV, XML.
                </p>
              ) : (
                <p>
                  Choose a client and then upload an invoice as a reference and manually enter the information.
                  Perfect for complex invoices or when automatic extraction doesn't work.
                </p>
              )}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="clientId">Client</label>
            <select
              id="clientId"
              name="clientId"
              value={clientId}
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

          <div className="upload-area-container">
            <div 
              className={`upload-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.csv,.doc,.docx,.xml"
                className="file-input"
                multiple
              />
              
              <div className="upload-content">
                <div className="upload-icon">
                  <i className="fas fa-cloud-upload-alt"></i>
                </div>
                <h3>Drag & Drop Files Here</h3>
                <p>Or</p>
                <button 
                  type="button"
                  className="btn-primary"
                  onClick={handleButtonClick}
                >
                  Browse Files
                </button>
                <p className="upload-info">
                  Supported formats: PDF, Images (JPG, PNG), Excel, CSV, XML
                </p>
              </div>
            </div>
            
            {files.length > 0 && (
              <div className="uploaded-files">
                <h3>Uploaded Files</h3>
                <div className="files-list">
                  {files.map((fileObj) => (
                    <div key={fileObj.id} className={`file-item status-${fileObj.status}`}>
                      <div className="file-icon">
                        <i className={`fas ${getFileIcon(fileObj.type)}`}></i>
                      </div>
                      <div className="file-info">
                        <div className="file-name">{fileObj.file.name}</div>
                        <div className="file-meta">
                          {formatFileSize(fileObj.file.size)} • {fileObj.type.toUpperCase()}
                        </div>
                        {fileObj.status === 'pending' && (
                          <div className="file-progress">
                            <div 
                              className="progress-bar"
                              style={{ width: `${uploadProgress[fileObj.id] || 0}%` }}
                            ></div>
                            <span className="progress-text">{uploadProgress[fileObj.id] || 0}%</span>
                          </div>
                        )}
                        {fileObj.status === 'uploaded' && (
                          <div className="file-status">
                            <i className="fas fa-check-circle"></i> Upload Complete
                          </div>
                        )}
                        {fileObj.status === 'processing' && (
                          <div className="file-status">
                            <i className="fas fa-spinner fa-spin"></i> Processing...
                          </div>
                        )}
                        {fileObj.status === 'processed' && (
                          <div className="file-status">
                            <i className="fas fa-check-circle"></i> Processing Complete
                          </div>
                        )}
                      </div>
                      <div className="file-actions">
                        {fileObj.status === 'uploaded' && (
                          <button
                            className="action-btn process-btn"
                            onClick={() => handleProcessFile(fileObj.id)}
                            title="Process File"
                          >
                            <i className="fas fa-cogs"></i>
                          </button>
                        )}
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteFile(fileObj.id)}
                          title="Delete File"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {processedData && (
            <div className="extracted-data">
              <h2>Extracted Invoice Data</h2>
              <div className="data-preview">
                <div className="preview-row">
                  <div className="preview-label">Invoice Number:</div>
                  <div className="preview-value">{processedData.invoiceNumber}</div>
                </div>
                <div className="preview-row">
                  <div className="preview-label">Client:</div>
                  <div className="preview-value">{processedData.client}</div>
                </div>
                <div className="preview-row">
                  <div className="preview-label">Issue Date:</div>
                  <div className="preview-value">{processedData.issueDate}</div>
                </div>
                <div className="preview-row">
                  <div className="preview-label">Due Date:</div>
                  <div className="preview-value">{processedData.dueDate}</div>
                </div>
                <div className="preview-row">
                  <div className="preview-label">Total Amount:</div>
                  <div className="preview-value">${processedData.total.toFixed(2)}</div>
                </div>
                <div className="preview-row">
                  <div className="preview-label">Items:</div>
                  <div className="preview-value">{processedData.items.length} items</div>
                </div>
                
                {processedData.items.length > 0 && (
                  <div className="items-preview">
                    <h4>Line Items</h4>
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Quantity</th>
                          <th>Unit Price</th>
                          <th>Tax Rate</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processedData.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.description}</td>
                            <td>{item.quantity}</td>
                            <td>${item.unitPrice.toFixed(2)}</td>
                            <td>{item.taxRate}%</td>
                            <td>${(item.quantity * item.unitPrice * (1 + item.taxRate/100)).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="data-actions">
                  <button 
                    className="btn-primary"
                    onClick={handleCreateInvoice}
                  >
                    <i className="fas fa-plus-circle"></i> Create Invoice
                  </button>
                  <Link to="/invoices/new" className="btn-secondary">
                    <i className="fas fa-edit"></i> Edit Before Creating
                  </Link>
                </div>
              </div>
            </div>
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

export default InvoiceUpload;