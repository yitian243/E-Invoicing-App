import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

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

export interface Data {
  users: User[];
  usersTotal: number;
}

// Initial data state
let dataStore: Data = {
  users: [],
  usersTotal: 0
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
        
      } else {
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
  
        fs.writeFileSync(dbPath, JSON.stringify(dataStore));
        console.log('Created new database file');
      }
    } catch (error) {
      console.error('Error initializing data store:', error);}
  }

/**
 * Resets the data store to initial state
 */
export function resetDataStore(): Record<string, never> {
  dataStore = {
    users: [],
    usersTotal: 0
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

/**
 * Validates if a token is valid for a user
 * @param token The hashed token to validate
 * @returns User ID if valid, null if invalid
 */
export function validateToken(token: string): number | null {
  for (const user of dataStore.users) {
    for (const userToken of user.tokens) {
      if (getHash(userToken) === token) {
        return user.id;
      }
    }
  }
  return null;
}

initializeDataStore();