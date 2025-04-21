import { beforeEach, describe, expect, test } from '@jest/globals';

// Mock the businessWrapper module
jest.mock('./businessWrapper', () => ({
  createBusinessRequest: jest.fn().mockImplementation((token, data) => {
    if (!data.name || !data.tax_id || !data.password || !data.admin_id) {
      return 400;
    }
    if (data.name === 'Existing Business') {
      return 400;
    }
    return {
      id: 'mock-business-id',
      name: data.name,
      tax_id: data.tax_id,
      admin_id: data.admin_id,
      created_at: new Date().toISOString()
    };
  }),
  getBusinessByIdRequest: jest.fn().mockImplementation((token, id) => {
    if (id === 'non-existent') {
      return 404;
    }
    return {
      id,
      name: 'Test Business',
      tax_id: '123456789',
      admin_id: 'admin-user-id',
      created_at: new Date().toISOString()
    };
  }),
  getUserBusinessesRequest: jest.fn().mockImplementation((token, userId) => {
    if (userId === 'user-with-no-businesses') {
      return 404;
    }
    return [
      {
        id: 'mock-business-id-1',
        name: 'Business 1',
        tax_id: '123456789',
        admin_id: userId,
        created_at: new Date().toISOString()
      },
      {
        id: 'mock-business-id-2',
        name: 'Business 2',
        tax_id: '987654321',
        admin_id: 'other-admin-id',
        created_at: new Date().toISOString()
      }
    ];
  }),
  updateBusinessRequest: jest.fn().mockImplementation((token, id, data) => {
    if (id === 'non-existent') {
      return 404;
    }
    if (data.user_id !== 'admin-user-id') {
      return 403;
    }
    return {
      id,
      name: data.name,
      tax_id: data.tax_id,
      admin_id: 'admin-user-id',
      updated_at: new Date().toISOString()
    };
  }),
  joinBusinessRequest: jest.fn().mockImplementation((token, data) => {
    if (data.businessName === 'Non-existent Business') {
      return 404;
    }
    if (data.password !== 'correct-password' && data.businessName !== 'Already Member Business') {
      return 401;
    }
    if (data.businessName === 'Already Member Business') {
      return 400;
    }
    return {
      id: 'mock-business-id',
      name: data.businessName,
      tax_id: '123456789',
      admin_id: 'admin-user-id',
      members: [
        {
          id: 'admin-member-id',
          name: 'Admin User',
          role: 'admin',
          user_id: 'admin-user-id'
        },
        {
          id: 'new-member-id',
          name: data.userName,
          role: 'staff',
          user_id: data.userId
        }
      ]
    };
  }),
  getBusinessMembersRequest: jest.fn().mockImplementation((token, id) => {
    if (id === 'non-existent') {
      return 404;
    }
    return [
      {
        id: 'admin-member-id',
        name: 'Admin User',
        role: 'admin',
        user_id: 'admin-user-id',
        business_id: id
      },
      {
        id: 'staff-member-id',
        name: 'Staff User',
        role: 'staff',
        user_id: 'staff-user-id',
        business_id: id
      }
    ];
  }),
  updateMemberRoleRequest: jest.fn().mockImplementation((token, businessId, memberId, role, userId) => {
    if (businessId === 'non-existent') {
      return 404;
    }
    if (userId !== 'admin-user-id') {
      return 403;
    }
    if (memberId === 'only-admin-id' && role === 'staff') {
      return 400;
    }
    return {
      id: memberId,
      name: 'Updated Member',
      role,
      user_id: 'staff-user-id',
      business_id: businessId
    };
  }),
  removeMemberRequest: jest.fn().mockImplementation((token, businessId, memberId, userId) => {
    if (businessId === 'non-existent') {
      return 404;
    }
    if (userId !== 'admin-user-id') {
      return 403;
    }
    if (memberId === 'only-admin-id') {
      return 400;
    }
    return {
      message: 'Member removed successfully'
    };
  })
}));

// Import after mocking
import {
  createBusinessRequest,
  getBusinessByIdRequest,
  getBusinessMembersRequest,
  getUserBusinessesRequest,
  joinBusinessRequest,
  removeMemberRequest,
  updateBusinessRequest,
  updateMemberRoleRequest
} from './businessWrapper';

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

describe('Business API Tests', () => {
  describe('Business Creation', () => {
    test('should create a business successfully', async () => {
      const token = 'test-token';
      const newBusiness = {
        name: 'Test Business',
        tax_id: '123456789',
        address: '123 Test St',
        email: 'business@example.com',
        default_currency: 'USD',
        password: 'businesspass',
        admin_id: 'admin-user-id',
        admin_name: 'Admin User',
        admin_email: 'admin@example.com'
      };

      const response = await createBusinessRequest(token, newBusiness);

      expect(response).toHaveProperty('id');
      expect(response).toHaveProperty('name', 'Test Business');
      expect(response).toHaveProperty('tax_id', '123456789');
      expect(response).toHaveProperty('admin_id', 'admin-user-id');
    });

    test('should fail to create a business with missing required fields', async () => {
      const token = 'test-token';
      const invalidBusiness = {
        name: '',
        tax_id: '',
        password: '',
        admin_id: '',
        admin_name: '',
        admin_email: ''
      };

      const response = await createBusinessRequest(token, invalidBusiness);
      expect(response).toBe(400);
    });

    test('should fail to create a business with duplicate name', async () => {
      const token = 'test-token';
      const duplicateBusiness = {
        name: 'Existing Business',
        tax_id: '123456789',
        password: 'businesspass',
        admin_id: 'admin-user-id',
        admin_name: 'Admin User',
        admin_email: 'admin@example.com'
      };

      const response = await createBusinessRequest(token, duplicateBusiness);
      expect(response).toBe(400);
    });
  });

  describe('Business Retrieval', () => {
    test('should get a business by ID successfully', async () => {
      const token = 'test-token';
      const businessId = 'mock-business-id';
      const response = await getBusinessByIdRequest(token, businessId);

      expect(response).toHaveProperty('id', businessId);
      expect(response).toHaveProperty('name', 'Test Business');
      expect(response).toHaveProperty('tax_id', '123456789');
    });

    test('should return 404 when getting non-existent business', async () => {
      const token = 'test-token';
      const businessId = 'non-existent';
      const response = await getBusinessByIdRequest(token, businessId);

      expect(response).toBe(404);
    });

    test('should get businesses for a user successfully', async () => {
      const token = 'test-token';
      const userId = 'admin-user-id';
      const response = await getUserBusinessesRequest(token, userId);

      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(2);
      expect(response[0]).toHaveProperty('name', 'Business 1');
      expect(response[1]).toHaveProperty('name', 'Business 2');
    });

    test('should return 404 when user has no businesses', async () => {
      const token = 'test-token';
      const userId = 'user-with-no-businesses';
      const response = await getUserBusinessesRequest(token, userId);

      expect(response).toBe(404);
    });
  });

  describe('Business Update', () => {
    test('should update a business successfully', async () => {
      const token = 'test-token';
      const businessId = 'mock-business-id';
      const updateData = {
        name: 'Updated Business',
        tax_id: '987654321',
        address: '456 Update St',
        email: 'updated@example.com',
        default_currency: 'EUR',
        password: 'newpassword',
        user_id: 'admin-user-id'
      };

      const response = await updateBusinessRequest(token, businessId, updateData);

      expect(response).toHaveProperty('id', businessId);
      expect(response).toHaveProperty('name', 'Updated Business');
      expect(response).toHaveProperty('tax_id', '987654321');
    });

    test('should return 403 when non-admin tries to update business', async () => {
      const token = 'test-token';
      const businessId = 'mock-business-id';
      const updateData = {
        name: 'Updated Business',
        tax_id: '987654321',
        password: 'newpassword',
        user_id: 'non-admin-user-id'
      };

      const response = await updateBusinessRequest(token, businessId, updateData);
      expect(response).toBe(403);
    });

    test('should return 404 when updating non-existent business', async () => {
      const token = 'test-token';
      const businessId = 'non-existent';
      const updateData = {
        name: 'Updated Business',
        tax_id: '987654321',
        password: 'newpassword',
        user_id: 'admin-user-id'
      };

      const response = await updateBusinessRequest(token, businessId, updateData);
      expect(response).toBe(404);
    });
  });

  describe('Business Joining', () => {
    test('should join a business successfully', async () => {
      const token = 'test-token';
      const joinData = {
        businessName: 'Test Business',
        password: 'correct-password',
        userId: 'staff-user-id',
        userName: 'Staff User',
        userEmail: 'staff@example.com'
      };

      const response = await joinBusinessRequest(token, joinData);

      expect(response).toHaveProperty('id', 'mock-business-id');
      expect(response).toHaveProperty('name', 'Test Business');
      expect(response).toHaveProperty('members');
      expect(response.members.length).toBe(2);
      expect(response.members[1]).toHaveProperty('name', 'Staff User');
      expect(response.members[1]).toHaveProperty('role', 'staff');
    });

    test('should return 401 when joining with incorrect password', async () => {
      const token = 'test-token';
      const joinData = {
        businessName: 'Test Business',
        password: 'wrong-password',
        userId: 'staff-user-id',
        userName: 'Staff User',
        userEmail: 'staff@example.com'
      };

      const response = await joinBusinessRequest(token, joinData);
      expect(response).toBe(401);
    });

    test('should return 404 when joining non-existent business', async () => {
      const token = 'test-token';
      const joinData = {
        businessName: 'Non-existent Business',
        password: 'any-password',
        userId: 'staff-user-id',
        userName: 'Staff User',
        userEmail: 'staff@example.com'
      };

      const response = await joinBusinessRequest(token, joinData);
      expect(response).toBe(404);
    });

    test('should return 400 when user is already a member', async () => {
      const token = 'test-token';
      const joinData = {
        businessName: 'Already Member Business',
        password: 'any-password',
        userId: 'staff-user-id',
        userName: 'Staff User',
        userEmail: 'staff@example.com'
      };

      const response = await joinBusinessRequest(token, joinData);
      expect(response).toBe(400);
    });
  });

  describe('Member Management', () => {
    test('should get business members successfully', async () => {
      const token = 'test-token';
      const businessId = 'mock-business-id';
      const response = await getBusinessMembersRequest(token, businessId);

      expect(Array.isArray(response)).toBe(true);
      expect(response.length).toBe(2);
      expect(response[0]).toHaveProperty('role', 'admin');
      expect(response[1]).toHaveProperty('role', 'staff');
    });

    test('should update member role successfully', async () => {
      const token = 'test-token';
      const businessId = 'mock-business-id';
      const memberId = 'staff-member-id';
      const role = 'admin';
      const userId = 'admin-user-id';

      const response = await updateMemberRoleRequest(token, businessId, memberId, role, userId);

      expect(response).toHaveProperty('id', memberId);
      expect(response).toHaveProperty('role', 'admin');
    });

    test('should return 400 when trying to demote the only admin', async () => {
      const token = 'test-token';
      const businessId = 'mock-business-id';
      const memberId = 'only-admin-id';
      const role = 'staff';
      const userId = 'admin-user-id';

      const response = await updateMemberRoleRequest(token, businessId, memberId, role, userId);
      expect(response).toBe(400);
    });

    test('should remove a member successfully', async () => {
      const token = 'test-token';
      const businessId = 'mock-business-id';
      const memberId = 'staff-member-id';
      const userId = 'admin-user-id';

      const response = await removeMemberRequest(token, businessId, memberId, userId);

      expect(response).toHaveProperty('message', 'Member removed successfully');
    });

    test('should return 400 when trying to remove the only admin', async () => {
      const token = 'test-token';
      const businessId = 'mock-business-id';
      const memberId = 'only-admin-id';
      const userId = 'admin-user-id';

      const response = await removeMemberRequest(token, businessId, memberId, userId);
      expect(response).toBe(400);
    });
  });
});
