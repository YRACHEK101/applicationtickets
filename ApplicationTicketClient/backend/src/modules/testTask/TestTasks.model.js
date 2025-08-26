import mongoose from 'mongoose';
import cron from 'node-cron';

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  mentions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notified: { type: Boolean, default: false }
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
  name: { type: String, required: true },
  description: { type: String, required: true },
  ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
  intervention: { type: mongoose.Schema.Types.ObjectId, ref: 'Intervention' },
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  urgency: {
    type: String,
    enum: ['Critical', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  priority: { type: Number, default: 3 }, // 1-5 where 5 is highest
  status: {
    type: String,
    enum: ['ToDo', 'Blocked', 'Declined', 'Testing', 'TestFailed', 'TestPassed', 'Expired', 'Overdue'],
    default: 'ToDo'
  },
  dueDate: { type: Date },
  estimatedHours: { type: Number },
  actualHours: { type: Number },
  testEnvironment: { type: String }, // e.g., "Staging", "Production", "Local"
  testCoverage: { type: Number, min: 0, max: 100 }, // Percentage of test coverage
  attachments: [{
    name: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  blockers: [{
    reason: { type: String, required: true },
    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date
  }],
  comments: [commentSchema],
  parentTask: { type: mongoose.Schema.Types.ObjectId, ref: 'TestTask' },
  subtasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TestTask' }],
  mentions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notified: { type: Boolean, default: false }
  }],
  history: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'statusChanged', 'assigned', 'blocked', 'unblocked', 'commented', 'tested'],
      required: true
    },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  statusChangeDates: {
    Testing: { type: Date } // Track when testing started
  }
});

// Pre-save hook for status changes (including testing)
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();

  if (this.isModified('status')) {
    const previousStatus = this.$isNew ? 'ToDo' : this._previousStatus;
    
    // Record status change in history
    this.history.push({
      action: 'statusChanged',
      performedBy: this.modifiedBy || this.createdBy,
      timestamp: new Date(),
      details: {
        previousStatus: previousStatus,
        newStatus: this.status
      }
    });

    // Track when testing starts
    if (this.status === 'Testing') {
      this.statusChangeDates.Testing = new Date();
    }

    this._previousStatus = this.status;
  }

  next();
});

// Method to update test case results
taskSchema.methods.updateTestCase = function(testCaseId, result, executedBy) {
  const testCase = this.testCases.id(testCaseId);
  if (!testCase) throw new Error("Test case not found");

  testCase.status = result;
  testCase.executedBy = executedBy;
  testCase.executedAt = new Date();

  // Update overall task status if all test cases are done
  const allTested = this.testCases.every(tc => tc.status !== 'NotTested');
  if (allTested) {
    const hasFailures = this.testCases.some(tc => tc.status === 'Failed');
    this.status = hasFailures ? 'TestFailed' : 'TestPassed';
  }

  this.history.push({
    action: 'tested',
    performedBy: executedBy,
    timestamp: new Date(),
    details: {
      testCase: testCaseId,
      result: result
    }
  });
};

// Static method to find tasks needing testing
taskSchema.statics.findTasksForTesting = function() {
  return this.find({ status: 'Testing' });
};

// Static method to update expired/overdue tasks
taskSchema.statics.updateExpiredTasks = async function() {
  const testingTasks = await this.find({ 
    status: 'Testing',
    estimatedHours: { $exists: true, $gte: 0 }
  });

  const now = new Date();
  let updatedCount = 0;

  for (const task of testingTasks) {
    try {
      const lastTestingEntry = task.history
        .filter(h => h.action === 'statusChanged' && h.details?.newStatus === 'Testing')
        .sort((a, b) => b.timestamp - a.timestamp)[0];

      if (!lastTestingEntry) continue;

      const testingStartTime = new Date(lastTestingEntry.timestamp);
      const hoursInTesting = (now - testingStartTime) / (1000 * 60 * 60);

      if (hoursInTesting > task.estimatedHours) {
        task.status = 'Expired';
        task.history.push({
          action: 'statusChanged',
          performedBy: task.createdBy,
          timestamp: now,
          details: {
            previousStatus: 'Testing',
            newStatus: 'Expired',
            reason: `Testing duration (${hoursInTesting.toFixed(2)} hours) exceeded estimated hours (${task.estimatedHours} hours)`
          }
        });
        await task.save();
        updatedCount++;
      }
    } catch (error) {
      // Silent fail to continue processing other tasks
    }
  }

  return updatedCount;
};

taskSchema.statics.updateOverdueTasks = async function() {
  const now = new Date();
  const nowUTC = new Date(now.toISOString());
  
  const tasksToCheck = await this.find({ 
    status: 'ToDo',
    dueDate: { 
      $lt: nowUTC
    }
  }).lean();

  let updatedCount = 0;

  for (const task of tasksToCheck) {
    try {
      task.status = 'Overdue';
      task.history.push({
        action: 'statusChanged',
        performedBy: task.createdBy,
        timestamp: now,
        details: {
          previousStatus: 'ToDo',
          newStatus: 'Overdue',
          reason: `Task exceeded due date (${task.dueDate.toISOString()})`
        }
      });
      
      await task.save();
      updatedCount++;
    } catch (error) {
      // Silent fail to continue processing other tasks
    }
  }

  return updatedCount;
};

// Start cron job for status checks
taskSchema.statics.startStatusChecks = function() {
  cron.schedule('*/30 * * * * *', async () => {
    try {
      await this.updateExpiredTasks();
      await this.updateOverdueTasks();
    } catch (error) {
      // Silent fail to prevent cron job from stopping
    }
  });
};

// Make sure the cron job starts when the model is initialized
const TestTask = mongoose.model('TestTask', taskSchema);
TestTask.startStatusChecks(); // Add this line to start the cron job immediately

export default TestTask;