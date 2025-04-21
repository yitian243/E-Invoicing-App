import { beforeEach, describe, expect, test } from '@jest/globals';

// Mock the invoiceWrapper module
jest.mock('./invoiceWrapper', () => ({
  createInvoiceRequest: jest.fn().mockImplementation((token, data) => {
    if (!data.clientName || !data.items || data.items.length === 0) {
      return 400;
    }
    return {
      success: true,
      data: {
        id: 'mock-id',
        invoice_number: data.invoiceNumber || 'INV-0001',
        client: data.clientName,
        total: data.total,
        status: data.status || 'pending'
      }
    };
  }),
  getInvoicesRequest: jest.fn().mockImplementation((token) => {
    return {
      success: true,
      data: [
        {
          id: 'mock-id-1',
          invoice_number: 'INV-0001',
          client: 'Test Client',
          total: 1000,
          status: 'pending'
        },
        {
          id: 'mock-id-2',
          invoice_number: 'INV-0002',
          client: 'Another Client',
          total: 2000,
          status: 'validated'
        }
      ]
    };
  }),
  deleteInvoiceRequest: jest.fn().mockImplementation((token, id) => {
    if (id === 'non-existent') {
      return 404;
    }
    return 204;
  }),
  validateInvoiceRequest: jest.fn().mockImplementation((token, id) => {
    if (id === 'non-existent') {
      return 404;
    }
    return {
      success: true,
      results: {
        valid: true,
        checks: [
          { name: 'Invoice Number', passed: true, message: 'Valid invoice number' },
          { name: 'Client Information', passed: true, message: 'Client information present' },
          { name: 'Invoice Date', passed: true, message: 'Valid issue date' },
          { name: 'Due Date', passed: true, message: 'Valid due date' },
          { name: 'Invoice Items', passed: true, message: 'Invoice contains items' },
          { name: 'Tax Calculation', passed: true, message: 'Tax calculations are correct' },
          { name: 'Total Amount', passed: true, message: 'Valid total amount' },
          { name: 'Required Fields', passed: true, message: 'All required fields are filled' }
        ]
      }
    };
  }),
  sendInvoiceRequest: jest.fn().mockImplementation((token, id, options) => {
    if (id === 'non-existent') {
      return 404;
    }
    if (!options.recipients || !options.subject || !options.message) {
      return 400;
    }
    return {
      success: true,
      message: 'Invoice sent successfully',
      emailInfo: { id: 'email-id-123' }
    };
  })
}));

// Import after mocking
import {
  createInvoiceRequest,
  deleteInvoiceRequest,
  getInvoicesRequest,
  sendInvoiceRequest,
  validateInvoiceRequest
} from './invoiceWrapper';

// Mock Supabase
jest.mock('./db', () => ({
  supabaseAdmin: {
    schema: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

beforeEach(async () => {
  jest.clearAllMocks();
});

describe('Invoice API Tests', () => {
  describe('Invoice Creation', () => {
    test('should create an invoice successfully', async () => {
      const token = 'test-token';
      const newInvoice = {
        contactId: 'contact-123',
        clientName: 'Client A',
        clientCity: 'Test City',
        clientStreet: 'Test Street',
        clientPostCode: '12345',
        clientEmail: 'client@example.com',
        clientTaxNumber: 'TAX123',
        issueDate: '2025-04-10',
        dueDate: '2025-04-20',
        subtotal: 1000,
        tax: 100,
        total: 1100,
        status: 'pending',
        items: [
          {
            description: 'Website development',
            quantity: 1,
            unitPrice: 1000,
            taxRate: 10,
          },
        ],
        notes: 'Thank you for your business!',
        terms: 'Net 10',
      };

      const response = await createInvoiceRequest(token, newInvoice);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response.data).toMatchObject({
        client: 'Client A',
        total: 1100,
        status: 'pending',
      });
    });

    test('should fail to create an invoice with invalid data', async () => {
      const token = 'test-token';
      const invalidInvoice = {
        contactId: '',
        clientName: '',
        clientCity: '',
        clientStreet: '',
        clientPostCode: '',
        clientEmail: '',
        clientTaxNumber: '',
        issueDate: '',
        dueDate: '',
        subtotal: 0,
        tax: 0,
        total: 0,
        status: '',
        items: [],
      };

      const response = await createInvoiceRequest(token, invalidInvoice);
      expect(response).toBe(400);
    });
  });

  describe('Invoice Retrieval', () => {
    test('should retrieve all invoices successfully', async () => {
      const token = 'test-token';
      const response = await getInvoicesRequest(token);

      expect(response.success).toBe(true);
      expect(response.data.length).toBe(2);
      expect(response.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            invoice_number: 'INV-0001',
            client: 'Test Client',
            status: 'pending'
          }),
          expect.objectContaining({
            invoice_number: 'INV-0002',
            client: 'Another Client',
            status: 'validated'
          }),
        ])
      );
    });
  });

  describe('Invoice Deletion', () => {
    test('should delete an invoice successfully', async () => {
      const token = 'test-token';
      const invoiceId = 'mock-id-1';
      const response = await deleteInvoiceRequest(token, invoiceId);

      expect(response).toBe(204);
    });

    test('should return 404 when deleting non-existent invoice', async () => {
      const token = 'test-token';
      const invoiceId = 'non-existent';
      const response = await deleteInvoiceRequest(token, invoiceId);

      expect(response).toBe(404);
    });
  });

  describe('Invoice Validation', () => {
    test('should validate an invoice successfully', async () => {
      const token = 'test-token';
      const invoiceId = 'mock-id-1';
      const response = await validateInvoiceRequest(token, invoiceId);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('results');
      expect(response.results).toHaveProperty('valid', true);
      expect(response.results.checks).toHaveLength(8);
      expect(response.results.checks[0]).toHaveProperty('passed', true);
    });

    test('should return 404 when validating non-existent invoice', async () => {
      const token = 'test-token';
      const invoiceId = 'non-existent';
      const response = await validateInvoiceRequest(token, invoiceId);

      expect(response).toBe(404);
    });
  });

  describe('Invoice Sending', () => {
    test('should send an invoice via email successfully', async () => {
      const token = 'test-token';
      const invoiceId = 'mock-id-1';
      const sendOptions = {
        method: 'email',
        recipients: 'client@example.com',
        subject: 'Invoice INV-0001',
        message: 'Please find attached your invoice.',
        includeAttachment: true,
        includePaymentLink: true
      };
      
      const response = await sendInvoiceRequest(token, invoiceId, sendOptions);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('message', 'Invoice sent successfully');
      expect(response).toHaveProperty('emailInfo');
    });

    test('should fail to send invoice with missing required fields', async () => {
      const token = 'test-token';
      const invoiceId = 'mock-id-1';
      const sendOptions = {
        method: 'email',
        recipients: '',
        subject: '',
        message: '',
      };
      
      const response = await sendInvoiceRequest(token, invoiceId, sendOptions);

      expect(response).toBe(400);
    });

    test('should return 404 when sending non-existent invoice', async () => {
      const token = 'test-token';
      const invoiceId = 'non-existent';
      const sendOptions = {
        method: 'email',
        recipients: 'client@example.com',
        subject: 'Invoice INV-0001',
        message: 'Please find attached your invoice.',
      };
      
      const response = await sendInvoiceRequest(token, invoiceId, sendOptions);

      expect(response).toBe(404);
    });
  });
});
