import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const BACKEND_PORT = process.env.BACKEND_PORT;
