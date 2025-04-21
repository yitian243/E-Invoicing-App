import { afterAll, beforeAll, beforeEach, describe, expect, test } from '@jest/globals';
import {
  clearDataStore,
  loginRequest,
  logoutRequest,
  registerRequest,
  validateTokenRequest
} from './authWrapper';

// Mock Supabase
jest.mock('./db', () => ({
  supabaseAdmin: {
    schema: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
      signIn: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

describe('Authentication API Tests', () => {
  beforeAll(() => {
    // Any setup needed before all tests
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearDataStore();
  });

  describe('User Registration', () => {
    test('Successful registration returns user ID', async () => {
      const response = await registerRequest('test@example.com', 'password123', 'Test User');
      
      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('user');
      expect(response.data.user).toHaveProperty('id');
      expect(response.data.user.id).toStrictEqual(expect.any(Number));
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
      // Register and login to get a token
      await registerRequest('test@example.com', 'password123', 'Test User');
      const loginResponse = await loginRequest('test@example.com', 'password123');
      
      // Ensure we have a token
      expect(loginResponse.success).toBe(true);
      expect(loginResponse.data).toHaveProperty('token');
      const token = loginResponse.data.token;
      
      // Logout with the token
      const logoutResponse = await logoutRequest(token);
      expect(logoutResponse.success).toBe(true);
    });

    test('Logout with invalid token fails', async () => {
      const logoutResponse = await logoutRequest('invalid_token_123');
      expect(logoutResponse).toBe(403);
    });

    test('Logout with empty token fails', async () => {
      const logoutResponse = await logoutRequest('');
      expect(logoutResponse).toBe(401);
    });

    test('Logout after previous logout fails', async () => {
      // Register and login to get a token
      await registerRequest('test@example.com', 'password123', 'Test User');
      const loginResponse = await loginRequest('test@example.com', 'password123');
      const token = loginResponse.data.token;
      
      // First logout should succeed
      const firstLogoutResponse = await logoutRequest(token);
      expect(firstLogoutResponse.success).toBe(true);
      
      // Second logout with same token should fail
      const secondLogoutResponse = await logoutRequest(token);
      expect(secondLogoutResponse).toBe(403);
    });
  });

  describe('Token Validation', () => {
    test('Valid token returns user information', async () => {
      // Register and login to get a token
      await registerRequest('test@example.com', 'password123', 'Test User');
      const loginResponse = await loginRequest('test@example.com', 'password123');
      const token = loginResponse.data.token;
      
      // Validate the token
      const validationResponse = await validateTokenRequest(token);
      
      expect(validationResponse.success).toBe(true);
      expect(validationResponse.data).toHaveProperty('id');
      expect(validationResponse.data).toHaveProperty('email', 'test@example.com');
      expect(validationResponse.data).toHaveProperty('name', 'Test User');
      expect(validationResponse.data).toHaveProperty('role');
    });

    test('Invalid token returns an error', async () => {
      const validationResponse = await validateTokenRequest('invalid_token_123');
      
      expect(validationResponse).toBe(403);
    });

    test('Missing token returns an error', async () => {
      const validationResponse = await validateTokenRequest('');
      
      expect(validationResponse).toBe(401);
    });

    test('Token becomes invalid after logout', async () => {
      // Register and login to get a token
      await registerRequest('test@example.com', 'password123', 'Test User');
      const loginResponse = await loginRequest('test@example.com', 'password123');
      const token = loginResponse.data.token;
      
      // Verify token is valid
      const validationBeforeLogout = await validateTokenRequest(token);
      expect(validationBeforeLogout.success).toBe(true);
      
      // Logout
      const logoutResponse = await logoutRequest(token);
      expect(logoutResponse.success).toBe(true);
      
      // Validate token after logout
      const validationAfterLogout = await validateTokenRequest(token);
      expect(validationAfterLogout).toBe(403);
    });
  });

  describe('Multiple Sessions', () => {
    test('User can have multiple valid tokens', async () => {
      // Register a user
      await registerRequest('test@example.com', 'password123', 'Test User');
      
      // Login from two different devices/sessions
      const loginResponse1 = await loginRequest('test@example.com', 'password123');
      const loginResponse2 = await loginRequest('test@example.com', 'password123');
      
      const token1 = loginResponse1.data.token;
      const token2 = loginResponse2.data.token;
      
      // Both tokens should be valid
      const validation1 = await validateTokenRequest(token1);
      const validation2 = await validateTokenRequest(token2);
      
      expect(validation1.success).toBe(true);
      expect(validation2.success).toBe(true);
    });
    
    test('Logging out from one session does not affect others', async () => {
      // Register a user
      await registerRequest('test@example.com', 'password123', 'Test User');
      
      // Login from two different devices/sessions
      const loginResponse1 = await loginRequest('test@example.com', 'password123');
      const loginResponse2 = await loginRequest('test@example.com', 'password123');
      
      const token1 = loginResponse1.data.token;
      const token2 = loginResponse2.data.token;
      
      // Logout from first session
      const logoutResponse = await logoutRequest(token1);
      expect(logoutResponse.success).toBe(true);
      
      // First token should be invalid after logout
      const validation1 = await validateTokenRequest(token1);
      expect(validation1).toBe(403);
      
      // Second token should still be valid
      const validation2 = await validateTokenRequest(token2);
      expect(validation2.success).toBe(true);
    });
  });
});
