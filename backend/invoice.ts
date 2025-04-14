import { Request, Response, Router, NextFunction } from 'express';
// import validator from 'validator';
import { 
    getData, 
    setData, 
    Invoice,
    InvoiceItem,
    getInvoices
} from './dataStore.js';

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
            client, 
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
        if (!client || !clientCity || !clientStreet || !clientPostCode || 
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
            client,
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
        skeleton.BuyerName = client;
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
  
    // If invoice not found, return error response
    if (invoiceIndex === -1) {
      res.status(404).json(createErrorResponse('Invoice not found', 404));
      return;
    }
  
    // Remove the invoice from the invoices array
    data.invoices.splice(invoiceIndex, 1);
  
    // Save the updated data
    setData(data);
  
    // Send a 204 status code indicating successful deletion with no content
    res.sendStatus(204);
});



export default router;