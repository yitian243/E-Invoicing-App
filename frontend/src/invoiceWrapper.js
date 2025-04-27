import { BACKEND_URL } from './components/config';

const API_PREFIX = '/api/invoice';

/**
 * Get contacts for the current user's business
 */
export async function getContactsForInvoiceRequest(token) {
  try {
    
    if (!token) {
      console.error('No token provided to getContactsForInvoiceRequest');
      return 401;
    }
    
    const response = await fetch(`${BACKEND_URL}${API_PREFIX}/contacts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    
    const data = await response.json();

    if (!response.ok) {
      console.error('Error response from server:', data);
      return response.status;
    }

    return data;
  } catch (error) {
    console.error('Get contacts for invoice request failed:', error);
    return 500;
  }
}

/**
 * Create a new invoice
 */
export async function createInvoiceRequest(token, invoiceData) {
  try {
    
    if (!token) {
      console.error('No token provided to createInvoiceRequest');
      return 401;
    }
    
    const response = await fetch(`${BACKEND_URL}${API_PREFIX}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(invoiceData),
    });
    
    const data = await response.json();

    if (!response.ok) {
      console.error('Error response from server:', data);
      return response.status;
    }

    return data;
  } catch (error) {
    console.error('Create invoice request failed:', error);
    return 500;
  }
}

/**
 * Delete an invoice by ID
 */
export async function deleteInvoiceRequest(token, id) {
  try {
    const response = await fetch(`${BACKEND_URL}${API_PREFIX}/delete/${id}`, {
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
    console.error('Delete invoice request failed:', error);
    return 500;
  }
}

/**
 * Get all invoices
 */
export async function getInvoicesRequest(token) {
  try {
    
    if (!token) {
      console.error('No token provided to getInvoicesRequest');
      return 401;
    }
    
    const response = await fetch(`${BACKEND_URL}${API_PREFIX}/get`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    
    const data = await response.json();

    if (!response.ok) {
      console.error('Error response from server:', data);
      return response.status;
    }

    // Transform snake_case to camelCase for frontend
    if (data.data && Array.isArray(data.data)) {
      data.data = data.data.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoice_number,
        client: invoice.client,
        issueDate: invoice.issue_date,
        dueDate: invoice.due_date,
        subtotal: invoice.subtotal,
        tax: invoice.tax,
        total: invoice.total,
        status: invoice.status || (invoice.validated ? 'validated' : 'pending'),
        notes: invoice.notes,
        terms: invoice.terms,
        clientCity: invoice.client_city,
        clientStreet: invoice.client_street,
        clientPostCode: invoice.client_post_code,
        clientEmail: invoice.client_email,
        clientTaxNumber: invoice.client_tax_number,
        businessId: invoice.business_id,
        contactId: invoice.contact_id,
        pdf_url: invoice.pdf_url,
        xml_url: invoice.xml_url,
        pdf_content: invoice.pdf_content,
        xml_content: invoice.xml_content,
        validated: invoice.validated,
        validationDate: invoice.validation_date,
        sentDate: invoice.sent_date,
        sentMethod: invoice.sent_method,
        sentTo: invoice.sent_to,
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at
      }));
    }

    return data; // Return the transformed invoice data
  } catch (error) {
    console.error('Get invoices request failed:', error);
    return 500; // Return a server error if something goes wrong
  }
}
