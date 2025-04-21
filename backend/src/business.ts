import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import path from 'path';
import { supabaseAdmin } from './db';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const router = express.Router();

// Helper function to hash passwords
const hashPassword = (password: string): string => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Create a new business
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, tax_id, address, email, default_currency, password, admin_id, admin_name, admin_email } = req.body;
    
    if (!name || !tax_id || !password || !admin_id || !admin_name || !admin_email) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Check if business with the same name already exists
    const { data: existingBusiness, error: checkError } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .select('id')
      .ilike('name', name)
      .single();
    
    if (existingBusiness) {
      res.status(400).json({ error: 'Business with this name already exists' });
      return;
    }
    
    // Create new business with hashed password
    const hashedPassword = hashPassword(password);
    
    // console.log('Creating business with data:', {
    //   name,
    //   tax_id,
    //   address: address || '',
    //   email: email || '',
    //   default_currency: default_currency || 'AUD',
    //   invoice_template: 'default',
    //   admin_id,
    //   password: hashedPassword,
    //   created_at: new Date().toISOString()
    // });
    
    let newBusiness;

    try {
      const { data, error: createError } = await supabaseAdmin
        .schema('business')
        .from('businesses')
        .insert({
          name,
          tax_id,
          address: address || '',
          email: email || '',
          default_currency: default_currency || 'AUD',
          invoice_template: 'default',
          admin_id,
          password: hashedPassword,
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating business:', createError);
        console.error('Error details:', JSON.stringify(createError, null, 2));
        res.status(500).json({ error: 'Failed to create business', details: createError });
        return;
      }
      
      if (!data) {
        console.error('No business data returned after creation');
        res.status(500).json({ error: 'Failed to create business - no data returned' });
        return;
      }
      
      newBusiness = data;
      console.log('Business created successfully:', newBusiness);
    } catch (err) {
      console.error('Exception creating business:', err);
      res.status(500).json({ error: 'Exception creating business', details: err instanceof Error ? err.message : String(err) });
      return;
    }
    
    // Add admin as a member
    const { error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .insert({
        name: admin_name,
        email: admin_email,
        role: 'admin',
        joined_at: new Date().toISOString(),
        business_id: newBusiness.id,
        user_id: admin_id
      });
    
    if (memberError) {
      console.error('Error adding admin as member:', memberError);
      // Consider rolling back business creation here
      res.status(500).json({ error: 'Failed to add admin as member' });
      return;
    }
    
    res.status(201).json(newBusiness);
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join an existing business
router.post('/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessName, password, userId, userName, userEmail } = req.body;
    
    if (!businessName || !password || !userId || !userName || !userEmail) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Find business by name
    const { data: business, error: businessError } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .select('id, password')
      .ilike('name', businessName)
      .single();
    
    if (businessError || !business) {
      res.status(404).json({ error: 'Business not found /join' });
      return;
    }
    
    // Verify password
    const hashedPassword = hashPassword(password);
    if (business.password !== hashedPassword) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }
    
    const businessId = business.id;
    
    // Check if user is already a member
    const { data: existingMember, error: memberCheckError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('id')
      .eq('business_id', businessId)
      .or(`user_id.eq.${userId},email.ilike.${userEmail}`)
      .single();
    
    if (existingMember) {
      res.status(400).json({ error: 'User is already a member of this business' });
      return;
    }
    
    // Add user as member
    const { data: newMember, error: createError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .insert({
        name: userName,
        email: userEmail,
        role: 'staff',
        joined_at: new Date().toISOString(),
        business_id: businessId,
        user_id: userId
      })
      .select()
      .single();
    
    if (createError || !newMember) {
      console.error('Error adding member:', createError);
      res.status(500).json({ error: 'Failed to add member to business' });
      return;
    }
    
    // Update business updated_at timestamp
    await supabaseAdmin
      .schema('business')
      .from('businesses')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', businessId);
    
    // Get updated business
    const { data: updatedBusiness, error: getError } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .single();
    
    if (getError || !updatedBusiness) {
      console.error('Error getting updated business:', getError);
      res.status(200).json({ success: true, member: newMember });
      return;
    }
    
    res.status(200).json(updatedBusiness);
  } catch (error) {
    console.error('Error joining business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get business by ID
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const { data: business, error } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !business) {
      res.status(404).json({ error: 'Business not found get /:id' });
      return;
    }
    
    res.status(200).json(business);
  } catch (error) {
    console.error('Error getting business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get business by user ID (where user is a member)
router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // First get all members for this user
    const { data: members, error: membersError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('business_id')
      .eq('user_id', userId);
    
    if (membersError || !members || members.length === 0) {
      res.status(404).json({ error: 'No businesses found for this user' });
      return;
    }
    
    // Get all business IDs where user is a member
    const businessIds = members.map(member => member.business_id);
    
    // Get all businesses for these IDs
    const { data: businesses, error: businessesError } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .select('*')
      .in('id', businessIds);
    
    if (businessesError || !businesses || businesses.length === 0) {
      res.status(404).json({ error: 'No businesses found for this user' });
      return;
    }
    
    res.status(200).json(businesses);
  } catch (error) {
    console.error('Error getting user businesses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Update an existing business
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, tax_id, address, email, default_currency, password, user_id } = req.body;
    
    if (!name || !tax_id || !password || !user_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    // Check if business exists
    const { data: business, error: checkError } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .select('id, admin_id')
      .eq('id', id)
      .single();
    
    if (checkError || !business) {
      res.status(404).json({ error: 'Business not found /:id' });
      return;
    }
    
    // Check if user is admin of the business
    const { data: member, error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('role')
      .eq('business_id', id)
      .eq('user_id', user_id)
      .eq('role', 'admin')
      .single();
    
    if (memberError || !member) {
      res.status(403).json({ error: 'Only business admin can update business details' });
      return;
    }
    
    // Update business with hashed password
    const hashedPassword = hashPassword(password);
    
    const { data: updatedBusiness, error: updateError } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .update({
        name,
        tax_id,
        address,
        email,
        default_currency,
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError || !updatedBusiness) {
      console.error('Error updating business:', updateError);
      res.status(500).json({ error: 'Failed to update business' });
      return;
    }
    
    res.status(200).json(updatedBusiness);
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all business members
router.get('/:id/members', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    // Check if business exists
    const { data: business, error: businessError } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .select('id')
      .eq('id', id)
      .single();
    
    if (businessError || !business) {
      res.status(404).json({ error: 'Business not found /:id/members' });
      return;
    }
    
    // Get all members for this business
    const { data: members, error: membersError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('*')
      .eq('business_id', id);
    
    if (membersError) {
      console.error('Error getting business members:', membersError);
      res.status(500).json({ error: 'Failed to get business members' });
      return;
    }
    
    res.status(200).json(members || []);
  } catch (error) {
    console.error('Error getting business members:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update member role
router.put('/:businessId/members/:memberId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessId, memberId } = req.params;
    const { role, user_id } = req.body;
    
    if (!role || !['admin', 'staff'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    
    // Check if business exists
    const { data: business, error: businessError } = await supabaseAdmin
      .schema('business')
      .from('businesses')
      .select('id')
      .eq('id', businessId)
      .single();
    
    if (businessError || !business) {
      res.status(404).json({ error: 'Business not found /:businessId/members/:memberId' });
      return;
    }
    
    // Check if user is admin of the business
    const { data: adminCheck, error: adminCheckError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', user_id)
      .eq('role', 'admin')
      .single();
    
    if (adminCheckError || !adminCheck) {
      res.status(403).json({ error: 'Only business admin can update member roles' });
      return;
    }
    
    // Check if member exists
    const { data: member, error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('id')
      .eq('id', memberId)
      .eq('business_id', businessId)
      .single();
    
    if (memberError || !member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    
    // If changing to staff role, make sure there's at least one other admin
    if (role === 'staff') {
      // Check if the member is currently an admin
      const { data: currentRole, error: roleError } = await supabaseAdmin
        .schema('business')
        .from('members')
        .select('role')
        .eq('id', memberId)
        .single();
      
      if (!roleError && currentRole && currentRole.role === 'admin') {
        // Count how many admins there are
        const { data: admins, error: countError } = await supabaseAdmin
          .schema('business')
          .from('members')
          .select('id')
          .eq('business_id', businessId)
          .eq('role', 'admin');
        
        if (!countError && admins && admins.length <= 1) {
          res.status(400).json({ error: 'Cannot remove the only admin of the business' });
          return;
        }
      }
    }
    
    // Update member role
    const { data: updatedMember, error: updateError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .update({ role })
      .eq('id', memberId)
      .select()
      .single();
    
    if (updateError || !updatedMember) {
      console.error('Error updating member role:', updateError);
      res.status(500).json({ error: 'Failed to update member role' });
      return;
    }
    
    // Update business updated_at timestamp
    await supabaseAdmin
      .schema('business')
      .from('businesses')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', businessId);
    
    res.status(200).json(updatedMember);
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member from business
router.delete('/:businessId/members/:memberId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { businessId, memberId } = req.params;
    const { user_id } = req.body;
    
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
    
    // Check if user is admin of the business
    const { data: adminCheck, error: adminCheckError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('id')
      .eq('business_id', businessId)
      .eq('user_id', user_id)
      .eq('role', 'admin')
      .single();
    
    if (adminCheckError || !adminCheck) {
      res.status(403).json({ error: 'Only business admin can remove members' });
      return;
    }
    
    // Check if member exists
    const { data: member, error: memberError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .select('role')
      .eq('id', memberId)
      .eq('business_id', businessId)
      .single();
    
    if (memberError || !member) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    
    // Cannot remove admin if they are the only admin
    if (member.role === 'admin') {
      // Count how many admins there are
      const { data: admins, error: countError } = await supabaseAdmin
        .schema('business')
        .from('members')
        .select('id')
        .eq('business_id', businessId)
        .eq('role', 'admin');
      
      if (!countError && admins && admins.length <= 1) {
        res.status(400).json({ error: 'Cannot remove the only admin of the business' });
        return;
      }
    }
    
    // Remove member
    const { error: deleteError } = await supabaseAdmin
      .schema('business')
      .from('members')
      .delete()
      .eq('id', memberId);
    
    if (deleteError) {
      console.error('Error removing member:', deleteError);
      res.status(500).json({ error: 'Failed to remove member' });
      return;
    }
    
    // Update business updated_at timestamp
    await supabaseAdmin
      .schema('business')
      .from('businesses')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', businessId);
    
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
