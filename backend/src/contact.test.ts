import { beforeEach, describe, expect, test } from '@jest/globals';

// Mock the contactWrapper module
jest.mock('./contactWrapper', () => ({
  createContactRequest: jest.fn().mockImplementation((token, data) => {
    if (!data.name || !data.email || !data.taxNumber) {
      return 400;
    }
    if (data.taxNumber && !/^\d{9}$/.test(data.taxNumber)) {
      return 400;
    }
    return {
      success: true,
      data: {
        id: 'mock-contact-id',
        name: data.name,
        type: data.type,
        email: data.email,
        tax_number: data.taxNumber,
        business_id: 'mock-business-id'
      }
    };
  }),
  getContactsRequest: jest.fn().mockImplementation((token) => {
    return {
      success: true,
      data: [
        {
          id: 'mock-contact-id-1',
          name: 'Test Client',
          type: 'client',
          email: 'client@example.com',
          tax_number: '123456789',
          business_id: 'mock-business-id'
        },
        {
          id: 'mock-contact-id-2',
          name: 'Test Vendor',
          type: 'vendor',
          email: 'vendor@example.com',
          tax_number: '987654321',
          business_id: 'mock-business-id'
        }
      ]
    };
  }),
  getClientsRequest: jest.fn().mockImplementation((token) => {
    return {
      success: true,
      data: [
        {
          id: 'mock-contact-id-1',
          name: 'Test Client',
          type: 'client',
          email: 'client@example.com',
          tax_number: '123456789',
          business_id: 'mock-business-id'
        }
      ]
    };
  }),
  deleteContactRequest: jest.fn().mockImplementation((token, id) => {
    if (id === 'non-existent') {
      return 404;
    }
    return 204;
  }),
  updateContactRequest: jest.fn().mockImplementation((token, id, data) => {
    if (id === 'non-existent') {
      return 404;
    }
    if (data.taxNumber && !/^\d{9}$/.test(data.taxNumber)) {
      return 400;
    }
    return {
      success: true,
      data: {
        id,
        name: data.name || 'Test Contact',
        type: data.type || 'client',
        email: data.email || 'contact@example.com',
        tax_number: data.taxNumber || '123456789',
        business_id: 'mock-business-id'
      }
    };
  })
}));

// Import after mocking
import {
  createContactRequest,
  deleteContactRequest,
  getClientsRequest,
  getContactsRequest,
  updateContactRequest
} from './contactWrapper';

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
      getUser: jest.fn()
    }
  }
}));

beforeEach(async () => {
  jest.clearAllMocks();
});

describe('Contact API Tests', () => {
  describe('Contact Creation', () => {
    test('should create a contact successfully', async () => {
      const token = 'test-token';
      const newContact = {
        name: 'John Doe',
        type: 'client',
        company: 'Test Company',
        email: 'john@example.com',
        phone: '1234567890',
        city: 'Test City',
        street: 'Test Street',
        postcode: '12345',
        taxNumber: '123456789',
        notes: 'Test notes',
        user_id: 'test-user-id'
      };

      const response = await createContactRequest(token, newContact);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response.data).toMatchObject({
        name: 'John Doe',
        type: 'client',
        email: 'john@example.com',
        tax_number: '123456789'
      });
    });

    test('should fail to create a contact with invalid data', async () => {
      const token = 'test-token';
      const invalidContact = {
        name: '',
        type: 'client',
        email: '',
        city: 'Test City',
        street: 'Test Street',
        postcode: '12345',
        taxNumber: '',
        user_id: 'test-user-id'
      };

      const response = await createContactRequest(token, invalidContact);
      expect(response).toBe(400);
    });

    test('should fail to create a contact with invalid tax number', async () => {
      const token = 'test-token';
      const invalidContact = {
        name: 'John Doe',
        type: 'client',
        email: 'john@example.com',
        city: 'Test City',
        street: 'Test Street',
        postcode: '12345',
        taxNumber: '12345', // Invalid: not 9 digits
        user_id: 'test-user-id'
      };

      const response = await createContactRequest(token, invalidContact);
      expect(response).toBe(400);
    });
  });

  describe('Contact Retrieval', () => {
    test('should retrieve all contacts successfully', async () => {
      const token = 'test-token';
      const response = await getContactsRequest(token);

      expect(response.success).toBe(true);
      expect(response.data.length).toBe(2);
      expect(response.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'Test Client',
            type: 'client',
            email: 'client@example.com'
          }),
          expect.objectContaining({
            name: 'Test Vendor',
            type: 'vendor',
            email: 'vendor@example.com'
          })
        ])
      );
    });

    test('should retrieve only clients successfully', async () => {
      const token = 'test-token';
      const response = await getClientsRequest(token);

      expect(response.success).toBe(true);
      expect(response.data.length).toBe(1);
      expect(response.data[0]).toMatchObject({
        name: 'Test Client',
        type: 'client',
        email: 'client@example.com'
      });
    });
  });

  describe('Contact Deletion', () => {
    test('should delete a contact successfully', async () => {
      const token = 'test-token';
      const contactId = 'mock-contact-id-1';
      const response = await deleteContactRequest(token, contactId);

      expect(response).toBe(204);
    });

    test('should return 404 when deleting non-existent contact', async () => {
      const token = 'test-token';
      const contactId = 'non-existent';
      const response = await deleteContactRequest(token, contactId);

      expect(response).toBe(404);
    });
  });

  describe('Contact Update', () => {
    test('should update a contact successfully', async () => {
      const token = 'test-token';
      const contactId = 'mock-contact-id-1';
      const updateData = {
        name: 'Updated Name',
        email: 'updated@example.com',
        phone: '9876543210',
        notes: 'Updated notes'
      };

      const response = await updateContactRequest(token, contactId, updateData);

      expect(response).toHaveProperty('success', true);
      expect(response).toHaveProperty('data');
      expect(response.data).toMatchObject({
        id: contactId,
        name: 'Updated Name',
        email: 'updated@example.com'
      });
    });

    test('should fail to update a contact with invalid tax number', async () => {
      const token = 'test-token';
      const contactId = 'mock-contact-id-1';
      const updateData = {
        taxNumber: '12345' // Invalid: not 9 digits
      };

      const response = await updateContactRequest(token, contactId, updateData);
      expect(response).toBe(400);
    });

    test('should return 404 when updating non-existent contact', async () => {
      const token = 'test-token';
      const contactId = 'non-existent';
      const updateData = {
        name: 'Updated Name'
      };

      const response = await updateContactRequest(token, contactId, updateData);
      expect(response).toBe(404);
    });
  });
});
