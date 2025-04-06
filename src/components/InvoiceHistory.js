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
    // In a real app, you'd fetch this data from your API
    // For demonstration purposes, we'll use localStorage to persist invoices
    const fetchInvoices = () => {
      setLoading(true);
      try {
        const savedInvoices = localStorage.getItem('invoices');
        if (savedInvoices) {
          setInvoices(JSON.parse(savedInvoices));
        }
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

  const handleDeleteInvoice = (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      const updatedInvoices = invoices.filter(invoice => invoice.id !== id);
      setInvoices(updatedInvoices);
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
    }
  };

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
                        <button className="action-btn view-btn" title="View Invoice">
                          <i className="fas fa-eye"></i>
                        </button>
                        <button className="action-btn edit-btn" title="Edit Invoice">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          className="action-btn delete-btn" 
                          title="Delete Invoice"
                          onClick={() => handleDeleteInvoice(invoice.id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
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