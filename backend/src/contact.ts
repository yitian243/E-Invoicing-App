import { Request, Response, Router } from 'express';

import {
    Contact,
    getData,
    getContacts,
    getClients,
    setData
} from './dataStore';

// Initialize router
const router = Router();

/**
 * Helper function to create consistent error responses
 * @param message Error message
 * @param statusCode HTTP status code
 * @returns Formatted error response
 */
const createErrorResponse = (message: string, statusCode: number) => {
    return {
      error: message,
      code: statusCode
    };
  };

/**
 * Route to add a new contact (Client, Vendor, or Other)
 * @route POST /api/contact/create
 */
router.post('/create', (req: Request, res: Response) => {
  const {
    name,
    type,
    company = '',
    email,
    phone = '',
    city,
    street,
    postcode,
    taxNumber,
    notes = '',
    lastInteraction,
    invoiceCount,
    totalValue,
  } = req.body;

  console.log(type)
  // Validate required fields
  if (!name || !type || !email || !city || !street || !postcode || !taxNumber) {
    return res.status(400).json({ error: 'Missing required contact data' });
  }
  if (!['client', 'vendor', 'other'].includes(type)) {
    return res.status(400).json({ error: 'Contact type must be Client, Vendor, or Other' });
  }
  // Validate tax number (exactly 9 digits)
  if (!/^\d{9}$/.test(taxNumber)) {
    return res.status(400).json({ error: 'Tax number must be exactly 9 digits' });
  }

  const data = getData();
  const newId = data.contactsTotal + 1;

  const newContact = {
    id: newId,
    name,
    type,
    company,
    email,
    phone,
    lastInteraction,  // given through frontend
    city,
    street,
    postcode,
    taxNumber,
    notes,
    invoiceCount,
    totalValue
  };

  data.contacts.push(newContact);
  data.contactsTotal += 1;
  setData(data);
  console.log(data.contacts)
  res.status(201).json({
    success: true,
    data: newContact
  });
});

/**
 * Route to get contacts
 * @route GET /api/contact/getContacts
 */
router.get('/getContacts', (req: Request, res: Response): void => {
    const contacts = getContacts();
    res.status(200).json({
        success: true,
        data: contacts,
    });
});

/**
 * Route to get clients
 * @route GET /api/contact/getContacts
 */
router.get('/getContacts', (req: Request, res: Response): void => {
  const clients = getClients();
  res.status(200).json({
      success: true,
      data: clients,
  });
});

/**
 * Route to delete a contact by ID
 * @route DELETE /api/contacts/delete/:id
 * @param {number} req.params.id - The ID of the contact to delete
 * @returns {void} - Empty response with status code 204
 */
router.delete('/delete/:id', (req: Request, res: Response): void => {
  const contactId = parseInt(req.params.id, 10);

  // Retrieve data from the data store
  const data = getData();

  // Find the index of the contact with the given ID
  const contactIndex = data.contacts.findIndex(contact => contact.id === contactId);

  // If contact not found, return error response
  if (contactIndex === -1) {
    res.status(404).json({ error: 'Contact not found' });
    return;
  }

  // Remove the contact from the contacts array
  data.contacts.splice(contactIndex, 1);

  // Save the updated data
  setData(data);

  // Send a 204 status code indicating successful deletion with no content
  res.sendStatus(204);
});

/**
 * Route to update a contact by ID
 * @route PUT /api/contact/update/:id
 * @param {number} req.params.id - The ID of the contact to update
 * @param {Contact} req.body - The contact data to update
 * @returns {Contact} - The updated contact
 */
router.put('/update/:id', (req: Request, res: Response) => {
  // Validate ID parameter
  const contactId = parseInt(req.params.id, 10);
  if (isNaN(contactId)) {
    return res.status(400).json({ 
      error: 'Invalid contact ID',
      field: 'id'
    });
  }

  // Validate request body exists
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ 
      error: 'Request body must be a valid contact object' 
    });
  }

  const {
    name,
    type,
    taxNumber,
    email,
    city,
    street,
    postcode,
    // Optional fields
    company = '',
    phone = '',
    notes = '',
    lastInteraction,
    invoiceCount,
    totalValue
  } = req.body;

  // Validate required fields if they're being updated
  if (name !== undefined && !name) {
    return res.status(400).json({ 
      error: 'Name cannot be empty',
      field: 'name'
    });
  }

  if (type !== undefined) {
    if (!['client', 'vendor', 'other'].includes(type)) {
      return res.status(400).json({ 
        error: 'Contact type must be Client, Vendor, or Other',
        field: 'type'
      });
    }
  }

  if (taxNumber !== undefined) {
    // Validate tax number format
    if (typeof taxNumber !== 'string' || !/^\d{9}$/.test(taxNumber.trim())) {
      return res.status(400).json({ 
        error: 'Tax number must be exactly 9 digits',
        field: 'taxNumber'
      });
    }
  }

  if (email !== undefined && !email) {
    return res.status(400).json({ 
      error: 'Email cannot be empty',
      field: 'email'
    });
  }

  // Validate address components if any are provided
  if (city !== undefined && !city) {
    return res.status(400).json({ 
      error: 'City cannot be empty',
      field: 'city'
    });
  }

  if (street !== undefined && !street) {
    return res.status(400).json({ 
      error: 'Street cannot be empty',
      field: 'street'
    });
  }

  if (postcode !== undefined && !postcode) {
    return res.status(400).json({ 
      error: 'Postcode cannot be empty',
      field: 'postcode'
    });
  }

  // Retrieve contacts data
  const data = getData();

  // Find the contact to update
  const contactIndex = data.contacts.findIndex(contact => contact.id === contactId);
  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Contact not found' });
  }

  // Create updated contact object
  const updatedContact = { 
    ...data.contacts[contactIndex], 
    ...req.body,
    // Ensure taxNumber is trimmed if provided
    ...(taxNumber !== undefined ? { taxNumber: taxNumber.trim() } : {})
  };

  // Update the contact in the array
  data.contacts[contactIndex] = updatedContact;

  // Save updated data back to storage
  setData(data);

  // Return the updated contact
  return res.status(200).json({ 
    success: true,
    data: updatedContact 
  });
});

export default router;
