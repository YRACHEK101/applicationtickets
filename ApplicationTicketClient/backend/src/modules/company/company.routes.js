import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth, authorize } from '../../middleware/auth.middleware.js';
import * as companyController from '../../controllers/company.controller.js';
import Company from './Company.model.js';  // Add this import

const router = express.Router();

// Multer config
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      let companyName;

      // For document upload route, get company name from database
      if (req.params.id) {
        const company = await Company.findById(req.params.id);
        if (!company) {
          return cb(new Error('Company not found'));
        }
        companyName = company.name;
      } else if (req.body.name) {
        // For company creation, get name from body
        companyName = req.body.name;
      } else {
        return cb(new Error('Company name is required'));
      }

      // Generate the folder path based on the company name
      const sanitizedCompanyName = companyName.trim().replace(/[^a-zA-Z0-9]/g, '_');
      const baseUploadPath = path.join('server', 'uploads', 'companies', sanitizedCompanyName);
      
      // Create the folder if it doesn't exist
      if (!fs.existsSync(baseUploadPath)) {
        fs.mkdirSync(baseUploadPath, { recursive: true });
      }

      cb(null, baseUploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}-${sanitizedName}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, JPEG, PNG'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter,
});

// Routes
router.get('/', auth, authorize(['admin', 'agentCommercial']), companyController.getAllCompanies);
router.get('/:id', auth, companyController.getCompanyById);
router.post(
  '/',
  auth,
  authorize(['admin', 'agentCommercial']),
  upload.array('files', 5), // Allow up to 5 files
  companyController.createCompany
);
router.put(
  '/:id',
  auth,
  authorize(['admin', 'agentCommercial']),
  upload.array('files', 5), // Allow up to 5 files
  companyController.updateCompany
);

router.delete('/:id', auth, authorize(['admin', 'agentCommercial']), companyController.deleteCompany);
// Route for uploading a document
router.post('/:id/documents', auth, upload.single('document'), companyController.uploadCompanyDocument);
router.get('/:id/documents/:filename', auth, companyController.downloadCompanyDocument);
router.delete('/:id/documents/:documentId', auth, authorize(['admin', 'agentCommercial']), companyController.deleteCompanyDocument);
router.put('/:id/billing', auth, companyController.updateBillingMethod);
router.post('/:id/availability', auth, authorize(['admin', 'agentCommercial', 'client']), companyController.addAvailabilitySlotsToCompany)

export default router;