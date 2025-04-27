import '@fortawesome/fontawesome-free/css/all.min.css';
import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import Business from './components/Business';
import Contacts from './components/Contacts';
import Dashboard from './components/Dashboard';
import InvoiceCreation from './components/InvoiceCreation';
import InvoiceHistory from './components/InvoiceHistory';
import InvoiceSending from './components/InvoiceSending';
import InvoiceUpload from './components/InvoiceUpload';
import InvoiceValidation from './components/InvoiceValidation';
import Login from './components/Login';
import Profile from './components/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import Signup from './components/Signup';
import InvoiceEditing from './components/InvoiceEditing'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/invoices/new" element={<InvoiceCreation />} />
              <Route path="/invoicehistory" element={<InvoiceHistory />} />
              <Route path="/InvoiceValidation" element={<InvoiceValidation />} />
              <Route path="/InvoiceUpload" element={<InvoiceUpload />} />
              <Route path="/InvoiceSending" element={<InvoiceSending />} />
              <Route path="/Profile" element={<Profile />} />
              <Route path="/contacts" element={<Contacts />} />
              <Route path="/business" element={<Business />} />
              <Route path="/invoices/edit" element={<InvoiceEditing />} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
