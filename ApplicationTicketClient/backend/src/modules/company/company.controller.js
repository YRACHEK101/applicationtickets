import * as companyService from '../services/company.service.js';
import Company from '../models/Company.model.js';
import fs from 'fs';
import path from 'path';

// GET /companies
export const getAllCompanies = async (req, res) => {
  await companyService.getAllCompanies(req, res);
};

// GET /companies/:id
export const getCompanyById = async (req, res) => {
  await companyService.getCompanyById(req, res);
};

// POST /companies
export const createCompany = async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.contactPerson) {
      return res.status(400).json({ message: 'Name and contact person are required' });
    }

    // Check if the company name already exists
    const existingCompany = await Company.findOne({ name: req.body.name.trim() });
    if (existingCompany) {
      return res.status(400).json({ message: 'A company with this name already exists' });
    }

    const contactPerson = JSON.parse(req.body.contactPerson);
    if (!contactPerson.name || !contactPerson.email) {
      return res.status(400).json({ message: 'Contact person name and email are required' });
    }

    const address = JSON.parse(req.body.address);
    if (!address.street || !address.city || !address.zipCode || !address.country) {
      return res.status(400).json({ message: 'Address fields are required' });
    }

    // Extract files
    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [];

    // Prepare company data
    const companyData = {
      name: req.body.name.trim(),
      address,
      contactPerson,
      billingMethod: req.body.billingMethod || 'hourly',
      contacts: req.body.contacts ? JSON.parse(req.body.contacts) : [],
      availabilitySlots: req.body.availabilitySlots ? JSON.parse(req.body.availabilitySlots) : [],
    };

    // Call the service to create the company
    const newCompany = await companyService.createCompany(companyData, req.user.id, files);

    res.status(201).json(newCompany);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      message: error.message || 'Server error',
      errors: error.errors,
    });
  }
};

export const uploadCompanyDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const company = await Company.findById(req.params.id);
    if (!company) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check authorization
    if (req.user.role === 'client') {
      const User = (await import('../models/User.model.js')).default;
      const user = await User.findById(req.user.id);
      if (!user.company || user.company.toString() !== company._id.toString()) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'agentCommercial') {
      if (company.commercialAgent?.toString() !== req.user.id) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (!['admin'].includes(req.user.role)) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Access denied' });
    }

    // Store relative path consistently
    const sanitizedCompanyName = company.name.trim().replace(/[^a-zA-Z0-9]/g, '_');
    const relativePath = `companies/${sanitizedCompanyName}/${path.basename(req.file.path)}`;

    const newDocument = {
      name: req.body.name || req.file.originalname,
      fileType: path.extname(req.file.originalname).substring(1),
      filePath: relativePath, // Store relative path only
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    };

    company.documents.push(newDocument);
    await company.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument,
    });
  } catch (error) {
    console.error('Upload document error:', error);
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error removing file after upload error:', unlinkError);
      }
    }
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

export const downloadCompanyDocument = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check authorization
    if (req.user.role === 'client') {
      const User = (await import('../models/User.model.js')).default;
      const user = await User.findById(req.user.id);
      if (!user.company || user.company.toString() !== company._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Find document by filename (extract filename from filePath)
    const requestedFilename = req.params.filename;
    const document = company.documents.find((doc) => {
      const docFilename = path.basename(doc.filePath);
      return docFilename === requestedFilename;
    });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Construct full file path
    const fullPath = path.resolve('server', 'uploads', document.filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Serve the file
    res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.sendFile(fullPath);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ message: 'Server error', details: error.message });
  }
};

// PUT /companies/:id
export const updateCompany = async (req, res) => {
  try {
    const companyId = req.params.id;

    // Find the company
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if files to remove are provided
    const filesToRemove = req.body.filesToRemove ? JSON.parse(req.body.filesToRemove) : [];

    // Remove files from the database and filesystem
    if (filesToRemove.length > 0) {
      filesToRemove.forEach((fileId) => {
        const fileIndex = company.documents.findIndex((doc) => doc._id.toString() === fileId);
        if (fileIndex !== -1) {
          const filePath = company.documents[fileIndex].filePath;

          // Remove the file from the filesystem
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }

          // Remove the file from the database
          company.documents.splice(fileIndex, 1);
        }
      });
    }

    // Update company fields
    const updatedData = {
      name: req.body.name,
      address: req.body.address ? JSON.parse(req.body.address) : company.address,
      contactPerson: req.body.contactPerson ? JSON.parse(req.body.contactPerson) : company.contactPerson,
      billingMethod: req.body.billingMethod || company.billingMethod,
      contacts: req.body.contacts ? JSON.parse(req.body.contacts) : company.contacts,
      availabilitySlots: req.body.availabilitySlots
        ? JSON.parse(req.body.availabilitySlots)
        : company.availabilitySlots,
    };

    // Update the company object
    Object.assign(company, updatedData);

    // Handle new file uploads
    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : [];
    if (files.length > 0) {
      const sanitizedCompanyName = company.name.trim().replace(/[^a-zA-Z0-9]/g, '_');
      const newDocuments = files.map((file) => ({
        name: file.originalname,
        fileType: path.extname(file.originalname).substring(1),
        filePath: `companies/${sanitizedCompanyName}/${file.filename}`, // Relative path
        uploadedBy: req.user.id,
        uploadedAt: new Date(),
      }));
      company.documents.push(...newDocuments);
    }

    // Save the updated company
    await company.save();

    res.status(200).json({ message: 'Company updated successfully', company });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


// DELETE /companies/:id/documents/:documentId
export const deleteCompanyDocument = async (req, res) => {
  await companyService.deleteCompanyDocument(req, res);
};

// PUT /companies/:id/billing
export const updateBillingMethod = async (req, res) => {
  await companyService.updateBillingMethod(req, res);
};

//delete company
export const deleteCompany = async (req, res) => {
  await companyService.deleteCompany(req, res);
};

export const addAvailabilitySlotsToCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { availabilitySlots } = req.body;

    await companyService.addAvailabilityToCompany(id, availabilitySlots, req.user, res);
  } catch (error) {
    console.error('Add availability slots controller error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
