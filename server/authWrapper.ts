import axios from 'axios';
import { BACKEND_PORT } from './config.js';

const SERVER_URL = `http://localhost:${BACKEND_PORT}`;
const API_PREFIX = '/api/auth';

// Successful Response Code Constants
const RES_SUCCESS = 200;
const RES_CREATED = 201;

/**
 * Register a user with email, password, name, and role
 */
export async function registerRequest(email: string, password: string, name: string, role: string = 'user') {
  try {
    const res = await axios.post(
      SERVER_URL + API_PREFIX + '/signup',
      {
        email,
        password,
        name,
        role
      }
    );
    
    return res.data;
  } catch (error: any) {
    return error.response?.status || 500;
  }
}

/**
 * Login a user with email and password
 */
export async function loginRequest(email: string, password: string) {
  try {
    const res = await axios.post(
      SERVER_URL + API_PREFIX + '/login',
      {
        email,
        password
      }
    );
    
    return res.data;
  } catch (error: any) {
    return error.response?.status || 500;
  }
}

/**
 * Logout a user with given token
 */
export async function logoutRequest(token: string) {
  try {
    const res = await axios.post(
      SERVER_URL + API_PREFIX + '/logout',
      {},
      {
        headers: {
          token: token
        }
      }
    );
    
    return res.data;
  } catch (error: any) {
    return error.response?.status || 500;
  }
}

/**
 * Clear the data store
 */
export async function clearRequest() {
  try {
    const res = await axios.delete(`${SERVER_URL}/api/testing/clear-users`);
    
    return res.data;
  } catch (error: any) {
    return error.response?.status || 500;
  }
}

// Re-export the original login request for backwards compatibility
export function authLoginRequest(email: string, password: string) {
  return loginRequest(email, password);
}