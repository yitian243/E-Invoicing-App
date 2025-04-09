import { Request, Response, Router, NextFunction } from 'express';
import validator from 'validator';
import HttpError from 'http-errors';
import { 
  getData, 
  setData, 
  getUsers, 
  getHash, 
  generateToken,
  validateToken,
  User 
} from './dataStore.js';
import { TokenPayload } from './types.js';

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
 * Middleware to check if required fields are empty
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
 * Middleware to authenticate token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.token as string;
  
  if (!token) {
    res.status(401).json(createErrorResponse('Authentication required', 401));
    return;
  }
  
  const userId = validateToken(token);
  if (userId === null) {
    res.status(403).json(createErrorResponse('Invalid token', 403));
    return;
  }
  
  req.userId = userId;
  next();
};

/**
 * Route for user login
 * @route POST /api/auth/login
 */
router.post('/login', (req: Request, res: Response): void => {
  const { email, password } = req.body;
  
  // Check if email and password are provided
  if (checkEmptyFields(['email', 'password'], req, res)) {
    return;
  }
  
  const data = getData();
  const user = data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  // Check if user exists and password matches
  if (!user || user.password !== getHash(password)) {
    res.status(401).json(createErrorResponse('Invalid email or password', 401));
    return;
  }
  
  // Generate new token
  const newToken = generateToken();
  
  // Add token to user's tokens array
  const userIndex = data.users.findIndex(u => u.id === user.id);
  if (!data.users[userIndex].tokens) {
    data.users[userIndex].tokens = [];
  }
  data.users[userIndex].tokens.push(newToken);
  
  // Update last login timestamp
  data.users[userIndex].lastLogin = new Date();
  
  // Save updated data
  setData(data);
  
  // Get updated user
  const updatedUser = data.users[userIndex];
  
  // Create user response (without sensitive data)
  const userResponse = {
    id: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    business_id: updatedUser.business_id,
    avatar: updatedUser.avatar,
    lastLogin: updatedUser.lastLogin
  };
  
  // Send response with hashed token
  res.json({
    success: true,
    data: {
      token: getHash(newToken),
      user: userResponse
    }
  });
});

/**
 * Route for user registration
 * @route POST /api/auth/signup
 */
router.post('/signup', (req: Request, res: Response): void => {
  const { name, email, password, role, business_id, avatar } = req.body;
  
  // Check if required fields are provided
  if (checkEmptyFields(['name', 'email', 'password', 'role'], req, res)) {
    return;
  }
  
  // Validate email format
  if (!validator.isEmail(email)) {
    res.status(400).json(createErrorResponse('Invalid email format', 400));
    return;
  }
  
  // Validate password length (minimum 6 characters)
  if (password.length < 6) {
    res.status(400).json(createErrorResponse('Password must be at least 6 characters', 400));
    return;
  }
  
  const data = getData();
  
  // Check if email is already registered
  if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    res.status(409).json(createErrorResponse('Email already registered', 409));
    return;
  }
  
  // Generate new user ID
  const newId = data.usersTotal + 1;
  data.usersTotal += 1;
  
  // Create new user object
  const newUser: User = {
    id: newId,
    name,
    email,
    password: getHash(password), // Hash the password
    role,
    business_id: business_id || 1,
    avatar: avatar || 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
    tokens: [],
    lastLogin: new Date(),
    createdAt: new Date()
  };
  
  // Add user to data store
  data.users.push(newUser);
  setData(data);
  
  // Create user response (without sensitive data)
  const userResponse = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    business_id: newUser.business_id,
    avatar: newUser.avatar,
    createdAt: newUser.createdAt
  };
  
  // Send response
  res.status(201).json({
    success: true,
    data: userResponse
  });
});

/**
 * Route for user logout
 * @route POST /api/auth/logout
 */
router.post('/logout', authenticateToken, (req: Request, res: Response): void => {
  const token = req.headers.token as string;
  const userId = req.userId;
  
  const data = getData();
  const userIndex = data.users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    res.status(403).json(createErrorResponse('Invalid user', 403));
    return;
  }
  
  // Find and remove the token
  const user = data.users[userIndex];
  for (let i = 0; i < user.tokens.length; i++) {
    if (getHash(user.tokens[i]) === token) {
      user.tokens.splice(i, 1);
      setData(data);
      res.json({ success: true });
      return;
    }
  }
  
  // If we get here, token wasn't found (shouldn't happen due to middleware)
  res.status(403).json(createErrorResponse('Invalid token', 403));
});

/**
 * Route to check if an email is already registered
 * @route GET /api/auth/check-email/:email
 */
router.get('/check-email/:email', (req: Request, res: Response): void => {
  const email = req.params.email.toLowerCase();
  const users = getUsers();
  
  const existingUser = users.find(u => u.email.toLowerCase() === email);
  const emailExists = !!existingUser;
  
  res.json({
    exists: emailExists
  });
});

/**
 * Extend the Express Request interface to include userId
 */
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export default router;