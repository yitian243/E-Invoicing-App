import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Contacts.css';
import Sidebar from './Sidebar';

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedContact, setSelectedContact] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    type: 'client',
    city: '',
    street: '',
    postcode: '',
    taxNumber: '',
    notes: '',
    lastInteraction: ''
  });
  const [errors, setErrors] = useState({
    taxNumber: ''
  });


  const validateTaxNumber = (taxNumber) => {
    // Check if it's exactly 9 digits
    const isValid = /^\d{9}$/.test(taxNumber);
    return {
      isValid,
      message: isValid ? '' : 'Tax number must be exactly 9 digits'
    };
  };

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/contact/getContacts');
        if (!response.ok) {
          throw new Error('Failed to fetch contacts');
        }
  
        const { data } = await response.json();
        setContacts(data);
        setFilteredContacts(data);
      } catch (error) {
        console.error('Error fetching contacts:', error);
      } finally {
      }
    };
  
    fetchContacts();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    let filtered = [...contacts];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.name.toLowerCase().includes(term) ||
        (contact.company && contact.company.toLowerCase().includes(term)) ||
        (contact.email && contact.email.toLowerCase().includes(term))
      );
    }
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(contact => contact.type === filterType);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'company':
          comparison = (a.company || '').localeCompare(b.company || '');
          break;
        case 'lastInteraction':
          comparison = new Date(a.lastInteraction || 0) - new Date(b.lastInteraction || 0);
          break;
        case 'invoiceCount':
          comparison = (a.invoiceCount || 0) - (b.invoiceCount || 0);
          break;
        case 'totalValue':
          comparison = (a.totalValue || 0) - (b.totalValue || 0);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    setFilteredContacts(filtered);
  }, [contacts, searchTerm, filterType, sortBy, sortOrder]);

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

  // Open contact modal for adding new contact
  const openAddContactModal = () => {
    setFormMode('add');
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      type: 'client',
      city: '',
      street: '',
      postcode: '',
      taxNumber: '',
      notes: '',
      lastInteraction: new Date().toISOString().split('T')[0],
      invoiceCount: 0,
      totalValue: 0
    });
    setShowModal(true);
  };

  // Open contact modal for editing
  const openEditContactModal = (contact) => {
    setFormMode('edit');
    setFormData({
      ...contact,
      lastInteraction: contact.lastInteraction ? new Date(contact.lastInteraction).toISOString().split('T')[0] : ''
    });
    setShowModal(true);
  };

  // Close contact modal
  const closeModal = () => {
    setShowModal(false);
  };

  // View contact details
  const viewContactDetails = (contact) => {
    setSelectedContact(contact);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Special validation for tax number
    if (name === 'taxNumber') {
      const validation = validateTaxNumber(value);
      setErrors({
        ...errors,
        taxNumber: validation.message
      });
    }
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate tax number before submission
    const taxValidation = validateTaxNumber(formData.taxNumber);
    if (!taxValidation.isValid) {
      setErrors({
        ...errors,
        taxNumber: taxValidation.message
      });
      return; // Prevent form submission
    }

    const url = formMode === 'add' 
      ? 'http://localhost:5000/api/contact/create' // POST route for adding contact
      : `http://localhost:5000/api/contact/update/${formData.id}`; // PUT route for updating contact
  
    try {
      // Sending the data to the backend
      const response = await fetch(url, {
        method: formMode === 'add' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData), // Send the formData as the request body
      });
  
      if (!response.ok) {
        throw new Error('Failed to save contact');
      }
  
      // If adding, get the new contact from the backend
      const { data } = await response.json();
  
      if (formMode === 'add') {
        // Add new contact to state if it's an 'add' request
        setContacts([...contacts, data]);
      } else {
        // Update existing contact in state
        setContacts(contacts.map(contact => contact.id === data.id ? data : contact));
        setSelectedContact(null);
      }
  
      // Close modal after submit
      closeModal();
    } catch (error) {
      console.error('Error handling submit:', error);
      alert('An error occurred while saving the contact.');
    }
  };
  

  const handleDeleteContact = async (id) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        // Send DELETE request to the backend to delete the contact
        const response = await fetch(`http://localhost:5000/api/contact/delete/${id}`, {
          method: 'DELETE',
        });
  
        if (!response.ok) {
          throw new Error('Failed to delete the contact');
        }
  
        // Remove the contact from local state
        const updatedContacts = contacts.filter(contact => contact.id !== id);
        setContacts(updatedContacts);
  
        // Close contact details if the deleted contact was selected
        if (selectedContact && selectedContact.id === id) {
          setSelectedContact(null);
        }
      } catch (error) {
        console.error('Error deleting contact:', error);
        alert('Failed to delete the contact');
      }
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <main className="main-content">
        <div className="top-header">
          <h1>Contacts</h1>
          <button className="btn-primary" onClick={openAddContactModal}>
            <i className="fas fa-plus"></i> Add Contact
          </button>
        </div>
        
        <div className="contacts-container">
          <div className="contacts-sidebar">
            <div className="search-filter">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-options">
                <button
                  className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filterType === 'client' ? 'active' : ''}`}
                  onClick={() => setFilterType('client')}
                >
                  Clients
                </button>
                <button
                  className={`filter-btn ${filterType === 'vendor' ? 'active' : ''}`}
                  onClick={() => setFilterType('vendor')}
                >
                  Vendors
                </button>
                <button
                  className={`filter-btn ${filterType === 'other' ? 'active' : ''}`}
                  onClick={() => setFilterType('other')}
                >
                  Other
                </button>
              </div>
            </div>
            
            <div className="contacts-list">
              {filteredContacts.length === 0 ? (
                <div className="no-contacts">
                  <i className="fas fa-users"></i>
                  <p>No contacts found</p>
                  <button className="btn-primary" onClick={openAddContactModal}>
                    Add Your First Contact
                  </button>
                </div>
              ) : (
                <table className="contacts-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('name')}>
                        Name <i className={`fas ${getSortIcon('name')}`}></i>
                      </th>
                      <th onClick={() => handleSort('company')}>
                        Company <i className={`fas ${getSortIcon('company')}`}></i>
                      </th>
                      <th onClick={() => handleSort('lastInteraction')} className="hide-mobile">
                        Last Interaction <i className={`fas ${getSortIcon('lastInteraction')}`}></i>
                      </th>
                      <th onClick={() => handleSort('invoiceCount')} className="hide-mobile">
                        Invoices <i className={`fas ${getSortIcon('invoiceCount')}`}></i>
                      </th>
                      <th onClick={() => handleSort('totalValue')} className="hide-mobile">
                        Total Value <i className={`fas ${getSortIcon('totalValue')}`}></i>
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map(contact => (
                      <tr 
                        key={contact.id} 
                        className={selectedContact && selectedContact.id === contact.id ? 'selected' : ''}
                        onClick={() => viewContactDetails(contact)}
                      >
                        <td>{contact.name}</td>
                        <td>{contact.company || '-'}</td>
                        <td className="hide-mobile">{formatDate(contact.lastInteraction)}</td>
                        <td className="hide-mobile">{contact.invoiceCount || 0}</td>
                        <td className="hide-mobile">${(contact.totalValue || 0).toFixed(2)}</td>
                        <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="action-btn edit-btn" 
                            onClick={() => openEditContactModal(contact)}
                            title="Edit Contact"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button 
                            className="action-btn delete-btn" 
                            onClick={() => handleDeleteContact(contact.id)}
                            title="Delete Contact"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          
          <div className="contact-details-panel">
            {selectedContact ? (
              <div className="contact-details">
                <div className="contact-header">
                  <div className="contact-avatar">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="contact-info">
                    <h2>{selectedContact.name}</h2>
                    <p>{selectedContact.company || ''}</p>
                    <span className={`contact-type type-${selectedContact.type}`}>
                      {selectedContact.type.charAt(0).toUpperCase() + selectedContact.type.slice(1)}
                    </span>
                  </div>
                </div>
                
                <div className="contact-body">
                  <div className="info-section">
                    <h3>Contact Information</h3>
                    <div className="info-row">
                      <div className="info-label">
                        <i className="fas fa-envelope"></i> Email
                      </div>
                      <div className="info-value">
                        {selectedContact.email || 'No email provided'}
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">
                        <i className="fas fa-phone"></i> Phone
                      </div>
                      <div className="info-value">
                        {selectedContact.phone || 'No phone provided'}
                      </div>
                    </div>

                    <div className="info-row">
                      <div className="info-label">
                        <i className="fas fa-map-marker-alt"></i> Address
                      </div>
                      <div className="info-value">
                        {selectedContact.street || selectedContact.city || selectedContact.postcode ? (
                          <>
                            {selectedContact.street && <div>{selectedContact.street}</div>}
                            {selectedContact.city && <div>{selectedContact.city}</div>}
                            {selectedContact.postcode && <div>{selectedContact.postcode}</div>}
                          </>
                        ) : (
                          'No address provided'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="info-row">
                    <div className="info-label">
                      <i className="fas fa-id-card"></i> Tax Number
                    </div>
                    <div className="info-value">
                      {selectedContact.taxNumber || 'No tax number provided'}
                    </div>
                  </div>
                  
                  
                  <div className="info-section">
                    <h3>Business Information</h3>
                    <div className="info-row">
                      <div className="info-label">
                        <i className="fas fa-calendar-alt"></i> Last Interaction
                      </div>
                      <div className="info-value">
                        {formatDate(selectedContact.lastInteraction)}
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">
                        <i className="fas fa-file-invoice-dollar"></i> Invoices
                      </div>
                      <div className="info-value">
                        {selectedContact.invoiceCount || 0}
                      </div>
                    </div>
                    <div className="info-row">
                      <div className="info-label">
                        <i className="fas fa-money-bill-wave"></i> Total Value
                      </div>
                      <div className="info-value">
                        ${(selectedContact.totalValue || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  
                  {selectedContact.notes && (
                    <div className="info-section">
                      <h3>Notes</h3>
                      <div className="notes-content">
                        {selectedContact.notes}
                      </div>
                    </div>
                  )}
                  
                  <div className="contact-actions">
                    <button className="btn-primary" onClick={() => openEditContactModal(selectedContact)}>
                      <i className="fas fa-edit"></i> Edit Contact
                    </button>
                    <Link to="/invoices/new" className="btn-secondary">
                      <i className="fas fa-file-invoice"></i> Create Invoice
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-contact-selected">
                <div className="placeholder-icon">
                  <i className="fas fa-user-circle"></i>
                </div>
                <h3>No Contact Selected</h3>
                <p>Select a contact from the list to view details</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Contact Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="contact-modal">
            <div className="modal-header">
              <h2>{formMode === 'add' ? 'Add New Contact' : 'Edit Contact'}</h2>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="company">Company</label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="phone">Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="type">Contact Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="client">Client</option>
                    <option value="vendor">Vendor</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="lastInteraction">Last Interaction</label>
                  <input
                    type="date"
                    id="lastInteraction"
                    name="lastInteraction"
                    value={formData.lastInteraction}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
          
                <div className="form-group">
                  <label htmlFor="street">Street Name</label>
                  <input
                    type="text"
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="postcode">Postcode</label>
                  <input
                    type="text"
                    id="postcode"
                    name="postcode"
                    value={formData.postcode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="taxNumber">Tax Number</label>
                <input
                  type="text"
                  id="taxNumber"
                  name="taxNumber"
                  value={formData.taxNumber}
                  onChange={handleInputChange}
                  required
                  maxlength="9"
                  pattern="\d{9}" // HTML5 pattern validation
                  title="Tax number must be exactly 9 digits"

                />
                {errors.taxNumber && (
                  <div className="error-message">{errors.taxNumber}</div>
                )}
              </div>
              
              <div className="form-group full-width">
                <label htmlFor="notes">Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {formMode === 'add' ? 'Add Contact' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contacts;