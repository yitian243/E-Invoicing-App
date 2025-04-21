import { Request, Response, Router } from 'express';
import validator from 'validator';
import { supabase } from './db';

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
 * Helper function - Middleware to check if required fields are empty
 * @param fields Array of field names to check
 * @param req Request object
 * @param res Response object
 * @returns Boolean indicating if any fields are empty
 */
const checkEmptyFields = (fields: string[], req: Request, res: Response): boolean => {
  for (const field of fields) {
    if (!req.body[field]) {
      res.status(400).json(createErrorResponse(`${field} is required`, 400));
      return true;
    }
  }
  return false;
};

/**
 * Route for user registration (Sign Up)
 * Relies solely on Supabase Auth.
 * @route POST /api/auth/signup
 */
router.post('/signup', async (req: Request, res: Response) => {
  const { name, email, password, role, business_id, avatar } = req.body;

  // --- Validation ---
  if (checkEmptyFields(['name', 'email', 'password', 'role'], req, res)) {
    return;
  }
  if (!validator.isEmail(email)) {
    return res.status(400).json(createErrorResponse('Invalid email format', 400));
  }
  if (password.length < 6) {
    return res.status(400).json(createErrorResponse('Password must be at least 6 characters', 400));
  }
  // --- End Validation ---

  try {
    // 1. Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { // Store additional info in user_metadata
          name,
          role,
          avatar: avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
          business_id: business_id || null,
        },
        // Optional: Add email confirmation redirect URL
        // emailRedirectTo: 'https://your-app.com/welcome'
      }
    });

    // Handle Supabase signup errors (e.g., user already exists)
    if (authError) {
      console.error('Supabase signup error:', authError.message);
      // Use 409 Conflict for existing user and 400 for others might be suitable
      const statusCode = authError.message.includes('already registered') ? 409 : 400;
      return res.status(statusCode).json(createErrorResponse(authError.message, statusCode));
    }

    // Check if user and session data were returned (essential!)
    if (!authData.user || !authData.session) {
      console.error('Supabase signup response missing user or session data');
      // This case might indicate an issue with Supabase config or response
      // Or if email confirmation is required, a session might not be immediately available.
      // Adjust based on your email verification flow.
      // If email confirmation is needed, you might return a success message indicating
      // the user needs to check their email, instead of returning a token immediately.

      // For now, assuming session is expected:
      return res.status(400).json(createErrorResponse('User creation successful, but session data missing.', 400));
      // Or handle the email confirmation case:
      // return res.status(201).json({ success: true, message: 'Signup successful! Please check your email to confirm.' });
    }

    // 2. Prepare user response object from Supabase data
    // We get name, role, etc., directly from user_metadata
    const userResponse = {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.name,
      role: authData.user.user_metadata?.role,
      avatar: authData.user.user_metadata?.avatar,
      business_id: authData.user.user_metadata?.business_id,
      createdAt: authData.user.created_at // Use Supabase's timestamp
    };

    // 3. Send successful response with Supabase session token
    res.status(201).json({
      success: true,
      data: {
        token: authData.session.access_token, // The JWT from Supabase
        user: userResponse,
        session: authData.session // Include the full Supabase session object
      }
    });

  } catch (error: any) { // Catch unexpected errors
    console.error('Unexpected signup error:', error);
    res.status(500).json(createErrorResponse('Internal server error during signup', 500));
  }
});


/**
 * Route for user login
 * Relies solely on Supabase Auth.
 * @route POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // --- Validation ---
  if (checkEmptyFields(['email', 'password'], req, res)) {
    return;
  }
  // Optional: add email format validation here too if desired
  // if (!validator.isEmail(email)) { ... }
  // --- End Validation ---

  try {
    // 1. Sign in user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Handle Supabase signin errors (e.g., invalid credentials)
    if (authError || !authData.user || !authData.session) {
      console.error('Supabase login error:', authError?.message || 'Missing user or session data');
      return res.status(401).json(createErrorResponse('Invalid credentials', 401));
    }

    // 2. Prepare user response object from Supabase data
    const userResponse = {
      id: authData.user.id,
      email: authData.user.email,
      name: authData.user.user_metadata?.name,
      role: authData.user.user_metadata?.role,
      avatar: authData.user.user_metadata?.avatar,
      business_id: authData.user.user_metadata?.business_id, // Add if needed
      lastLogin: authData.user.last_sign_in_at
    };

    // 3. Send successful response with Supabase session token
    res.json({
      success: true,
      data: {
        token: authData.session.access_token, // The JWT from Supabase
        user: userResponse,
        session: authData.session // Include the full Supabase session object
      }
    });

    // Note: Supabase automatically updates `last_sign_in_at` in the `auth.users` table
    // No need to manually update a `last_login` field

  } catch (error: any) { // Catch unexpected errors
    console.error('Unexpected login error:', error);
    res.status(500).json(createErrorResponse('Internal server error during login', 500));
  }
});


/**
 * Route for user logout
 * Relies solely on Supabase Auth.
 * Requires the client's Supabase token for authentication.
 * @route POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json(createErrorResponse('Authentication required', 401));
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json(createErrorResponse('Authentication required', 401));
  }

  try {
    // Verify the token is valid by getting the user
    const { data: userData, error: getUserError } = await supabase.auth.getUser(token);

    if (getUserError || !userData.user) {
      console.error('Invalid token during logout:', getUserError?.message);
      return res.status(401).json(createErrorResponse('Invalid token', 401));
    }

    // Sign out the user's session
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error('Error during logout:', signOutError.message);
      return res.status(500).json(createErrorResponse('Failed to logout', 500));
    }

    res.status(200).json({
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Unexpected error during logout:', error);
    res.status(500).json(createErrorResponse('Internal server error', 500));
  }
});

/**
 * Route to check if an email is already registered
 * Uses Supabase to check if the email exists
 * @route GET /api/auth/check-email/:email
 */
router.get('/check-email/:email', async (req: Request, res: Response) => {
  const email = req.params.email.toLowerCase();

  try {
    // Use Supabase's signInWithOtp to check if the email exists
    // This is a more reliable way to check if an email exists without needing admin privileges
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false // This ensures we only check if the user exists
      }
    });

    // If the error message indicates the user doesn't exist, then the email is available
    const userDoesNotExist = error && error.message.includes('Email not found');
    
    // If there's no error or the error is not about the email not existing, 
    // then the email is already registered
    const emailExists = !userDoesNotExist;
    
    res.json({
      exists: emailExists
    });
  } catch (error) {
    console.error('Unexpected error checking email:', error);
    res.status(500).json(createErrorResponse('Internal server error', 500));
  }
});

/**
 * Route to validate an existing token
 * Uses Supabase to validate the token and return user information
 * @route GET /api/auth/validate-token
 */
router.get('/validate-token', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json(createErrorResponse('No token provided', 401));
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    // Verify the token and get the user
    const { data: userData, error: getUserError } = await supabase.auth.getUser(token);

    if (getUserError || !userData.user) {
      console.error('Invalid token during validation:', getUserError?.message);
      return res.status(403).json(createErrorResponse('Invalid token', 403));
    }

    // Token is valid, return user information
    res.json({
      success: true,
      data: {
        id: userData.user.id,
        email: userData.user.email,
        name: userData.user.user_metadata?.name,
        role: userData.user.user_metadata?.role,
        avatar: userData.user.user_metadata?.avatar,
        lastLogin: userData.user.last_sign_in_at
      }
    });
  } catch (error) {
    console.error('Unexpected error validating token:', error);
    res.status(500).json(createErrorResponse('Internal server error', 500));
  }
});

export default router;
