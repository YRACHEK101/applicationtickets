import Company from './Company.model.js';
import User from '../../../server/models/User.model.js';
import path from 'path';
import fs from 'fs';

// Get all companies
export const getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('commercialAgent', 'firstName lastName email');
    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get company by ID
export const getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
      .populate('commercialAgent', 'firstName lastName email');
    if (!company) return res.status(404).json({ message: 'Company not found' });

    if (req.user.role === 'client') {
      const user = await User.findById(req.user.id);
      if (!user.company || user.company.toString() !== company._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (['projectManager', 'developer'].includes(req.user.role)) {
      return res.json({
        _id: company._id,
        name: company.name,
        contactPerson: {
          name: company.contactPerson.name,
          position: company.contactPerson.position
        },
        availabilitySlots: company.availabilitySlots
      });
    }

    res.json(company);
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new company
export const createCompany = async (companyData, userId, files) => {
  try {
    const { name, address, contacts, billingMethod, contactPerson, availabilitySlots } = companyData;

    // Validate required fields
    if (!name || !contactPerson || !contactPerson.name || !contactPerson.email) {
      throw new Error('Please provide required company information');
    }

    // Prepare company object
    const companyObj = {
      name,
      address,
      contacts: contacts || [],
      billingMethod: billingMethod || 'hourly',
      contactPerson,
      availabilitySlots: availabilitySlots || [],
      commercialAgent: userId,
      createdBy: userId,
    };

    // Handle file uploads
    if (files && files.length > 0) {
      const sanitizedCompanyName = name.trim().replace(/[^a-zA-Z0-9]/g, '_'); 
      companyObj.documents = files.map((file) => ({
        name: file.originalname,
        fileType: path.extname(file.originalname).substring(1),
        filePath: `companies/${sanitizedCompanyName}/${file.filename}`, // Relative path
        uploadedBy: userId,
        uploadedAt: new Date(),
      }));
    }

    // Save the company
    const newCompany = new Company(companyObj);
    await newCompany.save();

    return newCompany;
  } catch (error) {
    console.error('Create company error:', error);
    throw new Error('Error creating company: ' + error.message);
  }
};

// Update company
export const updateCompany = async (req, res) => {
  try {
    if (req.user.role === 'commercial') {
      const company = await Company.findById(req.params.id);
      if (!company) return res.status(404).json({ message: 'Company not found' });
      if (company.commercialAgent.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedCompany) return res.status(404).json({ message: 'Company not found' });
    res.json(updatedCompany);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Upload document
// Upload document
export const uploadCompanyDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    if (req.file.size > 10 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File size exceeds 10MB limit' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Company not found' });
    }

    if (req.user.role === 'client') {
      const user = await User.findById(req.user.id);
      if (!user.company || user.company.toString() !== company._id.toString()) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role === 'commercial') {
      if (company.commercialAgent.toString() !== req.user.id) {
        fs.unlinkSync(req.file.path);
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (req.user.role !== 'admin') {
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
      uploadedAt: new Date()
    };

    company.documents.push(newDocument);
    await company.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: newDocument
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
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete document
export const deleteCompanyDocument = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    if (req.user.role === 'commercial' &&
        company.commercialAgent.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const index = company.documents.findIndex(
      doc => doc._id.toString() === req.params.documentId
    );

    if (index === -1) return res.status(404).json({ message: 'Document not found' });

    const filePath = company.documents[index].filePath;
    company.documents.splice(index, 1);
    await company.save();

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update billing
export const updateBillingMethod = async (req, res) => {
  try {
    const { billingMethod } = req.body;

    if (!['hourly', 'perTask', 'subscription'].includes(billingMethod)) {
      return res.status(400).json({ message: 'Invalid billing method' });
    }

    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    if (req.user.role === 'client') {
      const user = await User.findById(req.user.id);
      if (!user.company || user.company.toString() !== company._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    company.billingMethod = billingMethod;
    await company.save();

    res.json({ message: 'Billing method updated successfully', billingMethod });
  } catch (error) {
    console.error('Update billing error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//delete company
export const deleteCompany = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    if (req.user.role === 'admin' || req.user.role === 'agentCommercial') {
      await Company.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Company deleted successfully' });
    }

    res.status(403).json({ message: 'Access denied' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addAvailabilityToCompany = async (companyId, availabilitySlots, user, res) => {
  try {
    // Validate input
    if (!companyId) {
      return res.status(400).json({ message: 'Company ID is required' });
    }
    
    if (!availabilitySlots || !Array.isArray(availabilitySlots) || availabilitySlots.length === 0) {
      return res.status(400).json({ message: 'Valid availability slots array is required' });
    }
    
    // Validate each availability slot
    for (const slot of availabilitySlots) {
      if (!slot.day || !slot.startTime || !slot.endTime) {
        return res.status(400).json({ 
          message: 'Each availability slot must include day, startTime, and endTime' 
        });
      }
      
      // Validate day is in the allowed enum
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (!validDays.includes(slot.day)) {
        return res.status(400).json({ 
          message: `Day must be one of: ${validDays.join(', ')}` 
        });
      }
      
      // Validate time format (simple regex for HH:MM)
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
        return res.status(400).json({ 
          message: 'Time must be in HH:MM format (24-hour)' 
        });
      }
    }
    
    // Find company
    const company = await Company.findById(companyId);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    // Check authorization
    const isAuthorized = 
      ['admin', 'agentCommercial','client'].includes(user.role) || 
      company.commercialAgent?.toString() === user.id || 
      company.createdBy?.toString() === user.id;
      
    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to modify this company' });
    }
    
    // Replace existing availability slots with new ones
    company.availabilitySlots = availabilitySlots;
    
    await company.save();
    
    return res.status(200).json({
      message: 'Availability slots updated successfully',
      company
    });
  } catch (error) {
    console.error('Add availability service error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};