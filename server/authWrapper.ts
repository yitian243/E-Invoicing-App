import { BACKEND_PORT } from './config.js';

const SERVER_URL = `http://localhost:${BACKEND_PORT}`;
const API_PREFIX = '/api/auth';

/**
 * Register a user
 */
export async function registerRequest(email: string, password: string, name: string, role: string = 'user') {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        name,
        role
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Registration request failed:', error);
    return 500;
  }
}

/**
 * Login a user
 */
export async function loginRequest(email: string, password: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Login request failed:', error);
    return 500;
  }
}

/**
 * Logout a user
 */
export async function logoutRequest(token: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': token
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Logout request failed:', error);
    return 500;
  }
}

/**
 * Clear the data store
 */
export async function clearDataStore() {
  try {
    const response = await fetch(`${SERVER_URL}/api/testing/clear-users`, {
      method: 'DELETE'
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Clear data store request failed:', error);
    return 500;
  }
}