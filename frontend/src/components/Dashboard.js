import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getInvoicesRequest } from '../invoiceWrapper';
import { useAuth } from './AuthContext';
import '../styles/Dashboard.css';
import Sidebar from './Sidebar';
import { BACKEND_URL } from './config';

function Dashboard() {
  const { token, currentUser } = useAuth();
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    invoiceCount: 0,
    totalAmount: 0
  });

  // Load business info
  useEffect(() => {
    const loadBusinessInfo = async () => {
      if (currentUser?.id && token) {
        try {
          // Try to get from localStorage first as a quick load
          const localCurrentBusiness = localStorage.getItem('currentBusiness');
          if (localCurrentBusiness) {
            try {
              const parsedBusiness = JSON.parse(localCurrentBusiness);
              // Set business info from localStorage while we fetch from API
              setBusinessInfo(parsedBusiness);
            } catch (err) {
              console.warn('Failed to parse business from localStorage');
            }
          }
          
          // Fetch from API for most up-to-date info
          const response = await fetch(`${BACKEND_URL}/api/business/user/${currentUser.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const businesses = await response.json();
            
            if (businesses && businesses.length > 0) {
              // If the user belongs to multiple businesses, use the first one
              setBusinessInfo(businesses[0]);
              // Store in localStorage for persistence
              localStorage.setItem('currentBusiness', JSON.stringify(businesses[0]));
            }
          }
        } catch (err) {
          console.error('Failed to load business info:', err);
          setError('Failed to load business information');
        }
      }
    };

    loadBusinessInfo();
  }, [currentUser, token]);

  // Fetch invoices and calculate statistics
  useEffect(() => {
    const fetchInvoicesAndCalculateStats = async () => {
      if (!token || !currentUser) {
        setError('You must be logged in to view dashboard data');
        setLoading(false);
        return;
      }
      
      try {
        const response = await getInvoicesRequest(token);
        
        if (typeof response === 'number') {
          throw new Error(`Failed to fetch invoices: ${response}`);
        }
        
        const fetchedInvoices = response.data || [];
        
        // Calculate statistics
        const count = fetchedInvoices.length;
        const total = fetchedInvoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0);
        
        setStats({
          invoiceCount: count,
          totalAmount: total
        });
      } catch (error) {
        console.error('Error fetching invoice data:', error);
        setError('Failed to load invoice data');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoicesAndCalculateStats();
  }, [token, currentUser]);

  // Format the amount with 2 decimal places and currency symbol
  const formatCurrency = (amount) => {
    const currentBusiness = businessInfo;
    const currency = currentBusiness?.default_currency || 'AUD';
    
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Dashboard</h1>
        </div>
        
        {/* Business Name Box */}
        <div className="business-name-box">
          {loading ? (
            <p>Loading business information...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : businessInfo ? (
            <h2>Business: {businessInfo.name}</h2>
          ) : (
            <p>No business selected</p>
          )}
        </div>
        
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Number of Invoices</h4>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : (
              <h2>{stats.invoiceCount}</h2>
            )}
          </div>
          <div className="summary-card">
            <h4>Total Amount</h4>
            {loading ? (
              <p>Loading...</p>
            ) : error ? (
              <p className="error-text">{error}</p>
            ) : (
              <h2>{formatCurrency(stats.totalAmount)}</h2>
            )}
          </div>
        </div>
  
        <div className="invoice-workflow">
          <div className="workflow-step">
            <h3 className="step-title">Create</h3>
            <div className="step-options">
              <Link to="/invoices/new" className="action-card">
                <h3><i className="fas fa-edit"></i> Manual Entry</h3>
              </Link>
              <Link to="/invoiceupload" className="action-card">
                <h3><i className="fas fa-upload"></i> Upload Invoice</h3>
              </Link>
            </div>
          </div>
          
          <div className="workflow-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>
          
          <div className="workflow-step">
            <h3 className="step-title">Process</h3>
            <Link to="/invoicevalidation" className="action-card tall-card">
              <h3><i className="fas fa-check-square"></i> Validate Invoice</h3>
            </Link>
          </div>
          
          <div className="workflow-arrow">
            <i className="fas fa-arrow-right"></i>
          </div>
          
          <div className="workflow-step">
            <h3 className="step-title">Deliver</h3>
            <Link to="/invoicesending" className="action-card tall-card">
              <h3><i className="fas fa-paper-plane"></i> Send Invoice</h3>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;