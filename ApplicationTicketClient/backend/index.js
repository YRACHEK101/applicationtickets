import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import v1Routes from './routes/v1/index.js';
import connectDB from './src/config/database.js';
import config from './src/config/index.js';

import http from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();
console.log('JWT_SECRET:', process.env.JWT_SECRET);

// Log database connection info based on selected database
if (config.usePostgres) {
  console.log('Using PostgreSQL database');
  console.log(`PostgreSQL connection: ${config.postgresHost}:${config.postgresPort}/${config.postgresDatabase}`);
} else {
  console.log('Using MongoDB database');
  console.log('MONGODB_URI:', process.env.MONGODB_URI);
}

// Set up __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Initialize express app
const app = express();
const server = http.createServer(app);

// ✅ Cleaned-up CORS origins (no paths!)
const allowedOrigins = [
  'http://demo.app.ticketclient.liadtech-hosting.com:8080',
  'https://demo.app.ticketclient.liadtech-hosting.com',
  'http://10.10.11.18',
  'http://10.10.11.18:3000',
  'http://10.10.11.18:80',
  'http://10.10.12.18:5000',
  'http://10.10.12.18',
  'http://localhost:3000',
  'http://localhost:5000',
  'http://127.0.0.1',
  'http://127.0.0.1:80',
  'http://51.77.188.132:5000'
];

// ✅ Apply global CORS middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// ✅ Handle OPTIONS preflight requests for all routes
app.options('*', cors());

// Configure Socket.IO CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Make Socket.IO available to routes via app.set
app.set('io', io);

// Basic parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database (MongoDB or PostgreSQL based on config)
connectDB()
  .then(() => console.log('✅ Database connection established'))
  .catch((err) => console.error('❌ Database connection error:', err));

// Serve static uploads
app.use('/server/uploads', express.static(path.join(__dirname, 'server', 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/v1', v1Routes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Start HTTP server with Socket.IO
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
