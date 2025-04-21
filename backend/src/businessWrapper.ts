import { BACKEND_PORT } from './config';

const SERVER_URL = `http://localhost:${BACKEND_PORT}`;
const API_PREFIX = '/api/business';

/**
 * Create a new business
 */
export async function createBusinessRequest(token: string, businessData: {
  name: string;
  tax_id: string;
  address?: string;
  email?: string;
  default_currency?: string;
  password: string;
  admin_id: string;
  admin_name: string;
  admin_email: string;
}) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(businessData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Create business request failed:', error);
    return 500;
  }
}

/**
 * Get business by ID
 */
export async function getBusinessByIdRequest(token: string, businessId: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/${businessId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Get business request failed:', error);
    return 500;
  }
}

/**
 * Get businesses for a user
 */
export async function getUserBusinessesRequest(token: string, userId: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/user/${userId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Get user businesses request failed:', error);
    return 500;
  }
}

/**
 * Update a business
 */
export async function updateBusinessRequest(token: string, businessId: string, updateData: {
  name: string;
  tax_id: string;
  address?: string;
  email?: string;
  default_currency?: string;
  password: string;
  user_id: string;
}) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/${businessId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Update business request failed:', error);
    return 500;
  }
}

/**
 * Join an existing business
 */
export async function joinBusinessRequest(token: string, joinData: {
  businessName: string;
  password: string;
  userId: string;
  userName: string;
  userEmail: string;
}) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(joinData)
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Join business request failed:', error);
    return 500;
  }
}

/**
 * Get business members
 */
export async function getBusinessMembersRequest(token: string, businessId: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/${businessId}/members`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Get business members request failed:', error);
    return 500;
  }
}

/**
 * Update member role
 */
export async function updateMemberRoleRequest(token: string, businessId: string, memberId: string, role: string, userId: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/${businessId}/members/${memberId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        role,
        user_id: userId
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Update member role request failed:', error);
    return 500;
  }
}

/**
 * Remove member from business
 */
export async function removeMemberRequest(token: string, businessId: string, memberId: string, userId: string) {
  try {
    const response = await fetch(`${SERVER_URL}${API_PREFIX}/${businessId}/members/${memberId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        user_id: userId
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      return response.status;
    }
    
    return data;
  } catch (error) {
    console.error('Remove member request failed:', error);
    return 500;
  }
}
