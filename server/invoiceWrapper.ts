import { BACKEND_PORT } from './config.js';

const SERVER_URL = `http://localhost:${BACKEND_PORT}`;
const API_PREFIX = '/api/invoice';

/**
 * Create a new invoice
 */
export async function createInvoiceRequest(invoiceData: {
    invoiceNumber: string,
    client: string,
    issueDate: string,
    dueDate: string,
    subtotal: number,
    tax: number,
    total: number,
    status: string,
    items: {
      description: string,
      quantity: number,
      unitPrice: number,
      taxRate: number
    }[],
    notes?: string,
    terms?: string
  }) {
    try {
      const response = await fetch(`${SERVER_URL}${API_PREFIX}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
  export async function deleteInvoiceRequest(id: number) {
    try {
      const response = await fetch(`${SERVER_URL}${API_PREFIX}/delete/${id}`, {
        method: 'DELETE',
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
export async function getInvoicesRequest() {
    try {
      const response = await fetch(`${SERVER_URL}${API_PREFIX}/get`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json', // Optional, but usually a good practice
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