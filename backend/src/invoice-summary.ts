import express, { Request, Response } from 'express';
import { supabaseAdmin } from './db';

const router = express.Router();

// Get invoice summary for a business (count and total amount)
router.get('/summary/:businessId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessId } = req.params;
    
    // Check if business exists
    const { data: business, error: businessError } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .single();
    
    if (businessError || !business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    // Get invoice count
    const { count: invoiceCount, error: countError } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', businessId);
    
    if (countError) {
      console.error('Error getting invoice count:', countError);
      res.status(500).json({ error: 'Failed to get invoice count' });
      return;
    }
    
    // Get sum of total amounts
    const { data: totalResult, error: sumError } = await supabaseAdmin
      .schema('billing')
      .from('invoices')
      .select('total')
      .eq('business_id', businessId);
    
    if (sumError) {
      console.error('Error getting total amount:', sumError);
      res.status(500).json({ error: 'Failed to get total amount' });
      return;
    }
    
    // Calculate the sum manually as Supabase doesn't have a direct sum function in the client library
    const totalAmount = totalResult?.reduce((sum, invoice) => sum + (invoice.total || 0), 0) || 0;
    
    res.status(200).json({
      invoiceCount: invoiceCount || 0,
      totalAmount: totalAmount
    });
  } catch (error) {
    console.error('Error getting invoice summary:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;