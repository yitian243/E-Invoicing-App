import { BACKEND_PORT } from './config';

const SERVER_URL = `http://localhost:${BACKEND_PORT}`;
const API_PREFIX = '/api/contact';

/**
 * Create a new contact
 */
export async function createContactRequest(token: string, contactData: {
  name: string;
  type: string;
  company?: string;
  email: string;
  phone?: string;
  city: string;
  street: string;
  postcode: string;
  taxNumber: string;
  notes?: string;
  lastInteraction?: string;
  user_id: string; // Added user_id parameter
}) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // Added token for authentication
      },
      body: JSON.stringify(contactData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Create contact request failed:', error);
    return 500;
  }
}

/**
 * Get all contacts
 */
export async function getContactsRequest(token: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/getContacts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Get contacts request failed:', error);
    return 500;
  }
}

/**
 * Get clients only
 */
export async function getClientsRequest(token: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/getClients`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Get clients request failed:', error);
    return 500;
  }
}

/**
 * Delete a contact by ID
 */
export async function deleteContactRequest(token: string, id: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/delete/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      return response.status;
    }
    
    return 204; // Successfully deleted
  } catch (error) {
    console.error('Delete contact request failed:', error);
    return 500;
  }
}

/**
 * Update a contact by ID
 */
export async function updateContactRequest(token: string, id: string, updateData: {
  name?: string;
  type?: string;
  company?: string;
  email?: string;
  phone?: string;
  city?: string;
  street?: string;
  postcode?: string;
  taxNumber?: string;
  notes?: string;
  lastInteraction?: string;
  user_id?: string;
}) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/update/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Update contact request failed:', error);
    return 500;
  }
}
