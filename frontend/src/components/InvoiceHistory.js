<<<<<<< Updated upstream
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';

function InvoiceHistory() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/invoice/get');
        if (!response.ok) {
          throw new Error('Failed to fetch invoices');
        }
        // Parse the response as JSON and update the state
        const { data } = await response.json();
        setInvoices(data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  // Filter invoices based on status
  const getFilteredInvoices = () => {
    let filtered = [...invoices];
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.client.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'number':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case 'client':
          comparison = a.client.localeCompare(b.client);
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
        case 'date':
        default:
          comparison = new Date(a.issueDate) - new Date(b.issueDate);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return 'fa-sort';
    return sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge status-paid';
      case 'pending':
        return 'status-badge status-pending';
      case 'overdue':
        return 'status-badge status-overdue';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        // Make DELETE request to backend
        const response = await fetch(`http://localhost:5000/api/invoice/delete/${id}`, {
          method: 'DELETE'
        });
  
        if (response.status === 204) {
          // Success - update local state
          const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
          setInvoices(updatedInvoices);
        } else if (response.status === 404) {
          // Handle not found case
          const errorData = await response.json();
          console.error('Delete failed:', errorData.error);
          alert('Invoice not found');
        } else {
          // Handle other errors
          console.error('Delete failed with status:', response.status);
          alert('Failed to delete invoice');
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Network error while deleting invoice');
      }
    }
  };
  // const handleDeleteInvoice = (id) => {
  //   if (window.confirm('Are you sure you want to delete this invoice?')) {
  //     const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
  //     setInvoices(updatedInvoices);
  //     localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
  //   }
  // };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Invoice History</h1>
          <Link to="/invoices/new">
            <button className="btn-primary">New Invoice</button>
          </Link>
        </div>
        
        <div className="invoice-history-container">
          <div className="filters-bar">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-options">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button
                className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}
                onClick={() => setFilter('paid')}
              >
                Paid
              </button>
              <button
                className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
                onClick={() => setFilter('overdue')}
              >
                Overdue
              </button>
            </div>
          </div>
          
          {loading ? (
            <div className="loading-indicator">
              <i className="fas fa-spinner fa-spin"></i> Loading invoices...
            </div>
          ) : getFilteredInvoices().length === 0 ? (
            <div className="no-invoices">
              <i className="fas fa-file-invoice"></i>
              <p>No invoices found</p>
              {searchTerm && <p>Try a different search term or clear filters</p>}
              {!searchTerm && (
                <Link to="/invoices/new">
                  <button className="btn-primary">Create Your First Invoice</button>
                </Link>
              )}
            </div>
          ) : (
            <div className="invoice-table-container">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('number')}>
                      Invoice # <i className={`fas ${getSortIcon('number')}`}></i>
                    </th>
                    <th onClick={() => handleSort('client')}>
                      Client <i className={`fas ${getSortIcon('client')}`}></i>
                    </th>
                    <th onClick={() => handleSort('date')}>
                      Issue Date <i className={`fas ${getSortIcon('date')}`}></i>
                    </th>
                    <th>Due Date</th>
                    <th onClick={() => handleSort('amount')}>
                      Amount <i className={`fas ${getSortIcon('amount')}`}></i>
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredInvoices().map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.client}</td>
                      <td>{formatDate(invoice.issueDate)}</td>
                      <td>{formatDate(invoice.dueDate)}</td>
                      <td>{formatCurrency(invoice.total)}</td>
                      <td>
                        <span className={getStatusBadgeClass(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <div className="dropdown">
                          <button className="action-btn dropdown-toggle">
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          <div className="dropdown-menu">
                            <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                              <i className="fas fa-file-pdf"></i> View PDF
                            </a>
                            {invoice.xmlUrl && (
                              <a href={invoice.xmlUrl} target="_blank" rel="noopener noreferrer">
                                <i className="fas fa-file-code"></i> View XML
                              </a>
                            )}
                            <button
                              className="dropdown-item"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                            >
                              <i className="fas fa-trash"></i> Delete
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default InvoiceHistory;
=======
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { deleteInvoiceRequest, getInvoicesRequest } from '../invoiceWrapper';
import { useAuth } from './AuthContext';
import { BACKEND_URL } from './config';
import Sidebar from './Sidebar';

function InvoiceHistory() {
  const { token, currentUser } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');

  // State for tracking which dropdown is open
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Toggle dropdown
  const toggleDropdown = (id) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdownId(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      if (!token || !currentUser) {
        setError('You must be logged in to view invoices');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching invoices with token:', token);
        const response = await getInvoicesRequest(token);
        console.log('Invoices response:', response);
        
        if (typeof response === 'number') {
          throw new Error(`Failed to fetch invoices: ${response}`);
        }
        
        // Update the state with the fetched invoices
        setInvoices(response.data || []);
        console.log('Invoices loaded:', response.data);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setError('Failed to load invoices. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [token, currentUser]);

  // Filter invoices based on status
  const getFilteredInvoices = () => {
    let filtered = [...invoices];
    
    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === filter);
    }
    
    // Apply search filter
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(term) ||
        invoice.client.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'number':
          comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
          break;
        case 'client':
          comparison = a.client.localeCompare(b.client);
          break;
        case 'amount':
          comparison = a.total - b.total;
          break;
        case 'date':
        default:
          comparison = new Date(a.issueDate) - new Date(b.issueDate);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return 'fa-sort';
    return sortOrder === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'status-badge status-paid';
      case 'pending':
        return 'status-badge status-pending';
      case 'overdue':
        return 'status-badge status-overdue';
      case 'validated':
        return 'status-badge status-validated';
      case 'sent':
        return 'status-badge status-sent';
      default:
        return 'status-badge';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleDeleteInvoice = async (id) => {
    if (!token || !currentUser) {
      setError('You must be logged in to delete invoices');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        // Make DELETE request to backend using the wrapper function
        const response = await deleteInvoiceRequest(token, id);
  
        if (response === 204) {
          // Success - update local state
          const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
          setInvoices(updatedInvoices);
        } else if (response === 404) {
          // Handle not found case
          console.error('Delete failed: Invoice not found');
          alert('Invoice not found');
        } else {
          // Handle other errors
          console.error('Delete failed with status:', response);
          alert('Failed to delete invoice');
        }
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Network error while deleting invoice');
      }
    }
  };
  // const handleDeleteInvoice = (id) => {
  //   if (window.confirm('Are you sure you want to delete this invoice?')) {
  //     const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
  //     setInvoices(updatedInvoices);
  //     localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
  //   }
  // };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Invoice History</h1>
          <Link to="/invoices/new">
            <button className="btn-primary">New Invoice</button>
          </Link>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="invoice-history-container">
          <div className="filters-bar">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-options">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                onClick={() => setFilter('pending')}
              >
                Pending
              </button>
              <button
                className={`filter-btn ${filter === 'validated' ? 'active' : ''}`}
                onClick={() => setFilter('validated')}
              >
                Validated
              </button>
              <button
                className={`filter-btn ${filter === 'sent' ? 'active' : ''}`}
                onClick={() => setFilter('sent')}
              >
                Sent
              </button>
              <button
                className={`filter-btn ${filter === 'paid' ? 'active' : ''}`}
                onClick={() => setFilter('paid')}
              >
                Paid
              </button>
              <button
                className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
                onClick={() => setFilter('overdue')}
              >
                Overdue
              </button>
            </div>
          </div>
          
          {!token || !currentUser ? (
            <div className="auth-required-message">
              <i className="fas fa-lock"></i>
              <h2>Authentication Required</h2>
              <p>You must be logged in to view invoices.</p>
            </div>
          ) : loading ? (
            <div className="loading-indicator">
              <i className="fas fa-spinner fa-spin"></i> Loading invoices...
            </div>
          ) : getFilteredInvoices().length === 0 ? (
            <div className="no-invoices">
              <i className="fas fa-file-invoice"></i>
              <p>No invoices found</p>
              {searchTerm && <p>Try a different search term or clear filters</p>}
              {!searchTerm && (
                <Link to="/invoices/new">
                  <button className="btn-primary">Create Your First Invoice</button>
                </Link>
              )}
            </div>
          ) : (
            <div className="invoice-table-container">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('number')}>
                      Invoice # <i className={`fas ${getSortIcon('number')}`}></i>
                    </th>
                    <th onClick={() => handleSort('client')}>
                      Client <i className={`fas ${getSortIcon('client')}`}></i>
                    </th>
                    <th onClick={() => handleSort('date')}>
                      Issue Date <i className={`fas ${getSortIcon('date')}`}></i>
                    </th>
                    <th>Due Date</th>
                    <th onClick={() => handleSort('amount')}>
                      Amount <i className={`fas ${getSortIcon('amount')}`}></i>
                    </th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredInvoices().map((invoice) => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoiceNumber}</td>
                      <td>{invoice.client}</td>
                      <td>{formatDate(invoice.issueDate)}</td>
                      <td>{formatDate(invoice.dueDate)}</td>
                      <td>{formatCurrency(invoice.total)}</td>
                      <td>
                        <span className={getStatusBadgeClass(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </span>
                      </td>
                      <td className="actions-cell">
                        <div className="dropdown" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="action-btn dropdown-toggle"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(invoice.id);
                            }}
                          >
                            <i className="fas fa-ellipsis-v"></i>
                          </button>
                          {openDropdownId === invoice.id && (
                            <div className="dropdown-menu show">
                              {/* Use either the URL or the direct content endpoint */}
                              {invoice.pdf_url || invoice.pdf_content ? (
                                <a 
                                  href={invoice.pdf_url || `${BACKEND_URL}/api/invoice/${invoice.id}/pdf`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="dropdown-item"
                                >
                                  <i className="fas fa-file-pdf"></i> View PDF
                                </a>
                              ) : (
                                <span className="dropdown-item disabled">
                                  <i className="fas fa-file-pdf"></i> PDF Not Available
                                </span>
                              )}
                              
                              {/* Use either the URL or the direct content endpoint */}
                              {invoice.xml_url || invoice.xml_content ? (
                                <a 
                                  href={invoice.xml_url || `${BACKEND_URL}/api/invoice/${invoice.id}/xml`}
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="dropdown-item"
                                >
                                  <i className="fas fa-file-code"></i> View XML
                                </a>
                              ) : (
                                <span className="dropdown-item disabled">
                                  <i className="fas fa-file-code"></i> XML Not Available
                                </span>
                              )}
                              
                              <button
                                className="dropdown-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteInvoice(invoice.id);
                                }}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default InvoiceHistory;
>>>>>>> Stashed changes
