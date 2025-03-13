import React from 'react';
import { Link } from 'react-router-dom';
import './../Dashboard.css';
import Sidebar from './Sidebar';

function Dashboard() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Dashboard</h1>
          {/* <Link to="/invoices/new">
            <button className="btn-primary">New Invoice</button>
          </Link> */}
        </div>
  
        <div className="quick-actions">
          <Link to="/invoices/new" style={{ textDecoration: 'none' }}>
          <div className="action-card">
            <h3><i className="fas fa-plus"></i> Create Invoice</h3>
          </div>
          </Link>
          <Link to="/invoiceupload" style={{ textDecoration: 'none' }}>
            <div className="action-card">
              <h3><i className="fas fa-upload"></i> Upload Invoice</h3>
            </div>
          </Link>
          <Link to="/invoicevalidation" style={{ textDecoration: 'none' }}>
            <div className="action-card">
              <h3><i className="fas fa-check-square"></i> Validate Invoice</h3>
            </div>
          </Link>
          <Link to="/invoicesending" style={{ textDecoration: 'none' }}>
            <div className="action-card">
              <h3><i className="fas fa-paper-plane"></i> Send Invoice</h3>
            </div>
          </Link>
        </div>
  
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Total Outstanding</h4>
            <h2>$12,345.00</h2>
          </div>
          {/* <div className="summary-card">
            <h4>Overdue Invoices</h4>
            <h2>12</h2>
          </div> */}
          <div className="summary-card">
            <h4>Paid This Month</h4>
            <h2>$10,789.00</h2>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;