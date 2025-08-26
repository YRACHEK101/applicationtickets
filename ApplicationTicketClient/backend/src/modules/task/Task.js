// server/models/Task.js
import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
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
  }]
});

const taskSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true,
    default: function() {
      const date = new Date();
      const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      return `TASK-${formattedDate}-${randomPart}`;
    }
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: false
  },
  intervention: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention',
    required: false
  },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
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
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  blockers: [{
    reason: {
      type: String,
      required: true
    },
    description: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    resolved: {
      type: Boolean,
      default: false
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  }],
  comments: [commentSchema],
  parentTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  subtasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
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
  history: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'statusChanged', 'assigned', 'blocked', 'unblocked', 'commented'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: mongoose.Schema.Types.Mixed
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

// Update timestamps before save
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Task', taskSchema);