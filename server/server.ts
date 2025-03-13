import cors from 'cors';
import express, { Request, Response } from 'express';


// NOTE: you may modify these interfaces
interface Student {
  id: number;
  name: string;
}

interface InvoiceSummary {
  id: number;
  invoiceName: string;
  members: number[];
}

interface Invoice {
  id: number;
  invoiceName: string;
  members: Student[];
}

// In-memory storage of invoices, invoice summaries and students
let invoices: Invoice[] = []; // Storage for Invoices
let invoiceSummaries: InvoiceSummary[] = []; // Storage for Invoices
let newInvoiceId = 1; // Auto-Incrementing ID

let students: Student[] = []; // Storage for Students
let newStudentId = 1; // Auto-Incrementing ID

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
  // Response array containing summary of invoices
  res.json(invoiceSummaries);

  // (sample response below)
  // res.json([
  //   {
  //     id: 1,
  //     invoiceName: 'Invoice 1',
  //     members: [1, 2, 4],
  //   },
  //   {
  //     id: 2,
  //     invoiceName: 'Invoice 2',
  //     members: [3, 5],
  //   },
  // ]);
});

/**
 * Route to get all students
 * @route GET /api/students
 * @returns {Array} - Array of student objects
 */
app.get('/api/students', (req: Request, res: Response) => {
  // Response array containing all students
  res.json(students);

  // (sample response below)
  // res.json([
  //   { id: 1, name: 'Alice' },
  //   { id: 2, name: 'Bob' },
  //   { id: 3, name: 'Charlie' },
  //   { id: 4, name: 'David' },
  //   { id: 5, name: 'Eve' },
  // ]);
});

/**
 * Route to add a new invoice
 * @route POST /api/invoices
 * @param {string} req.body.invoiceName - The name of the invoice
 * @param {Array} req.body.members - Array of member names
 * @returns {Object} - The created invoice object
 */
app.post('/api/invoices', (req: Request, res: Response) => {
  // TODO: implement storage of a new invoice and return their info (sample response below)
  const { invoiceName, members } = req.body;

  // Edge case - Invalid Input(s)
  if (!invoiceName || !Array.isArray(members)) {
    res.status(400).json({error: 'Invalid Input'})
  }

  // Create temp student ID array for new invoice and invoice summary
  let studentIDs: number[] = [];
  let studentArray: Student[] = [];

  // Adds all invoice members to students array
  for (const member of members) {
    const currID: number = newStudentId++;  // Retrieve and increment student IDs
    studentIDs.push(currID);

    const newStudent: Student = {
      id: currID,
      name: member,
    };
    
    studentArray.push(newStudent)
    students.push(newStudent);
  }

  // Retrieve and increment invoice IDs
  const currInvoiceID: number = newInvoiceId++;

  // Creates and adds invoice to invoices array
  const newInvoice: Invoice = {
    id: currInvoiceID,
    invoiceName: invoiceName,
    members: studentArray,
  }

  invoices.push(newInvoice);

  // Creates invoice summary and returns as json response
  const newInvoiceSummary: InvoiceSummary = {
    id: currInvoiceID,
    invoiceName: invoiceName,
    members: studentIDs,
  }

  invoiceSummaries.push(newInvoiceSummary);
  
  res.json(newInvoiceSummary);

  // (sample response below)
  // res.json({
  //   id: 3,
  //   invoiceName: 'New Invoice',
  //   members: [1, 2],
  // });
});

/**
 * Route to delete a invoice by ID
 * @route DELETE /api/invoices/:id
 * @param {number} req.params.id - The ID of the invoice to delete
 * @returns {void} - Empty response with status code 204
 */
app.delete('/api/invoices/:id', (req: Request, res: Response) => {
  // Retrieve desired invoice id
  const invoiceId = parseInt(req.params.id, 10);
  
  // Deletes the invoice with the specified id
  let indexRemove: number = -1;
  let index = 0;
  for (const invoice of invoices) {
    if (invoice.id == invoiceId) {
      indexRemove = index;
      break;
    }
    index++;
  }

  // Remove invoice from invoices and invoices summary array
  invoices.splice(indexRemove, 1);
  invoiceSummaries.splice(indexRemove, 1);
  
  // Returns error when invoice does not exist
  if (indexRemove == -1) {
    res.status(404).send("Invoice not found");
  }

  res.sendStatus(204); // send back a 204 (do not modify this line)
});

/**
 * Route to get a invoice by ID (for fetching invoice members)
 * @route GET /api/invoices/:id
 * @param {number} req.params.id - The ID of the invoice to retrieve
 * @returns {Object} - The invoice object with member details
 */
app.get('/api/invoices/:id', (req: Request, res: Response) => {
  // Retrieve desired invoice id
  const invoiceId = parseInt(req.params.id, 10);
  
  let invoiceFound = false;
  let returnInvoice: Invoice = {
    id: 0,
    invoiceName: '',
    members: []
  };

  for (const invoice of invoices) {
    if (invoice.id == invoiceId) {
      invoiceFound = true;
      returnInvoice = invoice;
      break;
    }
  }

  if (!invoiceFound) {
    res.status(404).send("Invoice not found");
  } else {
    res.json(returnInvoice);
  }

  // (sample response below)
  // res.json({
  //   id: 1,
  //   invoiceName: 'Invoice 13',
  //   members: [
  //     { id: 1, name: 'Alice' },
  //     { id: 2, name: 'Bob' },
  //     { id: 3, name: 'Charlie' },
  //   ],
  // });
  /* TODO:
   * if (invoice id isn't valid) {
   *   res.status(404).send("Invoice not found");
   * }
   */
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
