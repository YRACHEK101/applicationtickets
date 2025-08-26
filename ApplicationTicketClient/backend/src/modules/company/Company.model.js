// server/models/Company.js
import mongoose from 'mongoose';

const addressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: String,
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
});

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  isPrimary: { type: Boolean, default: false }
});

const availabilitySlotSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
  },
  startTime: String, // format: "HH:MM"
  endTime: String    // format: "HH:MM"
});

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  fileType: { type: String, required: true },
  filePath: { type: String, required: true }, // Relative path
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
});

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: addressSchema,
  contacts: [contactSchema],
  billingMethod: { 
    type: String, 
    enum: ['hourly', 'perTask', 'subscription'],
    default: 'hourly'
  },
  contactPerson: {
    name: { type: String, required: true },
    position: String,
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  availabilitySlots: [availabilitySlotSchema],
  documents: [documentSchema],
  commercialAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

export default mongoose.model('Company', companySchema);