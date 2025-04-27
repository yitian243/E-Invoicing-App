import { Request, Response, Router } from 'express';
import { supabaseAdmin } from './db';

// Initialize router
const router = Router();

/**
 * Helper function to create consistent error responses
 * @param message Error message
 * @param statusCode HTTP status code
 * @returns Formatted error response
 */
const createErrorResponse = (message: string, statusCode: number) => {
  return {
    error: message,
    code: statusCode
  };
};

/**
 * Helper function to authenticate the request using token
 * @param req Request object
 * @returns Object containing authentication status and user data if successful
 */
async function authenticateRequest(req: Request) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return { authenticated: false, error: 'Authentication required' };
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return { authenticated: false, error: 'Authentication required' };
  }

  try {
    // Verify the token and get the user using admin client
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      console.error('Invalid token during profile request:', error?.message);
      return { authenticated: false, error: 'Invalid token' };
    }

    // Authentication successful
    return { authenticated: true, user: data.user };
  } catch (error) {
    console.error('Unexpected error during authentication:', error);
    return { authenticated: false, error: 'Authentication error' };
  }
}

/**
 * Route to get user profile
 * @route GET /api/profile/:userId
 */
router.get('/:userId', async (req: Request, res: Response) => {
  const userId = req.params.userId;
  
  // Authenticate request
  const auth = await authenticateRequest(req);
  
  if (!auth.authenticated) {
    return res.status(401).json(createErrorResponse(auth.error, 401));
  }
  
  // Verify user is requesting their own profile
  if (userId !== auth.user.id) {
    return res.status(403).json(createErrorResponse('Access denied', 403));
  }
  
  try {
    // Return basic user info from auth
    const userData = {
      id: auth.user.id,
      email: auth.user.email,
      name: auth.user.user_metadata?.name,
      role: auth.user.user_metadata?.role,
      avatar: auth.user.user_metadata?.avatar,
      phone: auth.user.user_metadata?.phone || null,
      address: auth.user.user_metadata?.address || null
    };
    
    res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json(createErrorResponse('Internal server error', 500));
  }
});

/**
 * Route to update user profile
 * @route PUT /api/profile/:userId
 */
router.put('/:userId', async (req: Request, res: Response) => {
  console.log('Profile update request received');
  const userId = req.params.userId;
  
  // Authenticate request
  const auth = await authenticateRequest(req);
  
  if (!auth.authenticated) {
    console.error('Authentication failed:', auth.error);
    return res.status(401).json(createErrorResponse(auth.error, 401));
  }
  
  // Verify user is updating their own profile
  if (userId !== auth.user.id) {
    return res.status(403).json(createErrorResponse('Access denied', 403));
  }
  
  const { name, email, phone, address, avatar } = req.body;
  console.log('Update data received:', { name, email, phone, address });
  
  try {
    // Update the auth user using admin client
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        // Only include email if it's changing
        ...(email && email !== auth.user.email ? { email } : {}),
        // Update user metadata
        user_metadata: { 
          name,
          phone,
          address,
          avatar,
          // Preserve existing role
          role: auth.user.user_metadata?.role
        }
      }
    );
    
    if (error) {
      console.error('Error updating user:', error);
      return res.status(400).json(createErrorResponse(error.message, 400));
    }
    
    // Return updated user data
    const updatedUserData = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name,
      role: data.user.user_metadata?.role,
      avatar: data.user.user_metadata?.avatar,
      phone: data.user.user_metadata?.phone || null,
      address: data.user.user_metadata?.address || null
    };
    
    // Update timestamp in any business where this user is a member
    try {
      const { data: memberships } = await supabaseAdmin
        .schema('business')
        .from('members')
        .select('business_id')
        .eq('user_id', userId);
      
      if (memberships && memberships.length > 0) {
        const businessIds = memberships.map(member => member.business_id);
        
        await supabaseAdmin
          .schema('business')
          .from('businesses')
          .update({ updated_at: new Date().toISOString() })
          .in('id', businessIds);
      }
    } catch (updateError) {
      console.error('Error updating business timestamps:', updateError);
      // Don't fail the request if this update fails
    }
    
    res.status(200).json({
      success: true,
      data: updatedUserData,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json(createErrorResponse('Internal server error', 500));
  }
});

export default router;