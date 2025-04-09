import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/InvoiceUpload.css';
import Sidebar from './Sidebar';

function InvoiceUpload() {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [selectedInvoiceType, setSelectedInvoiceType] = useState('automatic');
  // eslint-disable-next-line
  const [processingFile, setProcessingFile] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const fileInputRef = useRef(null);

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
    
    // Simulate processing time
    setTimeout(() => {
      // Update file status to processed
      setFiles(prevFiles => prevFiles.map(f => {
        if (f.id === fileId) {
          return { ...f, status: 'processed' };
        }
        return f;
      }));
      
      // Generate fake extracted data based on file type
      let extractedData = {};
      
      if (selectedFile.type === 'pdf' || selectedFile.type === 'image') {
        extractedData = {
          invoiceNumber: 'INV-' + Math.floor(1000 + Math.random() * 9000),
          client: 'ABC Corporation',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total: Math.floor(100 + Math.random() * 9900) / 100,
          items: [
            {
              description: 'Professional Services',
              quantity: 1,
              unitPrice: Math.floor(100 + Math.random() * 9900) / 100,
              taxRate: 10
            }
          ]
        };
      } else if (selectedFile.type === 'spreadsheet') {
        extractedData = {
          invoiceNumber: 'INV-' + Math.floor(1000 + Math.random() * 9000),
          client: 'XYZ Industries',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total: Math.floor(100 + Math.random() * 9900) / 100,
          items: [
            {
              description: 'Product A',
              quantity: Math.floor(1 + Math.random() * 10),
              unitPrice: Math.floor(10 + Math.random() * 990) / 100,
              taxRate: 8
            },
            {
              description: 'Product B',
              quantity: Math.floor(1 + Math.random() * 5),
              unitPrice: Math.floor(10 + Math.random() * 990) / 100,
              taxRate: 8
            }
          ]
        };
      } else {
        extractedData = {
          invoiceNumber: 'INV-' + Math.floor(1000 + Math.random() * 9000),
          client: 'Unknown Client',
          issueDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total: 0,
          items: []
        };
      }
      
      setProcessedData(extractedData);
      setProcessingFile(false);
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

  // Create invoice from processed data
  const handleCreateInvoice = () => {
    if (!processedData) return;
    
    // Get existing invoices
    const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    
    // Create a new invoice with extracted data
    const newInvoice = {
      id: Date.now().toString(),
      invoiceNumber: processedData.invoiceNumber,
      client: processedData.client,
      issueDate: processedData.issueDate,
      dueDate: processedData.dueDate,
      total: processedData.total,
      status: 'pending',
      items: processedData.items,
      source: 'uploaded',
      uploadDate: new Date().toISOString()
    };
    
    // Add to invoices in localStorage
    const updatedInvoices = [newInvoice, ...existingInvoices];
    localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    
    // Show success message
    alert('Invoice created successfully from uploaded file!');
    
    // Reset the form
    setFiles([]);
    setProcessedData(null);
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
                  Upload an invoice and we'll automatically extract the information. 
                  Supported formats: PDF, Images (JPG, PNG), Excel, CSV, XML.
                </p>
              ) : (
                <p>
                  Upload an invoice as a reference and manually enter the information.
                  Perfect for complex invoices or when automatic extraction doesn't work.
                </p>
              )}
            </div>
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
                        {processedData.items.map((item, index) => (
                          <tr key={index}>
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
      </main>
    </div>
  );
}

export default InvoiceUpload;