import { Request, Response, Router } from 'express';
import { supabaseAdmin } from './db';

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
router.post('/create', async (req: Request, res: Response) => {
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
    user_id, // Added user_id parameter
  } = req.body;

  // Validate required fields
  if (!name || !type || !email || !city || !street || !postcode || !taxNumber || !user_id) {
    return res.status(400).json({ error: 'Missing required contact data' });
  }
  if (!['client', 'vendor', 'other'].includes(type)) {
    return res.status(400).json({ error: 'Contact type must be Client, Vendor, or Other' });
  }
  // Validate tax number (exactly 9 digits)
  if (!/^\d{9}$/.test(taxNumber)) {
    return res.status(400).json({ error: 'Tax number must be exactly 9 digits' });
  }

  try {
    // Find the business where the user is an admin
    const { data: memberData, error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('business_id')
      .eq('user_id', user_id)
      .eq('role', 'admin');

    if (memberError || !memberData || memberData.length === 0) {
      return res.status(403).json({ error: 'User is not an admin of any business' });
    }

    // Use the first business where the user is an admin
    const business_id = memberData[0].business_id;

    // Create contact in supabaseAdmin with the business_id
    const { data: newContact, error } = await supabaseAdmin
      .schema('business')
      .from('contacts')
      .insert({
        name,
        type,
        company,
        email,
        phone,
        last_interaction: lastInteraction || new Date().toISOString(),
        city,
        street,
        postcode,
        tax_number: taxNumber,
        notes,
        invoice_count: 0,
        total_value: 0,
        business_id // Add the business_id to the contact
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating contact:', error);
      return res.status(500).json({ error: 'Failed to create contact' });
    }

    res.status(201).json({
      success: true,
      data: newContact
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    return res.status(500).json({ error: 'Failed to create contact' });
  }
});

/**
 * Route to get all contacts
 * @route GET /api/contact/getContacts
 */
router.get('/getContacts', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user_id from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    const userId = userData.user.id;
    
    // Find businesses where user is a member
    const { data: memberData, error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('business_id')
      .eq('user_id', userId);
    
    if (memberError || !memberData || memberData.length === 0) {
      res.status(403).json({ error: 'User is not a member of any business' });
      return;
    }
    
    // Get all business IDs where user is a member
    const businessIds = memberData.map(member => member.business_id);
    
    // Get contacts for these businesses
    const { data: contacts, error } = await supabaseAdmin
      .schema('business')
      .from('contacts')
      .select('*')
      .in('business_id', businessIds);

    if (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
      return;
    }

    res.status(200).json({
      success: true,
      data: contacts,
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * Route to get clients only
 * @route GET /api/contact/getClients
 */
router.get('/getClients', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user_id from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    const userId = userData.user.id;
    
    // Find businesses where user is a member
    const { data: memberData, error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('business_id')
      .eq('user_id', userId);
    
    if (memberError || !memberData || memberData.length === 0) {
      res.status(403).json({ error: 'User is not a member of any business' });
      return;
    }
    
    // Get all business IDs where user is a member
    const businessIds = memberData.map(member => member.business_id);
    
    // Get clients for these businesses
    const { data: clients, error } = await supabaseAdmin
      .schema('business')
      .from('contacts')
      .select('*')
      .eq('type', 'client')
      .in('business_id', businessIds);

    if (error) {
      console.error('Error fetching clients:', error);
      res.status(500).json({ error: 'Failed to fetch clients' });
      return;
    }

    res.status(200).json({
      success: true,
      data: clients,
    });
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

/**
 * Route to delete a contact by ID
 * @route DELETE /api/contacts/delete/:id
 * @param {string} req.params.id - The ID of the contact to delete
 * @returns {void} - Empty response with status code 204
 */
router.delete('/delete/:id', async (req: Request, res: Response): Promise<void> => {
  const contactId = req.params.id;

  try {
    // Get user_id from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    const userId = userData.user.id;
    
    // Find businesses where user is a member
    const { data: memberData, error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('business_id')
      .eq('user_id', userId);
    
    if (memberError || !memberData || memberData.length === 0) {
      res.status(403).json({ error: 'User is not a member of any business' });
      return;
    }
    
    // Get all business IDs where user is a member
    const businessIds = memberData.map(member => member.business_id);

    // Check if contact exists and belongs to one of the user's businesses
    const { data: contact, error: checkError } = await supabaseAdmin
      .schema('business')
      .from('contacts')
      .select('id, business_id')
      .eq('id', contactId)
      .in('business_id', businessIds)
      .single();

    if (checkError || !contact) {
      res.status(404).json({ error: 'Contact not found or you do not have permission to delete it' });
      return;
    }

    // Delete the contact
    const { error: deleteError } = await supabaseAdmin
      .schema('business').from('contacts')
      .delete()
      .eq('id', contactId);

    if (deleteError) {
      console.error('Error deleting contact:', deleteError);
      res.status(500).json({ error: 'Failed to delete contact' });
      return;
    }

    // Send a 204 status code indicating successful deletion with no content
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

/**
 * Route to update a contact by ID
 * @route PUT /api/contact/update/:id
 * @param {string} req.params.id - The ID of the contact to update
 * @param {Contact} req.body - The contact data to update
 * @returns {Contact} - The updated contact
 */
router.put('/update/:id', async (req: Request, res: Response) => {
  // Validate ID parameter
  const contactId = req.params.id;

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
    lastInteraction
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

  try {
    // Get user_id from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    const userId = userData.user.id;
    
    // Find businesses where user is a member
    const { data: memberData, error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('business_id')
      .eq('user_id', userId);
    
    if (memberError || !memberData || memberData.length === 0) {
      res.status(403).json({ error: 'User is not a member of any business' });
      return;
    }
    
    // Get all business IDs where user is a member
    const businessIds = memberData.map(member => member.business_id);
    
    // Check if contact exists and belongs to one of the user's businesses
    const { data: contact, error: checkError } = await supabaseAdmin
      .schema('business')
      .from('contacts')
      .select('*')
      .eq('id', contactId)
      .in('business_id', businessIds)
      .single();

    if (checkError || !contact) {
      return res.status(404).json({ error: 'Contact not found or you do not have permission to update it' });
      return;
    }

    // Prepare update data
    const updateData = {
      ...(name !== undefined && { name }),
      ...(type !== undefined && { type }),
      ...(company !== undefined && { company }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
      ...(city !== undefined && { city }),
      ...(street !== undefined && { street }),
      ...(postcode !== undefined && { postcode }),
      ...(taxNumber !== undefined && { tax_number: taxNumber.trim() }),
      ...(notes !== undefined && { notes }),
      ...(lastInteraction !== undefined && { last_interaction: lastInteraction }),
      updated_at: new Date().toISOString()
    };

    // Update the contact
    const { data: updatedContact, error: updateError } = await supabaseAdmin
      .schema('business')
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating contact:', updateError);
      return res.status(500).json({ error: 'Failed to update contact' });
    }

    // Return the updated contact
    return res.status(200).json({ 
      success: true,
      data: updatedContact 
    });
  } catch (error) {
    console.error('Error updating contact:', error);
    return res.status(500).json({ error: 'Failed to update contact' });
  }
});

export default router;
