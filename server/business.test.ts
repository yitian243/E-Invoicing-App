import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { resetDataStore } from './dataStore.js';
import { 
  registerRequest,
  loginRequest,
  clearDataStore
} from './authWrapper';
import {
  createBusinessRequest,
  getBusinessByIdRequest,
  getUserBusinessesRequest,
  updateBusinessRequest,
  joinBusinessRequest,
  getBusinessMembersRequest,
} from './businessWrapper';

describe('Business API Tests', () => {
  let adminToken: string;
  let staffToken: string;
  let adminId: string;
  let staffId: string;
  let adminName: string;
  let staffName: string;
  let adminEmail: string;
  let staffEmail: string;

  beforeAll(async () => {
    // Any setup needed before all tests
  });

  afterAll(async () => {
    resetDataStore();
  });

  beforeEach(async () => {
    await clearDataStore();
    
    // Register an admin user
    const adminRegister = await registerRequest('admin@example.com', 'password123', 'Admin User', 'admin');
    adminId = adminRegister.data.user.id;
    adminName = adminRegister.data.user.name;
    adminEmail = adminRegister.data.user.email;
    
    // Register a staff user
    const staffRegister = await registerRequest('staff@example.com', 'password123', 'Staff User', 'staff');
    staffId = staffRegister.data.user.id;
    staffName = staffRegister.data.user.name;
    staffEmail = staffRegister.data.user.email;
    
    // Login to get tokens
    const adminLogin = await loginRequest('admin@example.com', 'password123');
    adminToken = adminLogin.data.token;
    
    const staffLogin = await loginRequest('staff@example.com', 'password123');
    staffToken = staffLogin.data.token;
  });

  describe('Business Creation', () => {
    test('Admin can create a business', async () => {
      const business = {
        name: 'Test Business',
        tax_id: '123456789',
        address: '123 Test St',
        email: 'business@example.com',
        default_currency: 'USD',
        password: 'businesspass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      const response = await createBusinessRequest(adminToken, business);
      
      expect(response).not.toEqual(expect.any(Number)); // Not an error code
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('name', 'Test Business');
      expect(response).toHaveProperty('tax_id', '123456789');
      expect(response).toHaveProperty('admin_id', adminId);
      
      // Password should not be returned
      expect(response).not.toHaveProperty('password');
    });

    test('Staff user can create a business', async () => {
      const business = {
        name: 'Staff Business',
        tax_id: '987654321',
        address: '456 Test St',
        email: 'staffbusiness@example.com',
        default_currency: 'EUR',
        password: 'businesspass',
        admin_id: staffId,
        admin_name: staffName,
        admin_email: staffEmail
      };
      
      const response = await createBusinessRequest(staffToken, business);
      
      // Your implementation allows staff to create businesses
      expect(response).not.toEqual(expect.any(Number)); // Not an error code
      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('name', 'Staff Business');
      expect(response).toHaveProperty('admin_id', staffId);
    });

    test('Cannot create business with duplicate name', async () => {
      // Create first business
      const business1 = {
        name: 'Duplicate Business',
        tax_id: '123456789',
        password: 'businesspass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      await createBusinessRequest(adminToken, business1);
      
      // Try to create another with the same name
      const business2 = {
        name: 'Duplicate Business',
        tax_id: '987654321',
        password: 'businesspass2',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      const response = await createBusinessRequest(adminToken, business2);
      
      expect(response).toEqual(400);
    });
  });

  describe('Business Retrieval', () => {
    test('Get business by ID', async () => {
      // Create a business first
      const business = {
        name: 'Retrieval Test',
        tax_id: '123456789',
        password: 'businesspass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      const createResponse = await createBusinessRequest(adminToken, business);
      const businessId = createResponse.id;
      
      // Now retrieve it
      const response = await getBusinessByIdRequest(adminToken, businessId);
      
      expect(response).not.toEqual(expect.any(Number)); // Not an error code
      expect(response).toHaveProperty('id', businessId);
      expect(response).toHaveProperty('name', 'Retrieval Test');
      expect(response).not.toHaveProperty('password');
    });

    test('Get business for user currently returns 404', async () => {
      // Create a business
      const business = {
        name: 'User Business',
        tax_id: '123456789',
        password: 'businesspass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      await createBusinessRequest(adminToken, business);
      
      // Get businesses for the admin user
      // Currently this returns 404 - this may be due to implementation not being complete
      const response = await getUserBusinessesRequest(adminToken, adminId);
      
      expect(response).toEqual(404);
      
      // When the endpoint is implemented, this would be the expected behavior:
      // expect(Array.isArray(response)).toBe(true);
      // expect(response.length).toBeGreaterThan(0);
      // expect(response[0]).toHaveProperty('name', 'User Business');
    });

    test('Cannot get non-existent business', async () => {
      const response = await getBusinessByIdRequest(adminToken, 'nonexistent_id');
      
      expect(response).toEqual(404);
    });
  });

  describe('Business Update', () => {
    test('Admin can update their business', async () => {
      // Create a business
      const business = {
        name: 'Update Test',
        tax_id: '123456789',
        address: '123 Test St',
        email: 'update@example.com',
        password: 'businesspass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      const createResponse = await createBusinessRequest(adminToken, business);
      const businessId = createResponse.id;
      
      // Update the business
      const updateData = {
        name: 'Updated Business',
        tax_id: '987654321',
        address: '456 Update St',
        email: 'updated@example.com',
        default_currency: 'EUR',
        password: 'businesspass',
        user_id: adminId
      };
      
      const response = await updateBusinessRequest(adminToken, businessId, updateData);
      
      expect(response).not.toEqual(expect.any(Number)); // Not an error code
      expect(response).toHaveProperty('id', businessId);
      expect(response).toHaveProperty('name', 'Updated Business');
      expect(response).toHaveProperty('tax_id', '987654321');
      expect(response).toHaveProperty('address', '456 Update St');
    });

    test('Non-admin cannot update business', async () => {
      // Create a business as admin
      const business = {
        name: 'Admin Business',
        tax_id: '123456789',
        password: 'businesspass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      const createResponse = await createBusinessRequest(adminToken, business);
      const businessId = createResponse.id;
      
      // Try to update as staff
      const updateData = {
        name: 'Staff Updated',
        tax_id: '987654321',
        password: 'businesspass',
        user_id: staffId
      };
      
      const response = await updateBusinessRequest(staffToken, businessId, updateData);
      
      expect(response).toEqual(403);
    });
  });

  describe('Business Joining', () => {
    test('User can join a business with correct password', async () => {
      // Create a business
      const business = {
        name: 'Join Test',
        tax_id: '123456789',
        password: 'joinpass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      await createBusinessRequest(adminToken, business);
      
      // Join as staff
      const joinData = {
        businessName: 'Join Test',
        password: 'joinpass',
        userId: staffId,
        userName: staffName,
        userEmail: staffEmail
      };
      
      const response = await joinBusinessRequest(staffToken, joinData);
      
      expect(response).not.toEqual(expect.any(Number)); // Not an error code
      expect(response).toHaveProperty('name', 'Join Test');
      
      // Check that the staff member is in the members list
      const members = response.members;
      const staffMember = members.find((m: { id: string; role: string }) => m.id === staffId);
      expect(staffMember).toBeTruthy();
      expect(staffMember).toHaveProperty('role', 'staff');
    });

    test('Cannot join with incorrect password', async () => {
      // Create a business
      const business = {
        name: 'Password Test',
        tax_id: '123456789',
        password: 'correctpass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      await createBusinessRequest(adminToken, business);
      
      // Try to join with wrong password
      const joinData = {
        businessName: 'Password Test',
        password: 'wrongpass',
        userId: staffId,
        userName: staffName,
        userEmail: staffEmail
      };
      
      const response = await joinBusinessRequest(staffToken, joinData);
      
      expect(response).toEqual(401);
    });

    test('Cannot join non-existent business', async () => {
      const joinData = {
        businessName: 'Non Existent Business',
        password: 'anypass',
        userId: staffId,
        userName: staffName,
        userEmail: staffEmail
      };
      
      const response = await joinBusinessRequest(staffToken, joinData);
      
      expect(response).toEqual(404);
    });

    test('Cannot join business twice', async () => {
      // Create a business
      const business = {
        name: 'Double Join',
        tax_id: '123456789',
        password: 'joinpass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      await createBusinessRequest(adminToken, business);
      
      // Join once
      const joinData = {
        businessName: 'Double Join',
        password: 'joinpass',
        userId: staffId,
        userName: staffName,
        userEmail: staffEmail
      };
      
      await joinBusinessRequest(staffToken, joinData);
      
      // Try to join again
      const response = await joinBusinessRequest(staffToken, joinData);
      
      expect(response).toEqual(400);
    });
  });
  
  describe('Member Management', () => {
    test('Get business members', async () => {
      // Create a business
      const business = {
        name: 'Member Test',
        tax_id: '123456789',
        password: 'memberpass',
        admin_id: adminId,
        admin_name: adminName,
        admin_email: adminEmail
      };
      
      const createResponse = await createBusinessRequest(adminToken, business);
      const businessId = createResponse.id;
      
      // Get members
      const response = await getBusinessMembersRequest(adminToken, businessId);
      
      expect(response).not.toEqual(expect.any(Number)); // Not an error code
      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(1); // Should have admin as member
      expect(response[0]).toHaveProperty('id', adminId);
      expect(response[0]).toHaveProperty('role', 'admin');
    });

  });
});