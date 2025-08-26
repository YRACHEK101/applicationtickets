// server/models/User.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['client', 'agent', 'responsibleClient', 'admin', 'commercial', 'projectManager', 'groupLeader', 'developer'],
    required: true
  },
  phone: String,
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  isSuspended: { type: Boolean, default: false },
  preferredLanguage: { 
    type: String, 
    enum: ['en', 'fr', 'de', 'es', 'ar'],
    default: 'en'
  },
  notifications: [{
    message: String,
    relatedTo: { type: mongoose.Schema.Types.ObjectId, refPath: 'notificationModel' },
    notificationModel: { type: String, enum: ['Ticket', 'Intervention', 'Task', 'User'] },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if the model exists before defining it
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;