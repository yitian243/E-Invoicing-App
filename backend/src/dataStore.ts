import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Constants
const SECRET_KEY = 'your-invoice-app-secret-key';

// Types
export interface User {
  id: number;
  name: string;
  email: string;
  password: string; // Will store hashed password
  role: string;
  business_id: number;
  avatar: string;
  tokens: string[]; // Array to store active tokens
  lastLogin: Date;
  createdAt: Date;
}

export interface BusinessMember {
  id: string;
  name: string;
  email: string;
  role: string; // 'admin' or 'staff'
  joined_at: string;
}

export interface Business {
  id: string;
  name: string;
  tax_id: string;
  address: string;
  email: string;
  default_currency: string;
  invoice_template: string;
  admin_id: string;
  members: BusinessMember[];
  password: string;
  created_at: string;
  updated_at?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  contactId: number;
  clientName: string;
  issueDate: string | Date;
  dueDate: string | Date;
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  items: InvoiceItem[];
  notes?: string;
  terms?: string;
  clientCity: string;
  clientStreet: string;
  clientPostCode: string;
  clientEmail: string;
  clientTaxNumber: string;
  pdfUrl: string;
  xmlUrl: string;
}

export interface Contact {
  id: number;
  name: string;
  type: "Client" | "Vendor" | "Other";
  company: string;
  email: string;
  phone: string;
  lastInteraction: Date;
  city: string;
  street: string;
  postcode: string;
  taxNumber: string;
  notes: string;
  invoiceCount: number,
  totalValue: number
}

export interface Data {
  users: User[];
  usersTotal: number;
  invoices: Invoice[];
  invoicesTotal: number;
  businesses: Business[];
  contacts: Contact[];
  contactsTotal: number;
}

// Initial data state
let dataStore: Data = {
  users: [],
  usersTotal: 0,
  invoices: [],
  invoicesTotal: 0,
  businesses: [],
  contacts: [],
  contactsTotal: 0,
};

/**
 * Retrieves the complete data object
 * @returns The data object
 */
export function getData(): Data {
  return dataStore;
}

/**
 * Updates the data object and persists it to disk
 * @param newData The new data object
 * @returns Empty object for success
 */
export function setData(newData: Data): Record<string, never> {
  dataStore = newData;
  
  // Persist data to file
  try {
    fs.writeFileSync('./database.json', JSON.stringify(dataStore));
  } catch (error) {
    console.error('Error writing data to file:', error);
  }
  
  return {};
}

/**
 * Gets all users
 * @returns Array of users
 */
export function getUsers(): User[] {
  return dataStore.users;
}

/**
 * Gets all invoices
 * @returns Array of invoices
 */
export function getInvoices(): Invoice[] {
  console.log('Invoices in data store:', dataStore.invoices);
  return dataStore.invoices || [];
}


/** 
 * Gets all businesses
 * @returns Array of businesses
 */
export function getBusinesses(): Business[] {
  return dataStore.businesses || [];
}

/** 
 * Gets all contacts
 * @returns Array of contacts
 */
export function getContacts(): Contact[] {
  return dataStore.contacts || [];
}

/** 
 * Gets all clients
 * @returns Array of contacts
 */
export function getClients(): Contact[] {
  let clients = []
  for (let i = 0; i < dataStore.contacts.length; i++) {
    if (dataStore.contacts[i].type === "Client") {
      clients.push(dataStore.contacts[i]);
    }
  }
  return clients || [];
}

/**
 * Creates a hash from a string using the secret key
 * @param str String to hash
 * @returns Hashed string
 */
export function getHash(str: string): string {
  return crypto.createHash('sha256').update(str + SECRET_KEY).digest('hex');
}

/**
 * Initializes the data store by loading from file if it exists
 */
export function initializeDataStore(): void {
  try {
    const dbPath = path.resolve('./database.json');
      
    if (fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      dataStore = JSON.parse(fileData);
      
      dataStore.users.forEach(user => {
        user.lastLogin = new Date(user.lastLogin);
        user.createdAt = new Date(user.createdAt);
      });
      
      // Initialize businesses array if it doesn't exist
      if (!dataStore.businesses) {
        dataStore.businesses = [];
      }
      
    } else {
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(dbPath, JSON.stringify(dataStore));
    }
  } catch (error) {
    console.error('Error initializing data store:', error);
  }
}

/**
 * Resets the data store to initial state
 */
export function resetDataStore(): Record<string, never> {
  dataStore = {
    users: [],
    usersTotal: 0,
    invoices: [],
    invoicesTotal: 0,
    businesses: [],
    contacts: [],
    contactsTotal: 0
  };

  // Remove database file if it exists
  try {
    if (fs.existsSync('./database.json')) {
      fs.unlinkSync('./database.json');
    }
  } catch (error) {
    console.error('Error deleting database file:', error);
  }
  
  return {};
}

/**
 * Generates a new token
 * @returns A new UUID token
 */
export function generateToken(): string {
  return uuidv4();
}

initializeDataStore();