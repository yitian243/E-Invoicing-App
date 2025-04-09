import { jest, describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { app, startServer, stopServer } from './server.js';
import { resetDataStore } from './dataStore.js';
import { 
  registerRequest,
  loginRequest,
  logoutRequest,
  clearRequest
} from './authWrapper';

describe('Authentication API Tests', () => {
  beforeAll(() => {
    startServer();
  });

  afterAll(async () => {
    await stopServer();
    resetDataStore();
  });

  beforeEach(async () => {
    await clearRequest();
  });

  describe('User Registration', () => {
    test('Successful registration returns user ID', async () => {
      const response = await registerRequest('test@example.com', 'password123', 'Test User');
      
      expect(response.data).toHaveProperty('id');
      expect(response.data.id).toStrictEqual(expect.any(Number));
    });

    test('Registration with duplicate email fails', async () => {
      await registerRequest('test@example.com', 'password123', 'Test User');
      const secondReg = await registerRequest('test@example.com', 'password123', 'Another User');
      
      expect(secondReg).toBe(409);
    });

    test('Registration with invalid email fails', async () => {
      const response = await registerRequest('invalid-email', 'password123', 'Test User');
      
      expect(response).toBe(400);
    });

    test('Registration with short password fails', async () => {
      const response = await registerRequest('test@example.com', '12345', 'Test User');
      
      expect(response).toBe(400);
    });
  });

  describe('User Login', () => {
    test('Successful login', async () => {
      await registerRequest('test@example.com', 'password123', 'Test User');
      const loginResponse = await loginRequest('test@example.com', 'password123');
      
      expect(loginResponse.success).toBe(true);
      expect(loginResponse.data).toHaveProperty('token');
      expect(loginResponse.data).toHaveProperty('user');
    });

    test('Login with non-existent email fails', async () => {
      const loginResponse = await loginRequest('nonexistent@example.com', 'password123');
      expect(loginResponse).toBe(401);
    });

    test('Login with incorrect password fails', async () => {
      await registerRequest('test@example.com', 'password123', 'Test User');
      
      const loginResponse = await loginRequest('test@example.com', 'wrongpassword');
      expect(loginResponse).toBe(401);
    });
  });

  describe('User Logout', () => {
    test('Successful logout', async () => {
      await registerRequest('test@example.com', 'password123', 'Test User');
      
      const loginResponse = await loginRequest('test@example.com', 'password123');
      const token = loginResponse.data.token;
      
      const logoutResponse = await logoutRequest(token);
      expect(logoutResponse.success).toBe(true);
    });

    test('Logout with invalid token fails', async () => {
      const logoutResponse = await logoutRequest('invalid-token');
      expect(logoutResponse).toBe(401);
    });
  });
});