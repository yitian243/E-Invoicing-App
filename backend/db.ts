import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

dotenv.config({ path: path.resolve('../.env') });

// Constants
const SECRET_KEY = 'your-invoice-app-secret-key';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in .env file');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
  console.error('SUPABASE_KEY:', supabaseKey ? 'Present' : 'Missing');
  process.exit(1);
}

// Database Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
  tokens?: string[] | null;
  last_login?: Date | null;
  created_at: Date;
}

export interface Business {
  id: string;
  name: string;
  tax_id: string;
  address: string;
  email: string;
  default_currency: string;
  invoice_template?: string | null;
  admin_id: string;
  created_at: Date;
  updated_at?: Date | null;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  joined_at: Date;
  business_id: string;
  user_id?: string | null;
  profile_id?: string | null;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client: string;
  issue_date: Date;
  due_date: Date;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  notes?: string | null;
  terms?: string | null;
  client_city?: string | null;
  client_street?: string | null;
  client_post_code?: string | null;
  client_email?: string | null;
  client_tax_number?: string | null;
  pdf_url?: string | null;
  xml_url?: string | null;
  business_id: string;
  created_by?: string | null;
  created_at: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  invoice_id: string;
  created_at: Date;
}

// Export the types from the old datastore that might be used elsewhere
export type BusinessMember = Member;
export type User = UserProfile;

// Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Creates a hash from a string using the secret key
 * @param str String to hash
 * @returns Hashed string
 */
export function getHash(str: string): string {
  return crypto.createHash('sha256').update(str + SECRET_KEY).digest('hex');
}

/**
 * Generates a new token
 * @returns A new UUID token
 */
export function generateToken(): string {
  return uuidv4();
}

// Database Operations
export const db = {
  // User Profile Operations
  getUserProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('auth_ext.user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data as UserProfile;
  },

  createUserProfile: async (profile: Omit<UserProfile, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('auth_ext.user_profiles')
      .insert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserProfile;
  },

  updateUserProfile: async (userId: string, updates: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from('auth_ext.user_profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserProfile;
  },

  // User-related operations adapted from datastore
  getUsers: async () => {
    const { data, error } = await supabase
      .from('auth_ext.user_profiles')
      .select('*');
    
    if (error) throw error;
    return data as UserProfile[];
  },

  // Business Operations
  createBusiness: async (business: Omit<Business, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('business.businesses')
      .insert(business)
      .select()
      .single();
    
    if (error) throw error;
    return data as Business;
  },

  getBusiness: async (businessId: string) => {
    const { data, error } = await supabase
      .from('business.businesses')
      .select('*')
      .eq('id', businessId)
      .single();
    
    if (error) throw error;
    return data as Business;
  },

  getBusinessesByAdmin: async (adminId: string) => {
    const { data, error } = await supabase
      .from('business.businesses')
      .select('*')
      .eq('admin_id', adminId);
    
    if (error) throw error;
    return data as Business[];
  },

  getBusinesses: async () => {
    const { data, error } = await supabase
      .from('business.businesses')
      .select('*');
    
    if (error) throw error;
    return data as Business[];
  },

  // Member Operations
  addMember: async (member: Omit<Member, 'id' | 'joined_at'>) => {
    const { data, error } = await supabase
      .from('business.members')
      .insert(member)
      .select()
      .single();
    
    if (error) throw error;
    return data as Member;
  },

  getBusinessMembers: async (businessId: string) => {
    const { data, error } = await supabase
      .from('business.members')
      .select('*')
      .eq('business_id', businessId);
    
    if (error) throw error;
    return data as Member[];
  },

  // Invoice Operations
  createInvoice: async (invoice: Omit<Invoice, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('billing.invoices')
      .insert(invoice)
      .select()
      .single();
    
    if (error) throw error;
    return data as Invoice;
  },

  getInvoice: async (invoiceId: string) => {
    const { data, error } = await supabase
      .from('billing.invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    
    if (error) throw error;
    return data as Invoice;
  },

  getBusinessInvoices: async (businessId: string) => {
    const { data, error } = await supabase
      .from('billing.invoices')
      .select('*')
      .eq('business_id', businessId);
    
    if (error) throw error;
    return data as Invoice[];
  },

  getInvoices: async () => {
    const { data, error } = await supabase
      .from('billing.invoices')
      .select('*');
    
    if (error) throw error;
    return data as Invoice[];
  },

  // Invoice Item Operations
  addInvoiceItem: async (item: Omit<InvoiceItem, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('billing.invoice_items')
      .insert(item)
      .select()
      .single();
    
    if (error) throw error;
    return data as InvoiceItem;
  },

  getInvoiceItems: async (invoiceId: string) => {
    const { data, error } = await supabase
      .from('billing.invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId);
    
    if (error) throw error;
    return data as InvoiceItem[];
  },

  // Auth Operations
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  },

  // For migration compatibility with old code
  getData: async () => {
    const [users, businesses, invoices] = await Promise.all([
      db.getUsers(),
      db.getBusinesses(),
      db.getInvoices()
    ]);
    
    return {
      users,
      usersTotal: users.length,
      businesses,
      invoices,
      invoicesTotal: invoices.length
    };
  },
  
  // These functions are preserved for backwards compatibility
  // but should be phased out as they don't make sense with Supabase
  initializeDataStore: () => {
    console.warn('initializeDataStore is deprecated when using Supabase');
    return;
  },
  
  resetDataStore: async () => {
    console.warn('resetDataStore is deprecated when using Supabase. Use database management tools instead.');
    return {};
  },
  
  setData: (newData: any) => {
    console.warn('setData is deprecated when using Supabase. Use specific update functions instead.');
    return {};
  }
};

// Export the typed Supabase client for advanced operations
export function getTypedSupabase() {
  return {
    auth: supabase.auth,
    from: {
      userProfiles: () => supabase.from('auth_ext.user_profiles'),
      businesses: () => supabase.from('business.businesses'),
      members: () => supabase.from('business.members'),
      invoices: () => supabase.from('billing.invoices'),
      invoiceItems: () => supabase.from('billing.invoice_items'),
    },
    rpc: supabase.rpc,
    storage: supabase.storage,
  };
}

// Self-test execution
async function testSupabaseConnection() {
  try {
    console.log('===== SUPABASE CONNECTION TEST =====');
    console.log('Testing Supabase connection and basic operations...');
    
    // Test auth operations
    const testEmail = `smartinvoice123@gmail.com`;
    const testPassword = 'InvoiceSmart123!';
    let userId: string = '';
    let userProfileId: string = '';
    let businessId: string = '';
    let invoiceId: string = '';
    // let userId: string | null = null;
    // let userProfileId: string | null = null;
    // let businessId: string | null = null;
    // let invoiceId: string | null = null;
    
    try {
      // 1. Sign up test user
      console.log('\n1. Testing user registration...');
      const signUpResult = await db.signUp(testEmail, testPassword);
      
      if (!signUpResult.user || !signUpResult.user.id) {
        throw new Error('Failed to create test user');
      }
      
      userId = signUpResult.user.id;
      console.log(`✓ User created successfully with ID: ${userId}`);
      
      // 2. Create user profile
      console.log('\n2. Testing user profile creation...');
      const userProfile = await db.createUserProfile({
        name: 'Test User',
        email: testEmail,
        role: 'admin',
        tokens: [generateToken()]
      });
      
      userProfileId = userProfile.id;
      console.log(`✓ User profile created with ID: ${userProfileId}`);
      
      // 3. Create business
      console.log('\n3. Testing business creation...');
      const business = await db.createBusiness({
        name: 'Test Business',
        tax_id: 'TB123456789',
        address: '123 Test Street, Test City',
        email: 'business@test.com',
        default_currency: 'USD',
        admin_id: userId
      });
      
      businessId = business.id;
      console.log(`✓ Business created with ID: ${businessId}`);
      
      // 4. Create a member
      console.log('\n4. Testing member creation...');
      const member = await db.addMember({
        name: 'Test Member',
        email: 'member@test.com',
        role: 'admin', // Using literal 'admin' to satisfy TypeScript
        business_id: businessId,
        user_id: userId,
        profile_id: userProfileId
      });
      
      console.log(`✓ Member created with ID: ${member.id}`);
      
      // 5. Create an invoice
      console.log('\n5. Testing invoice creation...');
      const invoice = await db.createInvoice({
        invoice_number: `INV-${Date.now()}`,
        client: 'Test Client',
        issue_date: new Date(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        subtotal: 1000,
        tax: 100,
        total: 1100,
        status: 'draft',
        business_id: businessId,
        created_by: userId,
        client_email: 'client@test.com',
        client_city: 'Test City',
        client_street: 'Test Street',
        client_post_code: '12345',
        client_tax_number: 'TC123456789'
      });
      
      invoiceId = invoice.id;
      console.log(`✓ Invoice created with ID: ${invoiceId}`);
      
      // 6. Create invoice items
      console.log('\n6. Testing invoice item creation...');
      const invoiceItem = await db.addInvoiceItem({
        description: 'Test Item',
        quantity: 1,
        unit_price: 1000,
        tax_rate: 10,
        invoice_id: invoiceId
      });
      
      console.log(`✓ Invoice item created with ID: ${invoiceItem.id}`);
      
      // 7. Test retrieval operations
      console.log('\n7. Testing retrieval operations...');
      
      // Get user profile
      const fetchedProfile = await db.getUserProfile(userProfileId);
      console.log(`✓ Retrieved user profile: ${fetchedProfile.name}`);
      
      // Get business
      const fetchedBusiness = await db.getBusiness(businessId);
      console.log(`✓ Retrieved business: ${fetchedBusiness.name}`);
      
      // Get all businesses for admin
      const adminBusinesses = await db.getBusinessesByAdmin(userId);
      console.log(`✓ Retrieved ${adminBusinesses.length} businesses for admin`);
      
      // Get business members
      const businessMembers = await db.getBusinessMembers(businessId);
      console.log(`✓ Retrieved ${businessMembers.length} members for business`);
      
      // Get invoice
      const fetchedInvoice = await db.getInvoice(invoiceId);
      console.log(`✓ Retrieved invoice: ${fetchedInvoice.invoice_number}`);
      
      // Get all invoices for business
      const businessInvoices = await db.getBusinessInvoices(businessId);
      console.log(`✓ Retrieved ${businessInvoices.length} invoices for business`);
      
      // Get invoice items
      const invoiceItems = await db.getInvoiceItems(invoiceId);
      console.log(`✓ Retrieved ${invoiceItems.length} items for invoice`);
      
      // 8. Test getData compatibility function
      console.log('\n8. Testing getData compatibility function...');
      const allData = await db.getData();
      console.log(`✓ Retrieved data with ${allData.usersTotal} users, ${allData.invoicesTotal} invoices, and ${allData.businesses.length} businesses`);
      
      console.log('\nAll tests completed successfully! 🎉');
      
    } catch (testError) {
      console.error('Test failed:', testError);
    } finally {
      // 9. Cleanup - optional, uncomment if you want to clean up test data
      console.log('\n9. Cleanup (commented out by default)...');
      /*
      if (invoiceId) {
        // Delete invoice items first (foreign key constraints)
        await supabase.from('billing.invoice_items').delete().eq('invoice_id', invoiceId);
        console.log('✓ Deleted test invoice items');
        
        // Delete invoice
        await supabase.from('billing.invoices').delete().eq('id', invoiceId);
        console.log('✓ Deleted test invoice');
      }
      
      if (businessId) {
        // Delete members first
        await supabase.from('business.members').delete().eq('business_id', businessId);
        console.log('✓ Deleted test business members');
        
        // Delete business
        await supabase.from('business.businesses').delete().eq('id', businessId);
        console.log('✓ Deleted test business');
      }
      
      if (userProfileId) {
        // Delete user profile
        await supabase.from('auth_ext.user_profiles').delete().eq('id', userProfileId);
        console.log('✓ Deleted test user profile');
      }
      
      if (userId) {
        // Delete auth user
        const adminClient = createClient(supabaseUrl, supabaseServiceKey);
        await adminClient.auth.admin.deleteUser(userId);
        console.log('✓ Deleted test user');
      }
      */
    }
    
  } catch (err) {
    console.error('Test suite failed:');
    console.error(err instanceof Error ? err.message : err);
  }
}

testSupabaseConnection();
