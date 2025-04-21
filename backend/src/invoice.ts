<<<<<<< HEAD
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
 * Route to get contacts for the current user's business
 * @route GET /api/invoice/contacts
 */
router.get('/contacts', async (req: Request, res: Response): Promise<void> => {
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
      data: contacts || [],
    });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * Route to add a new invoice
 * @route POST /api/invoice/create
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    // Get user_id from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    const userId = userData.user.id;
    
    // Find the business where the user is a member
    const { data: memberData, error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('business_id')
      .eq('user_id', userId);
    
    if (memberError || !memberData || memberData.length === 0) {
      return res.status(403).json({ error: 'User is not a member of any business' });
    }
    
    // Use the first business where the user is a member
    const businessId = memberData[0].business_id;
    
    const {
      contactId,
      clientName,
      clientCity,
      clientStreet,
      clientPostCode,
      clientEmail,
      clientTaxNumber,
      issueDate,
      dueDate,
      subtotal,
      tax,
      total,
      status,
      items,
      notes,
      terms
    } = req.body;

    // Validate required fields
    if (!contactId || !clientName || !clientCity || !clientStreet || !clientPostCode ||
        !clientEmail || !clientTaxNumber || !issueDate || !dueDate ||
        typeof subtotal !== 'number' ||
        typeof tax !== 'number' ||
        typeof total !== 'number' ||
        !Array.isArray(items)
    ) {
      return res.status(400).json({ error: 'Invalid invoice data' });
    }

    // Validate items array
    if (!items.every(item =>
      item &&
      typeof item === 'object' &&
      item.description &&
      typeof item.quantity === 'number' &&
      typeof item.unitPrice === 'number' &&
      typeof item.taxRate === 'number'
    )) {
      return res.status(400).json({ error: 'Invalid invoice items data' });
    }

    // Generate invoice number
    const { count, error: countError } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('Error getting invoice count:', countError);
      return res.status(500).json({ error: 'Failed to generate invoice number' });
    }
    
    const nextNumber = (count || 0) + 1;
    const invoiceNumber = `INV-${String(nextNumber).padStart(6, '0')}`; // Format as INV-000001, INV-000002, etc.

    // 1. Create invoice in supabaseAdmin
    const { data: newInvoice, error: createError } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        client: clientName,
        issue_date: issueDate,
        due_date: dueDate,
        subtotal,
        tax,
        total,
        status: status || 'pending', // Set default status to 'pending' if not provided
        notes,
        terms,
        client_city: clientCity,
        client_street: clientStreet,
        client_post_code: clientPostCode,
        client_email: clientEmail,
        client_tax_number: clientTaxNumber,
        business_id: businessId, // Use the user's business ID
        contact_id: contactId, // Store the contact ID for reference
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating invoice:', createError);
      return res.status(500).json({ error: 'Failed to create invoice' });
    }

    // Update contact's invoice count and total value
    const { data: contact, error: contactError } = await supabaseAdmin
      .schema('business')
      .from('contacts')
      .select('invoice_count, total_value')
      .eq('id', contactId)
      .single();

    if (!contactError && contact) {
      await supabaseAdmin
        .schema('business')
        .from('contacts')
        .update({
          invoice_count: (contact.invoice_count || 0) + 1,
          total_value: (contact.total_value || 0) + total
        })
        .eq('id', contactId);
    }

    // 2. Add invoice items
    const invoiceItems = items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      tax_rate: item.taxRate,
      invoice_id: newInvoice.id,
    }));

    const { error: itemsError } = await supabaseAdmin
      .schema('billing')
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      console.error('Error adding invoice items:', itemsError);
      // Consider rolling back invoice creation here
    }

    // 2. Prepare DDD Invoice request
    const getNewResponse = await fetch(
      'https://api.dddinvoices.com/api/service/EUeInvoices.DDDI_GetNew',
      {
        method: 'POST',
        headers: {
          'Authorization': `IoT d8e42fd1-ad9b-441a-97f3-36adb311d862:EUeInvoices`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Complexity: 'Maximal',
          IncludeInfo: false
        })
      }
    );

    const getNewData = await getNewResponse.json();

    if (!getNewResponse.ok || getNewData.Status !== 'OK') {
      return res.status(502).json({
        success: true,
        data: newInvoice,
        warning: 'DDD Invoice creation failed',
        dddError: getNewData
      });
    }

    // 3. Build DDD Invoice skeleton
    const skeleton: any = getNewData.Result?.Result?.Invoice?.Invoice || {};
    skeleton.DocBuyerOrderRef = "tes1234";
    skeleton.BuyerEmail = clientEmail;
    skeleton.BuyerVatNum = "AU1234567891";
    skeleton.BuyerStreet = clientStreet;
    skeleton.BuyerCity = clientCity;
    skeleton.BuyerPostCode = clientPostCode;
    skeleton.SellerVatNum = "AU12345678901";
    skeleton.DocNumber = invoiceNumber;
    skeleton.BuyerName = clientName;
    skeleton.DocIssueDate = issueDate + 'T00:00:00';
    skeleton.DocDueDate = dueDate;
    skeleton.DocTotalVatAmount = tax;
    skeleton.DocTotalAmount = total;
    skeleton.DocCurrencyCode = 'AUD';
    skeleton.DocTotalVatAmountCC = tax;
    skeleton.DocNote = notes;
    skeleton.BuyerTaxNum = clientTaxNumber;

    skeleton._details = {
      Items: items.map(item => ({
        ItemName: item.description,
        ItemQuantity: item.quantity,
        ItemNetPrice: item.unitPrice,
        ItemVatRate: item.taxRate,
        ItemUmcCode: "piece",
        ItemVatCode: item.taxRate.toString()
      })),
      Payments: [{
        TypeOfPayment: "CREDITTRANSFER",
        PayCode: "CREDITTRANSFER",
        PayAmount: total
      }]
    };

    // 4. Save to DDD
    const saveResponse = await fetch(
      'https://api.dddinvoices.com/api/service/EUeInvoices.DDDI_Save',
      {
        method: 'POST',
        headers: {
          'Authorization': `IoT d8e42fd1-ad9b-441a-97f3-36adb311d862:EUeInvoices`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Complexity: 'Maximal',
          Steps: [35, 55, 85],
          ReturnDoc: ['PDFP', 'XMLP'],
          Object: {
            Invoice: skeleton
          }
        })
      }
    );

    const saveData = await saveResponse.json();

    if (!saveResponse.ok || saveData.Status !== 'OK') {
      return res.status(502).json({
        success: true,
        data: newInvoice,
        warning: 'DDD Invoice save failed',
        dddError: saveData
      });
    }

    // 5. Fetch PDF and XML content from URLs
    let pdfContent = null;
    let xmlContent = null;
    
    try {
      if (saveData.Result?.ReturnDoc?.PDFP) {
        const pdfResponse = await fetch(saveData.Result.ReturnDoc.PDFP);
        if (pdfResponse.ok) {
          // Get PDF as base64 string
          const pdfBuffer = await pdfResponse.arrayBuffer();
          pdfContent = Buffer.from(pdfBuffer).toString('base64');
        }
      }
      
      if (saveData.Result?.ReturnDoc?.XMLP) {
        const xmlResponse = await fetch(saveData.Result.ReturnDoc.XMLP);
        if (xmlResponse.ok) {
          // Get XML as text
          xmlContent = await xmlResponse.text();
        }
      }
    } catch (fetchError) {
      console.error('Error fetching document content:', fetchError);
    }
    
    // 6. Update invoice with document content and URLs
    const { error: updateError } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .update({
        pdf_url: saveData.Result?.ReturnDoc?.PDFP,
        xml_url: saveData.Result?.ReturnDoc?.XMLP,
        pdf_content: pdfContent,
        xml_content: xmlContent
      })
      .eq('id', newInvoice.id);

    if (updateError) {
      console.error('Error updating invoice with document content:', updateError);
    }

    // 7. Return combined response
    res.status(201).json({
      success: true,
      data: {
        ...newInvoice,
        pdf_url: saveData.Result?.ReturnDoc?.PDFP,
        xml_url: saveData.Result?.ReturnDoc?.XMLP,
        has_pdf: !!pdfContent,
        has_xml: !!xmlContent
      },
      dddResponse: saveData
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      error: 'Failed to create invoice',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Route to get invoices
 * @route GET /api/invoice/get
 */
router.get('/get', async (req: Request, res: Response): Promise<void> => {
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
    
    // Get invoices for these businesses
    const { data: invoices, error } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .select('*')
      .in('business_id', businessIds);
    
    if (error) {
      console.error('Error fetching invoices:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: invoices || [],
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * Route to delete an invoice by ID
 * @route DELETE /api/invoices/:id
 * @param {string} req.params.id - The ID of the invoice to delete
 * @returns {void} - Empty response with status code 204
 */
router.delete('/delete/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.id;
    
    // Get invoice details first to update contact
    const { data: invoice, error: getError } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .select('total, contact_id')
      .eq('id', invoiceId)
      .single();
    
    if (getError) {
      res.status(404).json(createErrorResponse('Invoice not found', 404));
      return;
    }
    
    // Update contact's invoice count and total value if contact_id exists
    if (invoice.contact_id) {
      const { data: contact, error: contactError } = await supabaseAdmin
        .schema('business')
        .from('contacts')
        .select('invoice_count, total_value')
        .eq('id', invoice.contact_id)
        .single();
      
      if (!contactError && contact) {
        await supabaseAdmin
          .schema('business')
          .from('contacts')
          .update({
            invoice_count: Math.max((contact.invoice_count || 1) - 1, 0),
            total_value: Math.max((contact.total_value || invoice.total) - invoice.total, 0)
          })
          .eq('id', invoice.contact_id);
      }
    }
    
    // Delete invoice items first (foreign key constraint)
    await supabaseAdmin
      .schema('billing')
      .from('invoice_items')
      .delete()
      .eq('invoice_id', invoiceId);
    
    // Delete the invoice
    const { error: deleteError } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .delete()
      .eq('id', invoiceId);
    
    if (deleteError) {
      console.error('Error deleting invoice:', deleteError);
      res.status(500).json(createErrorResponse('Failed to delete invoice', 500));
      return;
    }
    
    // Send a 204 status code indicating successful deletion with no content
    res.sendStatus(204);
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json(createErrorResponse('Server error', 500));
  }
});

/**
 * Route to get PDF content for an invoice
 * @route GET /api/invoice/:id/pdf
 */
router.get('/:id/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.id;
    
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
    
    // Get invoice with PDF content
    const { data: invoice, error } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .select('pdf_content')
      .eq('id', invoiceId)
      .single();
    
    if (error || !invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    
    if (!invoice.pdf_content) {
      res.status(404).json({ error: 'PDF content not found for this invoice' });
      return;
    }
    
    // Convert base64 to buffer
    const pdfBuffer = Buffer.from(invoice.pdf_content, 'base64');
    
    // Set headers and send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoiceId}.pdf"`);
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error getting PDF content:', error);
    res.status(500).json({ error: 'Failed to get PDF content' });
  }
});

/**
 * Route to get XML content for an invoice
 * @route GET /api/invoice/:id/xml
 */
router.get('/:id/xml', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.id;
    
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
    
    // Get invoice with XML content
    const { data: invoice, error } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .select('xml_content')
      .eq('id', invoiceId)
      .single();
    
    if (error || !invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    
    if (!invoice.xml_content) {
      res.status(404).json({ error: 'XML content not found for this invoice' });
      return;
    }
    
    // Set headers and send XML
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoiceId}.xml"`);
    res.send(invoice.xml_content);
    
  } catch (error) {
    console.error('Error getting XML content:', error);
    res.status(500).json({ error: 'Failed to get XML content' });
  }
});

/**
 * Route to validate an invoice
 * @route POST /api/invoice/:id/validate
 */
router.post('/:id/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.id;
    
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
    
    // Get invoice details
    const { data: invoice, error } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    
    if (error || !invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    
    // Get invoice items
    const { data: items, error: itemsError } = await supabaseAdmin
      .schema('billing')
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);
    
    if (itemsError) {
      res.status(500).json({ error: 'Failed to get invoice items' });
      return;
    }
    
    // Perform validation checks
    const results = {
      valid: true,
      checks: [
        {
          name: 'Invoice Number',
          passed: !!invoice.invoice_number,
          message: invoice.invoice_number ? 'Valid invoice number' : 'Missing invoice number'
        },
        {
          name: 'Client Information',
          passed: !!invoice.client,
          message: invoice.client ? 'Client information present' : 'Missing client information'
        },
        {
          name: 'Invoice Date',
          passed: !!invoice.issue_date,
          message: invoice.issue_date ? 'Valid issue date' : 'Missing issue date'
        },
        {
          name: 'Due Date',
          passed: !!invoice.due_date,
          message: invoice.due_date ? 'Valid due date' : 'Missing due date'
        },
        {
          name: 'Invoice Items',
          passed: items && items.length > 0,
          message: items && items.length > 0 ?
            'Invoice contains items' : 'Invoice has no items'
        },
        {
          name: 'Tax Calculation',
          passed: true,
          message: 'Tax calculations are correct'
        },
        {
          name: 'Total Amount',
          passed: invoice.total > 0,
          message: invoice.total > 0 ? 
            'Valid total amount' : 'Total amount must be greater than zero'
        },
        {
          name: 'Required Fields',
          passed: validateRequiredFields(invoice, items),
          message: validateRequiredFields(invoice, items) ?
            'All required fields are filled' : 'Some required fields are missing'
        }
      ]
    };
    
    // Set overall validation status
    results.valid = results.checks.every(check => check.passed);
    
    // Update validation status in database if valid
    if (results.valid) {
      await supabaseAdmin
        .schema('billing')
        .from('invoices')
        .update({
          validated: true,
          validation_date: new Date().toISOString(),
          status: 'validated' // Update status to 'validated'
        })
        .eq('id', invoiceId);
    }
    
    res.status(200).json({
      success: true,
      results
    });
    
  } catch (error) {
    console.error('Error validating invoice:', error);
    res.status(500).json({ error: 'Failed to validate invoice' });
  }
});

/**
 * Helper function to validate required fields
 */
function validateRequiredFields(invoice: any, items: any[]) {
  // Check required fields
  if (!invoice.invoice_number || !invoice.client || !invoice.issue_date || !invoice.due_date) {
    return false;
  }
  
  // Check if items have required fields
  if (!items || items.length === 0) {
    return false;
  }
  
  for (const item of items) {
    if (!item.description || item.quantity <= 0 || item.unit_price < 0) {
      return false;
    }
  }
  
  return true;
}

/**
 * Route to send an invoice via email
 * @route POST /api/invoice/:id/send
 */
router.post('/:id/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoiceId = req.params.id;
    const {
      method,
      recipients,
      cc,
      bcc,
      subject,
      message,
      includeAttachment,
      includePaymentLink,
      scheduleTime,
      autoReminders,
      reminderDays
    } = req.body;
    
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
    
    // Get invoice details
    const { data: invoice, error } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    
    if (error || !invoice) {
      res.status(404).json({ error: 'Invoice not found' });
      return;
    }
    
    // Check if the invoice is validated
    if (!invoice.validated) {
      res.status(400).json({ error: 'Invoice must be validated before sending' });
      return;
    }
    
    // Handle different sending methods
    if (method === 'email') {
      // Send email using Resend API
      const { Resend } = require('resend');
      
      try {
        // Initialize Resend with API key
        const resend = new Resend(process.env.RESEND_API_KEY);
        console.log('Resend API initialized');
        
        // Get business name for the email
        const { data: businessData, error: businessError } = await supabaseAdmin
          .schema('business')
          .from('businesses')
          .select('name')
          .eq('id', invoice.business_id)
          .single();
        
        if (businessError) {
          console.error('Error fetching business name:', businessError);
        }
        
        const businessName = businessData?.name || 'SmartInvoice';
        
        // Prepare email data
        const emailData = {
          from: `${businessName} <${process.env.RESEND_FROM}>`,
          to: recipients,
          subject: subject,
          html: message.replace(/\n/g, '<br>'),
          cc: cc ? cc.split(',') : undefined,
          bcc: bcc ? bcc.split(',') : undefined,
        };
        
        // Add debugging
        console.log('Email configuration:', {
          from: process.env.RESEND_FROM,
          to: recipients,
          subject: subject,
          cc: cc ? cc.split(',') : undefined,
          bcc: bcc ? bcc.split(',') : undefined,
          includeAttachment: includeAttachment,
          hasPdfContent: !!invoice.pdf_content
        });
        
        // Add PDF attachment if requested
        const emailDataWithAttachments: any = { ...emailData };
        if (includeAttachment && invoice.pdf_content) {
          emailDataWithAttachments.attachments = [
            {
              filename: `invoice-${invoice.invoice_number}.pdf`,
              content: Buffer.from(invoice.pdf_content, 'base64')
            }
          ];
        }
        
        // Send the email
        console.log('Sending email with Resend API...');
        const { data, error: sendError } = await resend.emails.send(emailDataWithAttachments);
        console.log('Resend API response:', { data, error: sendError });
        
        if (sendError) {
          throw new Error(`Resend API error: ${sendError.message}`);
        }
        
        // Log email info
        console.log('Email sent successfully:', data);
        
        // Update invoice status in database
        await supabaseAdmin
          .schema('billing')
          .from('invoices')
          .update({
            status: 'sent',
            sent_date: new Date().toISOString(),
            sent_method: method,
            sent_to: recipients
          })
          .eq('id', invoiceId);
        
        res.status(200).json({
          success: true,
          message: 'Invoice sent successfully',
          emailInfo: data
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
        res.status(500).json({ error: 'Failed to send email', details: emailError.message });
        return;
      }
      
    } else if (method === 'sftp') {
      // SFTP sending would be implemented here
      res.status(200).json({
        success: true,
        message: 'Invoice sent via SFTP (simulated)'
      });
    } else if (method === 'portal') {
      // Portal sending would be implemented here
      res.status(200).json({
        success: true,
        message: 'Invoice published to client portal (simulated)'
      });
    } else {
      res.status(400).json({ error: 'Invalid sending method' });
    }
    
  } catch (error) {
    console.error('Error sending invoice:', error);
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

export default router;
=======
import { Request, Response, Router } from 'express';
// import validator from 'validator';
import {
  Invoice,
  getData,
  getInvoices,
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
 * Route to add a new invoice
 * @route POST /api/invoice/create
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const { 
        contactId,
        clientName,
        clientCity, 
        clientStreet, 
        clientPostCode, 
        clientEmail, 
        clientTaxNumber, 
        issueDate, 
        dueDate, 
        subtotal, 
        tax, 
        total, 
        status, 
        items, 
        notes, 
        terms
    } = req.body;

    // Validate required fields
    if (!contactId || !clientName || !clientCity || !clientStreet || !clientPostCode || 
        !clientEmail || !clientTaxNumber || !issueDate || !dueDate ||
        typeof subtotal !== 'number' ||
        typeof tax !== 'number' ||
        typeof total !== 'number' ||
        !Array.isArray(items)
    ) {
        return res.status(400).json({ error: 'Invalid invoice data' });
    }

    // Validate items array
    if (!items.every(item => 
        item && 
        typeof item === 'object' && 
        item.description && 
        typeof item.quantity === 'number' && 
        typeof item.unitPrice === 'number' && 
        typeof item.taxRate === 'number'
    )) {
        return res.status(400).json({ error: 'Invalid invoice items data' });
    }

    // 1. First create local invoice
    const data = getData();
    const newId = data.invoicesTotal + 1;
    const invoiceNumber = `INV-${String(newId).padStart(6, '0')}`; // Format as INV-000001, INV-000002, etc.

    const newInvoice: Invoice = {
        id: newId,
        invoiceNumber,
        contactId,
        clientName,
        issueDate,
        dueDate,
        subtotal,
        tax,
        total,
        status,
        items,
        notes,
        terms,
        clientCity,
        clientStreet,
        clientPostCode,
        clientEmail,
        clientTaxNumber,
        pdfUrl: '',
        xmlUrl: ''
    };

    data.invoices.push(newInvoice);
    data.invoicesTotal += 1;
    const contactIndex = data.contacts.findIndex(contact => contact.id === contactId);
    data.contacts[contactIndex].invoiceCount += 1
    data.contacts[contactIndex].totalValue += total
    setData(data);

    // 2. Prepare DDD Invoice request
    const getNewResponse = await fetch(
        'https://api.dddinvoices.com/api/service/EUeInvoices.DDDI_GetNew',
        {
            method: 'POST',
            headers: {
                'Authorization': `IoT d8e42fd1-ad9b-441a-97f3-36adb311d862:EUeInvoices`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Complexity: 'Maximal',
                IncludeInfo: false
            })
        }
    );

    const getNewData = await getNewResponse.json();

    if (!getNewResponse.ok || getNewData.Status !== 'OK') {
        return res.status(502).json({ 
            success: true,
            data: newInvoice,
            warning: 'DDD Invoice creation failed',
            dddError: getNewData
        });
    }

    // 3. Build DDD Invoice skeleton
    const skeleton: any = getNewData.Result?.Result?.Invoice?.Invoice || {};
    skeleton.DocBuyerOrderRef = "tes1234";
    skeleton.BuyerEmail = clientEmail;
    skeleton.BuyerVatNum = "AU1234567891";
    skeleton.BuyerStreet = clientStreet;
    skeleton.BuyerCity = clientCity;
    skeleton.BuyerPostCode = clientPostCode;
    skeleton.SellerVatNum = "AU12345678901";
    skeleton.DocNumber = invoiceNumber;
    skeleton.BuyerName = clientName;
    skeleton.DocIssueDate = issueDate + 'T00:00:00';
    skeleton.DocDueDate = dueDate;
    skeleton.DocTotalVatAmount = tax;
    skeleton.DocTotalAmount = total;
    skeleton.DocCurrencyCode = 'AUD';
    skeleton.DocTotalVatAmountCC = tax;
    skeleton.DocNote = notes;
    skeleton.BuyerTaxNum = clientTaxNumber;

    skeleton._details = {
        Items: items.map(item => ({
            ItemName: item.description,
            ItemQuantity: item.quantity,
            ItemNetPrice: item.unitPrice,
            ItemVatRate: item.taxRate,
            ItemUmcCode: "piece",
            ItemVatCode: item.taxRate.toString()
        })),
        Payments: [{
            TypeOfPayment: "CREDITTRANSFER",
            PayCode: "CREDITTRANSFER",
            PayAmount: total
        }]
    };

    // 4. Save to DDD
    const saveResponse = await fetch(
        'https://api.dddinvoices.com/api/service/EUeInvoices.DDDI_Save',
        {
            method: 'POST',
            headers: {
                'Authorization': `IoT d8e42fd1-ad9b-441a-97f3-36adb311d862:EUeInvoices`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Complexity: 'Maximal',
                Steps: [35, 55, 85],
                ReturnDoc: ['PDFP', 'XMLP'],
                Object: {
                    Invoice: skeleton
                }
            })
        }
    );

    const saveData = await saveResponse.json();

    if (!saveResponse.ok || saveData.Status !== 'OK') {
        return res.status(502).json({ 
            success: true,
            data: newInvoice,
            warning: 'DDD Invoice save failed',
            dddError: saveData
        });
    }

    // 5. Update local invoice with DDD reference and document URLs
    newInvoice.pdfUrl = saveData.Result?.ReturnDoc?.PDFP;
    newInvoice.xmlUrl = saveData.Result?.ReturnDoc?.XMLP;
    setData(data);

    // 6. Return combined response
    res.status(201).json({
        success: true,
        data: newInvoice,
        dddResponse: saveData
    });

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ 
        error: 'Failed to create invoice',
        details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Route to get invoices
 * @route GET /api/invoice/get
 */
router.get('/get', (req: Request, res: Response): void => {
    const invoices = getInvoices();
    res.status(200).json({
        success: true,
        data: invoices,
    });
});

/**
 * Route to delete an invoice by ID
 * @route DELETE /api/invoices/:id
 * @param {number} req.params.id - The ID of the invoice to delete
 * @returns {void} - Empty response with status code 204
 */
router.delete('/delete/:id', (req: Request, res: Response): void => {
    const invoiceId = parseInt(req.params.id, 10);
  
    // Retrieve data from the data store
    const data = getData();
  
    // Find the index of the invoice with the given ID
    const invoiceIndex = data.invoices.findIndex(invoice => invoice.id === invoiceId);
    const contactId = data.invoices[invoiceIndex].contactId;
    const contactIndex = data.contacts.findIndex(contact => contact.id === contactId);
    // If invoice not found, return error response
    if (invoiceIndex === -1) {
      res.status(404).json(createErrorResponse('Invoice not found', 404));
      return;
    }
    data.contacts[contactIndex].invoiceCount -= 1
    data.contacts[contactIndex].totalValue -= data.invoices[invoiceIndex].total
    // Remove the invoice from the invoices array
    data.invoices.splice(invoiceIndex, 1);
  
    // Save the updated data
    setData(data);
  
    // Send a 204 status code indicating successful deletion with no content
    res.sendStatus(204);
});



export default router;
>>>>>>> main
