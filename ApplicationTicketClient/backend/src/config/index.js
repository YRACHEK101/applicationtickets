import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
 
// Get directory name properly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
 
// Load .env from the project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
 
export default {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGO_URI || 'mongodb+srv://hbourijob:gvoY5oHZ5CtjEV7G@ticketdb.tfp9f.mongodb.net/?retryWrites=true&w=majority&appName=TicketDB',
  jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret_for_development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100 ,
  emailUser: process.env.EMAIL_USER || 'test@gmail.com',
  emailPass: process.env.EMAIL_PASS || 'test',
};