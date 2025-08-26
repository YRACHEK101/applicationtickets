import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import Ticket from '../models/Ticket.model.js';

const allowedMimeTypes = [
  'image/jpeg', 'image/png', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'server/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // For comments
    if (req.originalUrl.includes('/comments')) {
      try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
          return cb(new Error('Ticket not found'));
        }
        
        const folderName = ticket.number.replace(/[^a-zA-Z0-9-_]/g, "-");
        const commentDir = path.join(uploadDir, 'ticket', folderName, 'comments');
        
        if (!fs.existsSync(commentDir)) {
          fs.mkdirSync(commentDir, { recursive: true });
        }
        cb(null, commentDir);
      } catch (error) {
        cb(error);
      }
    }
    // For new tickets
    else if (req.body.title) {
      const folderName = req.body.title
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .toLowerCase();
      const ticketDir = path.join(uploadDir, 'ticket', folderName);
      
      if (!fs.existsSync(ticketDir)) {
        fs.mkdirSync(ticketDir, { recursive: true });
      }
      cb(null, ticketDir);
    }
    // Fallback
    else {
      const tempDir = path.join(uploadDir, 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      cb(null, tempDir);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  allowedMimeTypes.includes(file.mimetype) 
    ? cb(null, true) 
    : cb(new Error('Only images, PDFs, Word and Excel files are allowed'), false);
};

export default multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});