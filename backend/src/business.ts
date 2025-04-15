import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Business, BusinessMember, getData, setData } from './dataStore';

const router = express.Router();

// Get business by ID
router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const data = getData();
    
    // Check if businesses array exists
    if (!data.businesses) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    const business = data.businesses.find((b: Business) => b.id === id);
    
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    // Remove password before sending response
    const { password, ...businessWithoutPassword } = business;
    
    res.status(200).json(businessWithoutPassword);
  } catch (error) {
    console.error('Error getting business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get business by user ID (where user is a member)
router.get('/user/:userId', (req: Request, res: Response): void => {
  try {
    const { userId } = req.params;
    const data = getData();
    
    if (!data.businesses) {
      res.status(404).json({ error: 'No businesses found' });
      return;
    }
    
    const userBusinesses = data.businesses.filter((business: Business) => 
      business.members.some(member => member.id === userId)
    );
    
    if (userBusinesses.length === 0) {
      res.status(404).json({ error: 'No businesses found for this user' });
      return;
    }
    
    // Remove passwords before sending response
    const businessesWithoutPasswords = userBusinesses.map((business: Business) => {
      const { password, ...businessWithoutPassword } = business;
      return businessWithoutPassword;
    });
    
    res.status(200).json(businessesWithoutPasswords);
  } catch (error) {
    console.error('Error getting user businesses:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new business
router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, tax_id, address, email, default_currency, password, admin_id, admin_name, admin_email } = req.body;
    
    if (!name || !tax_id || !password || !admin_id || !admin_name || !admin_email) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const data = getData();
    
    // Initialize businesses array if it doesn't exist
    if (!data.businesses) {
      data.businesses = [];
    }
    
    // Check if business with the same name already exists
    const existingBusiness = data.businesses.find((b: Business) => 
      b.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingBusiness) {
      res.status(400).json({ error: 'Business with this name already exists' });
      return;
    }
    
    const newBusiness: Business = {
      id: `business_${uuidv4()}`,
      name,
      tax_id,
      address: address || '',
      email: email || '',
      default_currency: default_currency || 'AUD',
      invoice_template: 'default',
      admin_id,
      password,
      created_at: new Date().toISOString(),
      members: [{
        id: admin_id,
        name: admin_name,
        email: admin_email,
        role: 'admin',
        joined_at: new Date().toISOString()
      }]
    };
    
    data.businesses.push(newBusiness);
    setData(data);
    
    // Remove password before sending response
    const { password: _, ...businessWithoutPassword } = newBusiness;
    
    res.status(201).json(businessWithoutPassword);
  } catch (error) {
    console.error('Error creating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update an existing business
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const { name, tax_id, address, email, default_currency, password, user_id } = req.body;
    
    if (!name || !tax_id || !password || !user_id) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const data = getData();
    
    if (!data.businesses) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    const businessIndex = data.businesses.findIndex((b: Business) => b.id === id);
    
    if (businessIndex === -1) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    const business = data.businesses[businessIndex];
    
    // Check if user is admin of the business
    const isBizAdmin = business.members.some(member => 
      member.id === user_id && member.role === 'admin'
    );
    
    if (!isBizAdmin) {
      res.status(403).json({ error: 'Only business admin can update business details' });
      return;
    }
    
    // Update business
    const updatedBusiness: Business = {
      ...business,
      name,
      tax_id,
      address,
      email,
      default_currency,
      password,
      updated_at: new Date().toISOString()
    };
    
    data.businesses[businessIndex] = updatedBusiness;
    setData(data);
    
    // Remove password before sending response
    const { password: _, ...businessWithoutPassword } = updatedBusiness;
    
    res.status(200).json(businessWithoutPassword);
  } catch (error) {
    console.error('Error updating business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Join an existing business
router.post('/join', (req: Request, res: Response): void => {
  try {
    const { businessName, password, userId, userName, userEmail } = req.body;
    
    if (!businessName || !password || !userId || !userName || !userEmail) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const data = getData();
    
    if (!data.businesses) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    // Find the business by name (case insensitive)
    const businessIndex = data.businesses.findIndex((b: Business) => 
      b.name.toLowerCase() === businessName.toLowerCase()
    );
    
    if (businessIndex === -1) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    const business = data.businesses[businessIndex];
    
    // Validate password
    if (business.password !== password) {
      res.status(401).json({ error: 'Invalid password' });
      return;
    }
    
    // Check if user is already a member
    const isAlreadyMember = business.members.some(member => 
      member.id === userId || member.email.toLowerCase() === userEmail.toLowerCase()
    );
    
    if (isAlreadyMember) {
      res.status(400).json({ error: 'User is already a member of this business' });
      return;
    }
    
    // Add user as member
    const newMember: BusinessMember = {
      id: userId,
      name: userName,
      email: userEmail,
      role: 'staff',
      joined_at: new Date().toISOString()
    };
    
    const updatedBusiness: Business = {
      ...business,
      members: [...business.members, newMember],
      updated_at: new Date().toISOString()
    };
    
    data.businesses[businessIndex] = updatedBusiness;
    setData(data);
    
    // Remove password before sending response
    const { password: _, ...businessWithoutPassword } = updatedBusiness;
    
    res.status(200).json(businessWithoutPassword);
  } catch (error) {
    console.error('Error joining business:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all business members
router.get('/:id/members', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const data = getData();
    
    if (!data.businesses) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    const business = data.businesses.find((b: Business) => b.id === id);
    
    if (!business) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    res.status(200).json(business.members);
  } catch (error) {
    console.error('Error getting business members:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update member role
router.put('/:businessId/members/:memberId', (req: Request, res: Response): void => {
  try {
    const { businessId, memberId } = req.params;
    const { role, user_id } = req.body;
    
    if (!role || !['admin', 'staff'].includes(role)) {
      res.status(400).json({ error: 'Invalid role' });
      return;
    }
    
    const data = getData();
    
    if (!data.businesses) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    const businessIndex = data.businesses.findIndex((b: Business) => b.id === businessId);
    
    if (businessIndex === -1) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    const business = data.businesses[businessIndex];
    
    // Check if user is admin of the business
    const isBizAdmin = business.members.some(member => 
      member.id === user_id && member.role === 'admin'
    );
    
    if (!isBizAdmin) {
      res.status(403).json({ error: 'Only business admin can update member roles' });
      return;
    }
    
    // Find member
    const memberIndex = business.members.findIndex(member => member.id === memberId);
    
    if (memberIndex === -1) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    
    // Update member role
    business.members[memberIndex].role = role;
    business.updated_at = new Date().toISOString();
    
    data.businesses[businessIndex] = business;
    setData(data);
    
    res.status(200).json(business.members[memberIndex]);
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove member from business
router.delete('/:businessId/members/:memberId', (req: Request, res: Response): void => {
  try {
    const { businessId, memberId } = req.params;
    const { user_id } = req.body;
    
    const data = getData();
    
    if (!data.businesses) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    const businessIndex = data.businesses.findIndex((b: Business) => b.id === businessId);
    
    if (businessIndex === -1) {
      res.status(404).json({ error: 'Business not found' });
      return;
    }
    
    const business = data.businesses[businessIndex];
    
    // Check if user is admin of the business
    const isBizAdmin = business.members.some(member => 
      member.id === user_id && member.role === 'admin'
    );
    
    if (!isBizAdmin) {
      res.status(403).json({ error: 'Only business admin can remove members' });
      return;
    }
    
    // Cannot remove admin if they are the only admin
    const isTargetAdmin = business.members.find(member => member.id === memberId)?.role === 'admin';
    const adminCount = business.members.filter(member => member.role === 'admin').length;
    
    if (isTargetAdmin && adminCount <= 1) {
      res.status(400).json({ error: 'Cannot remove the only admin of the business' });
      return;
    }
    
    // Remove member
    const updatedMembers = business.members.filter(member => member.id !== memberId);
    
    if (updatedMembers.length === business.members.length) {
      res.status(404).json({ error: 'Member not found' });
      return;
    }
    
    business.members = updatedMembers;
    business.updated_at = new Date().toISOString();
    
    data.businesses[businessIndex] = business;
    setData(data);
    
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;