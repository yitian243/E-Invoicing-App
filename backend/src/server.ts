import cors from 'cors';
import express, { Request, Response } from 'express';
import authRoutes from './auth';
import businessRoutes from './business';
import { BACKEND_PORT } from './config';
import { initializeDataStore, resetDataStore } from './dataStore';
import invoiceRoutes from './invoice';
import contactRoutes from './contact'

// Initialise app
const app = express();
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/business', businessRoutes);
app.use('/api/invoice', invoiceRoutes);
app.use('/api/contact', contactRoutes)

// Testing Endpoint
app.delete('/api/testing/clear-users', (req: Request, res: Response) => {
  resetDataStore();
  res.json({ success: true });
});

// Initialising temporary data store
initializeDataStore();

// Start Server
app.listen(BACKEND_PORT, () => {
  console.log(`Server running on ${BACKEND_PORT}`);
});

export default app;
