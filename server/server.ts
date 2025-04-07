import cors from 'cors';
import express from 'express';
import { Request, Response } from 'express';
import {
  Business,
  User,
  Invoice,
  InvoiceItem,
  // Payment,
  // Contact,
  CreateInvoiceRequest,
  ErrorResponse,
} from './types';

// temp storage
let invoices: Invoice[] = [];
let users: User[] = [];
let businesses: Business[] = [];

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());

/**
 * Route to get all invoices
 * @route GET /api/invoices
 * @returns {Array} - Array of invoice objects
 */
app.get('/api/invoices', (req: Request, res: Response) => {
  res.json(invoices);
});

/**
 * Route to get all students
 * @route GET /api/students
 * @returns {Array} - Array of student objects
 */
app.get('/api/students', (req: Request, res: Response) => {
  res.json(users);
});

/**
 * Route to get all businesses
 * @route GET /api/businesses
 * @returns {Array} - Array of student objects
 */
app.get('/api/businesses', (req: Request, res: Response) => {
  res.json(businesses);
});

/**
 * Route to add a new invoice
 * @route POST /api/invoices
 * @param {string} req.body.invoiceName - The name of the invoice
 * @param {Array} req.body.members - Array of member names
 * @returns {Object} - The created invoice object
 */
app.post('/api/invoices', (req: Request, res: Response) => {
  const invoiceData: CreateInvoiceRequest = req.body;

  // Input validation
  if (!invoiceData.business_id || !invoiceData.issuerBusinessId || 
      !invoiceData.recipientBusinessId || !invoiceData.items || 
      !Array.isArray(invoiceData.items) || invoiceData.items.length === 0) {
    const errorResponse: ErrorResponse = {
      error: 'Invalid input - missing required fields',
      code: 400
    };
    res.status(400).json(errorResponse);
  }

  // Calculate subtotal, tax amount and total amount
  let subTotal = 0;
  let taxAmount = 0;
  const invoiceItems: InvoiceItem[] = [];

  // Process each invoice item
  for (let i = 0; i < invoiceData.items.length; i++) {
    const item = invoiceData.items[i];
    const itemAmount = item.quantity * item.unitPrice;
    const itemTaxAmount = itemAmount * (item.taxRate / 100);
    const itemTotalAmount = itemAmount + itemTaxAmount;
    
    subTotal += itemAmount;
    taxAmount += itemTaxAmount;

    // Create InvoiceItem
    const newInvoiceItem: InvoiceItem = {
      id: i + 1, // Simple ID generation for demo
      invoiceId: 0, // Will be updated after invoice creation
      quantity: item.quantity,
      description: item.description,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
      amount: itemAmount,
      taxAmount: itemTaxAmount,
      totalAmount: itemTotalAmount
    };
    
    invoiceItems.push(newInvoiceItem);
  }

  const invoiceNumber = invoices.length + 1;

  // Create new invoice
  const newInvoice: Invoice = {
    invoice_id: invoiceNumber,
    business_id: invoiceData.business_id,
    notes: invoiceData.notes || '',
    status: 'draft', // Default status
    number: invoiceNumber,
    issuerBusinessId: invoiceData.issuerBusinessId,
    recipientBusinessId: invoiceData.recipientBusinessId,
    creatorUserId: invoiceData.creatorUserId,
    issueDate: invoiceData.issueDate,
    dueDate: invoiceData.dueDate,
    subTotal: subTotal,
    taxAmount: taxAmount,
    totalAmount: subTotal + taxAmount,
    terms: invoiceData.terms || 'Net 30',
    sentDate: null,
    paidDate: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Add to invoices array
  invoices.push(newInvoice);
  
  // Update invoice IDs for all items
  invoiceItems.forEach(item => {
    item.invoiceId = newInvoice.invoice_id;
  });
  
  // Return the created invoice with items
  res.status(201).json({
    success: true,
    data: {
      invoice: newInvoice,
      items: invoiceItems
    }
  });
});


/**
 * Route to delete an invoice by ID
 * @route DELETE /api/invoices/:id
 * @param {number} req.params.id - The ID of the invoice to delete
 * @returns {void} - Empty response with status code 204
 */
app.delete('/api/invoices/:id', (req: Request, res: Response) => {
  // Retrieve desired invoice id
  const invoiceId = parseInt(req.params.id, 10);
  
  // Find the index of the invoice with the specified id
  const indexToRemove = invoices.findIndex(invoice => invoice.invoice_id === invoiceId);

  // If invoice found, remove it from the invoices array
  if (indexToRemove !== -1) {
    invoices.splice(indexToRemove, 1);
    res.sendStatus(204); // No content response
  } else {
    res.status(404).json({
      error: 'Invoice not found',
      code: 404
    });
  }
});

/**
 * Route to get an invoice by ID
 * @route GET /api/invoices/:id
 * @param {number} req.params.id - The ID of the invoice to retrieve
 * @returns {Object} - The invoice object or error if not found
 */
app.get('/api/invoices/:id', (req: Request, res: Response) => {
  const invoiceId = parseInt(req.params.id, 10);
  const invoice = invoices.find(inv => inv.invoice_id === invoiceId);

  if (!invoice) {
    res.status(404).json({ error: 'Invoice not found', code: 404 });
  }

  res.json(invoice);
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});