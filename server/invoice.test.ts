import { describe, test, expect, beforeEach } from '@jest/globals';
import { createInvoiceRequest, deleteInvoiceRequest, getInvoicesRequest } from './invoiceWrapper.js';
import { resetDataStore } from './dataStore.js'; // This should point to clearDataStore function

beforeEach(async () => {

    await resetDataStore();
});

describe('Invoice API Wrapper Tests', () => {
  test('should create an invoice successfully', async () => {
    const newInvoice = {
      invoiceNumber: 'INV-1001',
      client: 'Client A',
      issueDate: '2025-04-10',
      dueDate: '2025-04-20',
      subtotal: 1000,
      tax: 100,
      total: 1100,
      status: 'unpaid',
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

    const response = await createInvoiceRequest(newInvoice);

    expect(response).toHaveProperty('success', true);
    expect(response).toHaveProperty('data');
    expect(response.data).toMatchObject({
      invoiceNumber: 'INV-1001',
      client: 'Client A',
      total: 1100,
      status: 'unpaid',
    });
  });

  test('should fail to create an invoice with invalid data', async () => {
    const invalidInvoice = {
      invoiceNumber: '', // Missing required fields
      client: '',
      issueDate: '',
      dueDate: '',
      subtotal: 'not-a-number',
      tax: 'not-a-number',
      total: 'not-a-number',
      status: '',
      items: [],
    };

    const response = await createInvoiceRequest(invalidInvoice as any);
    expect(response).toBe(400);
  });

  test('should delete an invoice successfully after creation', async () => {
    const invoice = {
      invoiceNumber: 'INV-2001',
      client: 'Client B',
      issueDate: '2025-04-10',
      dueDate: '2025-04-25',
      subtotal: 2000,
      tax: 200,
      total: 2200,
      status: 'unpaid',
      items: [
        {
          description: 'App design',
          quantity: 2,
          unitPrice: 1000,
          taxRate: 10,
        },
      ],
    };

    const created = await createInvoiceRequest(invoice);
    const invoiceId = created?.data?.id;

    const deleteStatus = await deleteInvoiceRequest(invoiceId);
    expect(deleteStatus).toBe(204);
  });

  test('should return 404 when deleting non-existent invoice', async () => {
    const response = await deleteInvoiceRequest(99999); // Arbitrary non-existent ID
    expect(response).toBe(404);
  });
  test('should retrieve all invoices successfully', async () => {
    // Create a couple of invoices to add to the data store
    const invoice1 = {
      invoiceNumber: 'INV-1001',
      client: 'Client A',
      issueDate: '2025-04-10',
      dueDate: '2025-04-20',
      subtotal: 1000,
      tax: 100,
      total: 1100,
      status: 'unpaid',
      items: [
        {
          description: 'Website development',
          quantity: 1,
          unitPrice: 1000,
          taxRate: 10,
        },
      ],
    };

    const invoice2 = {
      invoiceNumber: 'INV-1002',
      client: 'Client B',
      issueDate: '2025-04-11',
      dueDate: '2025-04-21',
      subtotal: 2000,
      tax: 200,
      total: 2200,
      status: 'paid',
      items: [
        {
          description: 'App design',
          quantity: 2,
          unitPrice: 1000,
          taxRate: 10,
        },
      ],
    };

    await createInvoiceRequest(invoice1);
    await createInvoiceRequest(invoice2);

    // Fetch the invoices through the wrapper function
    const response = await getInvoicesRequest();

    // Get the expected invoices directly from the data store
    // const expectedInvoices = getInvoices(); // Assuming this returns the list of invoices from the DB

    expect(response.success).toBe(true);
    expect(response.data.length).toBe(2);
    console.log(response.data);
    expect(response.data).toEqual(
        expect.arrayContaining([
        expect.objectContaining({
            invoiceNumber: 'INV-1001',
            client: 'Client A',
        }),
        expect.objectContaining({
            invoiceNumber: 'INV-1002',
            client: 'Client B',
        }),
        ])
    );
  });

  test('should return an empty list if no invoices are created', async () => {
    // Fetch invoices when none are created
    const response = await getInvoicesRequest();

    expect(response.success).toBe(true);
    expect(response.data).toEqual([]); // Expecting an empty array when no invoices exist
  });
});