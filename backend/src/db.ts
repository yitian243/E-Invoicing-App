import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// // Constants
// const JWT_SECRET = process.env.JWT_SECRET || 'your_default_secret_key';

// // Hashing Constants
// const SALT_ROUNDS = 10;

// Supabase Constants
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// Error Checking
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
  password: string;
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

// Create a Supabase client with the service key for admin operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// /**
//  * Creates a hash from a string using the secret key
//  * @param str String to hash
//  * @returns Hashed string
//  */
// export async function getHash(str: string): Promise<string> {
//   try {
//     const hash = await bcrypt.hash(str, SALT_ROUNDS);
//     return hash;
//   } catch (error) {
//     console.error('Error hashing string with bcrypt:', error);
//     throw new Error('Could not hash string');
//   }
// }

// /**
//  * Compares a string and a hash
//  * @param plaintext The string to compare (e.g., the password entered by the user)
//  * @param hash The bcrypt hash retrieved from your database or storage
//  * @returns A Promise that resolves with a boolean:
//  */
// export async function compareHash(plaintext: string, hash: string): Promise<boolean> {
//   try {
//     const match = await bcrypt.compare(plaintext, hash);
//     return match;
//   } catch (error) {
//     console.error('Error comparing hash with bcrypt:', error);
//     return false;
//   }
// }

// /**
//  * Generates a JSON Web Token (JWT).
//  *
//  * @param payload The data to include in the token's payload
//  * @param expiresIn The expiration time for the token (e.g. '1h', '7d').
//  * @returns A JWT string.
//  */
// export function generateJwtToken(payload: object, expiresIn: string | number = '1d'): string {
//   return jwt.sign(payload, JWT_SECRET, { expiresIn });
// }

// /**
//  * Verifies a JSON Web Token (JWT).
//  *
//  * @param token The JWT string to verify
//  * @returns The decoded payload if the token is valid, or throws an error if invalid or expired
//  */
// export function verifyJwtToken(token: string): object | string {
//   return jwt.verify(token, JWT_SECRET);
// }

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
