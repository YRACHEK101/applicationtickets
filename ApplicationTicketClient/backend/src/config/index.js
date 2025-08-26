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
  // MongoDB configuration (legacy)
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/app_ticket_db',
  // PostgreSQL configuration
  postgresHost: process.env.POSTGRES_HOST || 'localhost',
  postgresPort: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
  postgresUser: process.env.POSTGRES_USER || 'postgres',
  postgresPassword: process.env.POSTGRES_PASSWORD || 'postgres',
  postgresDatabase: process.env.POSTGRES_DB || 'app_ticket_db',
  // Use PostgreSQL instead of MongoDB
  usePostgres: process.env.USE_POSTGRES === 'true' || true,
  // Other configurations
  jwtSecret: process.env.JWT_SECRET || 'fallback_jwt_secret_for_development',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  emailUser: process.env.EMAIL_USER || 'test@gmail.com',
  emailPass: process.env.EMAIL_PASS || 'test',
};