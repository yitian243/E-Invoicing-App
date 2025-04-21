import { BACKEND_PORT } from './config';

const SERVER_URL = `http://localhost:${BACKEND_PORT}`;
const API_PREFIX = '/api/invoice';

/**
 * Get contacts for the current user's business
 */
export async function getContactsForInvoiceRequest(token: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/contacts`, {
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
    console.error('Get contacts for invoice request failed:', error);
    return 500;
  }
}

/**
 * Create a new invoice
 */
export async function createInvoiceRequest(token: string, invoiceData: {
  contactId: string;
  clientName: string;
  clientCity: string;
  clientStreet: string;
  clientPostCode: string;
  clientEmail: string;
  clientTaxNumber: string;
  issueDate: string;
  dueDate: string;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
  }[];
  notes?: string;
  terms?: string;
}) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(invoiceData),
    });

    const data = await response.json();

    if (!response.ok) {
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
export async function deleteInvoiceRequest(token: string, id: string) {
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
    console.error('Delete invoice request failed:', error);
    return 500;
  }
}

/**
 * Get all invoices
 */
export async function getInvoicesRequest(token: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/get`, {
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

    return data; // Return the invoice data
  } catch (error) {
    console.error('Get invoices request failed:', error);
    return 500; // Return a server error if something goes wrong
  }
}

/**
 * Validate an invoice
 */
export async function validateInvoiceRequest(token: string, invoiceId: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/${invoiceId}/validate`, {
      method: 'POST',
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
    console.error('Validate invoice request failed:', error);
    return 500;
  }
}

/**
 * Send an invoice via email
 */
export async function sendInvoiceRequest(token: string, invoiceId: string, sendOptions: {
  method: string;
  recipients: string;
  cc?: string;
  bcc?: string;
  subject: string;
  message: string;
  includeAttachment?: boolean;
  includePaymentLink?: boolean;
  scheduleTime?: string;
  autoReminders?: boolean;
  reminderDays?: number;
}) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/${invoiceId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(sendOptions),
    });

    const data = await response.json();

    if (!response.ok) {
      return response.status;
    }

    return data;
  } catch (error) {
    console.error('Send invoice request failed:', error);
    return 500;
  }
}
