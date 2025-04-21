import { BACKEND_PORT } from './config';

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
 * @param token The authentication token
 * @returns A promise that resolves to the response data or error status code
 */
export async function logoutRequest(token: string) {
  try {
    // Check if token exists
    if (!token) {
      return 401; // No token provided
    }
    
    // Make the request
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return response.status;
    }
    
    try {
      const data = await response.json();
      return data;
    } catch (e) {
      return { success: true };
    }
  } catch (error) {
    return 500;
  }
}

/**
 * Clear the data store (now a no-op with Supabase)
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
    return 500;
  }
}

/**
 * Validate a token with the API
 * @param {string} token - The token to validate
 * @returns {Promise<Object|number>} - Response object or HTTP status code on error
 */
export const validateTokenRequest = async (token: string) => {
  try {
    if (!token) {
      return 401; // No token provided
    }
    
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/validate-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      return response.status;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Token validation error:', error);
    return 500;
  }
};
