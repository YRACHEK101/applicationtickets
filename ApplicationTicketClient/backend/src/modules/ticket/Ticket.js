// server/models/Ticket.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  author: { 
    type: String, 
    required: true 
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  files: [{
    name: String,
    url: String
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

const contactSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true 
  },
  phone: { 
    type: String 
  },
  availability: [{ 
    type: String 
  }]
});

const activitySchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  metadata: { 
    type: mongoose.Schema.Types.Mixed 
  }
});

const meetingSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  dateTime: { 
    type: Date, 
    required: true 
  },
  meetingLink: { 
    type: String, 
    required: true 
  },
  teamsLink: {
    type: String
  },
  agenda: { 
    type: String 
  },
  organizer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  attendees: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  notes: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const blockerSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  impact: { 
    type: String, 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  resolved: { 
    type: Boolean, 
    default: false 
  },
  resolvedAt: { 
    type: Date 
  },
  resolvedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  resolutionNotes: { 
    type: String 
  }
});

const taskSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  urgency: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  priority: {
    type: Number, // 1-5 where 5 is highest
    default: 3
  },
  status: {
    type: String,
    enum: ['ToDo', 'InProgress', 'Blocked', 'Declined', 'Testing', 'Done'],
    default: 'ToDo'
  },
  dueDate: {
    type: Date
  },
  estimatedHours: {
    type: Number
  },
  actualHours: {
    type: Number
  },
  attachments: [{
    name: String,
    url: String
  }],
  blockers: [blockerSchema],
  comments: [commentSchema],
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  mentions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notified: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const interventionSchema = new mongoose.Schema({
  type: { 
    type: String 
  },
  urgencyLevel: { 
    type: String 
  },
  description: { 
    type: String 
  },
  deadline: { 
    type: String 
  },
  agent: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  startedAt: { 
    type: Date 
  },
  completedAt: { 
    type: Date 
  },
  validationRequested: { 
    type: Boolean, 
    default: false 
  },
  validationRequestedAt: { 
    type: Date 
  },
  validated: { 
    type: Boolean 
  },
  validatedAt: { 
    type: Date 
  },
  validatedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  blockers: [blockerSchema],
  tasks: [taskSchema],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const ticketSchema = new mongoose.Schema({
  number: { 
    type: String, 
    required: true, 
    unique: true,
    default: function() {
      const date = new Date();
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
      return `TCK_INC_${formattedDate}_URG_${randomPart}`;
    }
  },
  title: { 
    type: String, 
    required: true 
  },
  application: { 
    type: String, 
    required: true 
  },
  environment: {
    type: String,
    enum: ['Production', 'Test', 'Development'],
    required: true
  },
  requestType: {
    type: String,
    enum: ['Incident', 'Improvement', 'Other'],
    required: true
  },
  urgency: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    required: true
  },
  description: { 
    type: String, 
    required: true 
  },
  attachments: [{
    name: String,
    url: String
  }],
  links: [{
    description: String,
    url: String
  }],
  driveLink: String,
  teamsLink: String,
  contacts: [contactSchema],
  additionalInfo: String,
  status: {
    type: String,
    enum: [
      'Draft',
      'Registered',
      'Sent',
      'InProgress',
      'TechnicalValidation',
      'Revision',
      'ClientValidation',
      'Validated',
      'Closed',
      'Transferred'
    ],
    default: 'Registered'
  },
  financialStatus: {
    type: String,
    enum: [
      'ToQualify',
      'Subscription',
      'Quote',
      'FlexSubscription',
      'ExcessHours',
      'ExcessInterventions',
      'ExtraOn'
    ],
    default: 'ToQualify'
  },
  estimatedHours: Number,
  actualHours: Number,
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  responsibleClient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  commercial: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  projectManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  groupLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  agents: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  comments: [commentSchema],
  activities: [activitySchema],
  meetings: [meetingSchema],
  intervention: interventionSchema,
  interventions: [interventionSchema],
  tasks: [taskSchema],
  transferHistory: [{
    transferredFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    transferredTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Single pre-save hook to handle ticket number generation and updatedAt timestamp
ticketSchema.pre('save', function(next) {
  // Generate ticket number if not already set
  if (!this.number) {
    const date = new Date();
    const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const randomPart = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    this.number = `TCK_INC_${formattedDate}_URG_${randomPart}`;
    console.log(`Generated ticket number: ${this.number}`);
  }
  
  // Always update the updatedAt timestamp
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Ticket', ticketSchema);