import TestTask from "../models/TestTasks.model.js";
import Ticket from "../models/Ticket.model.js";
import Task from '../models/Task.model.js';
import User from "../models/User.model.js";
import NotificationService from "./NotificationService.js";
import { hasTaskAccessTesting } from "../utils/authorization.js";
import mongoose from "mongoose";

export const getTasksByTicketId = async (ticketId) => {
  try {
    const tasks = await Task.find({ ticket: ticketId })
      .populate('assignedTo', 'firstName lastName email role')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    if (!tasks || tasks.length === 0) {
      throw new Error('No tasks found for this ticket');
    }

    return tasks;
  } catch (error) {
    throw new Error(`Error fetching tasks: ${error.message}`);
  }
};
export const getTestTasksByStatus = async (statuses) => {
  try {
    return await TestTask.find({ status: { $in: statuses } })
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName email")
      .populate("ticket", "number title")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error("Error fetching test tasks: " + error.message);
  }
};

export const getAllTestTasks = async () => {
  try {
    return await TestTask.find()
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName email")
      .populate("ticket", "number title")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error("Error fetching all test tasks: " + error.message);
  }
};

export const createTestTask = async (taskData, userId, files, taskNumberFromUpload = null) => {
  try {
    const { 
      name, 
      description, 
      ticket, 
      assignedTo, 
      urgency, 
      priority, 
      dueDate, 
      parentTask, 
      relatedTask,  // Add this
      mentions, 
      estimatedHours,
      testCases,
      testEnvironment,
      testCoverage 
    } = taskData;
    
    // Create the base task object
    const taskObj = {
      name,
      description,
      urgency: urgency || 'Medium',
      priority: priority || 3,
      dueDate: dueDate || undefined,
      estimatedHours: estimatedHours || undefined,
      createdBy: userId,
      testEnvironment: testEnvironment || 'Staging',
      testCoverage: testCoverage || 0,
      modifiedBy: userId
    };

    // Use the taskNumber from upload if provided, otherwise let the model's default handle it
    if (taskNumberFromUpload) {
        taskObj.number = taskNumberFromUpload; // <--- Set the number field here
    }

    // Handle test cases
    if (testCases && Array.isArray(testCases)) {
      taskObj.testCases = testCases.map(testCase => ({
        name: testCase.name,
        description: testCase.description,
        expectedResult: testCase.expectedResult
      }));
    }

    // Handle relationships
    if (ticket && ticket.trim() !== '') {
      taskObj.ticket = ticket;
    }
    if (parentTask && parentTask.trim() !== '') {
       taskObj.parentTask = parentTask;
    }
    if (relatedTask && relatedTask.trim() !== '') {
      taskObj.relatedTask = relatedTask;
    }

    // Process assignedTo array
    if (assignedTo) {
      taskObj.assignedTo = Array.isArray(assignedTo) 
        ? assignedTo.map(id => new mongoose.Types.ObjectId(id))
        : [new mongoose.Types.ObjectId(assignedTo)];
    }

    if (taskObj.assignedTo?.length > 0) {
        const validTesters = await User.find({
          _id: { $in: taskObj.assignedTo },
          role: 'tester'
        });
  
        if (validTesters.length !== taskObj.assignedTo.length) {
          throw new Error('All assigned users must be testers');
        }
    }
    // Create new task instance
    const newTask = new TestTask(taskObj);

    // Handle file attachments
    if (files && files.length > 0) {
      newTask.attachments = files.map((file) => ({
        name: file.originalname,
        url: file.filename,
        uploadedBy: userId,
        uploadedAt: new Date()
      }));
    }

    // Save the task
    await newTask.save();

    // Update parent task if exists
    if (parentTask && parentTask.trim() !== '') {
      await TestTask.findByIdAndUpdate(parentTask, { 
        $push: { subtasks: newTask._id } 
      });
    }

    // Update related ticket
    if (ticket && ticket.trim() !== '') {
      await Ticket.findByIdAndUpdate(ticket, { 
        $push: { tasks: newTask._id } 
      });
    }

    // Update related regular task if provided
    if (relatedTask && relatedTask.trim() !== '') {
        const updatedTask = await Task.findByIdAndUpdate(
            relatedTask,
            { $push: { testTasks: newTask._id } },
            { new: true }
        );
        if (!updatedTask) {
            throw new Error('Related Task Not Found');
        }
    }

    // Process user mentions
    if (mentions && Array.isArray(mentions)) {
      const mentionedUserIds = mentions.map(id => id.toString());
      newTask.mentions = mentionedUserIds.map(userId => ({ 
        user: userId, 
        notified: false 
      }));
      
      await newTask.save();

      // Send notifications
      const taskCreator = await User.findById(userId);
      const creatorName = `${taskCreator.firstName} ${taskCreator.lastName}`;
      
      for (const userId of mentionedUserIds) {
        await NotificationService.createNotifications(
          [userId],
          `${creatorName} mentioned you in test task: ${newTask.name}`,
          newTask._id,
          "TestTask"
        );
      }
    }

    // Notify assigned testers
    if (taskObj.assignedTo?.length > 0) {
      const taskCreator = await User.findById(userId);
      const creatorName = `${taskCreator.firstName} ${taskCreator.lastName}`;
      
      for (const testerId of taskObj.assignedTo) {
        await NotificationService.notifyTaskAssignment(
          testerId,
          newTask._id,
          newTask.name,
          creatorName
        );
      }
    }

    return newTask;
  } catch (error) {
    throw new Error("Error creating test task: " + error.message);
  }
};


export const getTask = async () =>{
  const tasks = await TestTask.find()
    .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName email")
      .populate("ticket", "number title")
      .sort({ createdAt: -1 });
  
  return tasks;
}

export const getTaskById = async (taskId) => {
  try {
    return await TestTask.findById(taskId)
      .populate("createdBy", "firstName lastName")
      .populate('blockers.createdBy', 'firstName lastName email')
      .populate("assignedTo", "firstName lastName email")
      .populate("ticket", "number title status groupLeader createdBy  agentCommercial projectManager")
      .populate("parentTask", "number name status")
      .populate({ path: "comments.author", select: "firstName lastName" })
      .populate({
        path: "blockers.createdBy", // Ensure blockers.createdBy is populated
        select: "firstName lastName role",
      }).populate({
        path: "blockers.resolvedBy",
        select: "firstName lastName role",
      })
      // --- NEW: Populate subtasks and select necessary fields ---
      .populate({
        path: "subtasks",
        select: "number name status", // Select only the fields you need for subtask display
      });
      // --- END NEW ---
      
  } catch (error) {
    throw new Error("Error retrieving task by ID: " + error.message);
  }
};


export const updateTask = async (taskId, updateData, files) => {
  try {
    // Get the current task to compare status
    const currentTask = await TestTask.findById(taskId);
    
    if (files && files.length > 0) {
      const newAttachments = files.map((file) => ({
        name: file.originalname,
        url: file.filename,  
        uploadedBy: updateData.userId,
        uploadedAt: new Date(),
      }));
      updateData.$push = { attachments: { $each: newAttachments } };
    }

    // Create appropriate history entry based on what's being updated
    let historyEntry;
    if (updateData.status && updateData.status !== currentTask.status) {
      historyEntry = {
        action: 'statusChanged',
        performedBy: updateData.userId,
        timestamp: new Date(),
        details: {
          previousStatus: currentTask.status,
          newStatus: updateData.status
        }
      };
    } else {
      historyEntry = {
        action: 'updated',
        performedBy: updateData.userId,
        timestamp: new Date(),
        details: {
          updatedFields: Object.keys(updateData).filter(key => !['userId', '$push'].includes(key))
        }
      };
    }

    updateData.$push = {
      ...updateData.$push,
      history: historyEntry
    };

    const updatedTask = await TestTask.findByIdAndUpdate(taskId, updateData, { new: true })
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName");
    
    return updatedTask;
  } catch (error) {
    throw new Error("Error updating task: " + error.message);
  }
};

export const addComment = async (taskId, userId, text, mentions, files) => {
  const task = await TestTask.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }
  const user = await User.findById(userId);

  // if ((  ["admin","responsibleTester"].includes(user.role) )&& !(await hasTaskAccessTesting(userId, "user", taskId))) {
  //   throw new Error("Not authorized to comment on this task");
  // }

  const comment = {
    text,
    author: userId,
    createdAt: new Date(),
  };

  if (files && files.length > 0) {
    comment.files = files.map((file) => ({
      name: file.originalname,
      url: file.path,
    }));
  }

  const extractedMentions = NotificationService.extractMentions(text);

  if (extractedMentions.length > 0) {
    const mentionedUserIds = await NotificationService.findUsersByMentions(extractedMentions);

    if (mentionedUserIds.length > 0) {
      comment.mentions = mentionedUserIds.map((userId) => ({
        user: userId,
        notified: false,
      }));

      const commenter = await User.findById(userId);
      const commenterName = `${commenter.firstName} ${commenter.lastName}`;

      await NotificationService.processMentions(text, commenterName, task._id, "Task");
    }
  }

  if (mentions && Array.isArray(mentions)) {
    if (!comment.mentions) comment.mentions = [];

    const existingMentionIds = comment.mentions.map((m) => m.user.toString());

    for (const mentionId of mentions) {
      if (!existingMentionIds.includes(mentionId)) {
        comment.mentions.push({
          user: mentionId,
          notified: false,
        });

        const commenter = await User.findById(userId);
        const commenterName = `${commenter.firstName} ${commenter.lastName}`;

        await NotificationService.createNotifications(
          [mentionId],
          `${commenterName} mentioned you in a comment on task: ${task.name}`,
          task._id,
          "Task"
        );
      }
    }
  }

  task.comments.push(comment);

  task.history.push({
    action: "commented",
    performedBy: userId,
    timestamp: new Date(),
  });

  await task.save(); 

  const updatedTask = await TestTask.findById(taskId)
    .populate("createdBy", "firstName lastName")
    .populate("assignedTo", "firstName lastName")
    .populate({
      path: "comments.author",
      select: "firstName lastName",
    });

  return updatedTask;
};

export const addBlockerToTask = async ({ taskId, reason, userId }) => {
  // Find the task by ID
  const task = await TestTask.findById(taskId)
    if (!task) {
    throw new Error('Task not found');  
  }
  task.status = 'Blocked';

  // Create a new blocker
  const blocker = {
    reason,
    createdBy: userId,
    createdAt: new Date(),
  };

  // Add the blocker to the task
  task.blockers.push(blocker);

  task.blockers.createdBy = userId;

  // Log the history action
  task.history.push({
    action: 'blocked',
    performedBy: userId,
    timestamp: new Date(),
    details: { taskId },
  });

  // Save the task
  await task.save();
  return blocker;  // Returning the blocker to pass back in the response
};

export const changeTestTaskStatus = async ({testTaskId, newStatus, userId, changedBy}) => {
    try {
      const testTask = await TestTask.findById(testTaskId);
      if (!testTask) {
        throw new Error('Test task not found');
      }

      const oldStatus = testTask.status;
      testTask.status = newStatus;
      await testTask.save();

      // Notify Tester when Admin changes status (if the user changing is an Admin)
      const changerUser = await User.findById(changedBy).select('role firstName lastName');
      if (changerUser && changerUser.role === 'admin' && testTask.assignedTo) {
        const testerId = testTask.assignedTo;
        const message = `${changerUser.firstName} ${changerUser.lastName} changed the status of test task "${testTask.title}" to "${newStatus}".`;
        await NotificationService.createNotifications([testerId], message, testTask._id, 'TestTask');
      }

      return testTask;
    } catch (error) {
      console.error('Error changing test task status:', error);
      throw error;
    }
  };

export const signalBlocker = async (testTaskId, blockerDetails, userId) => {
    try {
      const testTask = await TestTask.findById(testTaskId);
      if (!testTask) {
        throw new Error('Test task not found');
      }

      testTask.hasBlocker = true;
      testTask.blockerDetails = blockerDetails;
      await testTask.save();

      // Notify Admin(s) and Tester when a blocker is signaled
      const tester = await User.findById(userId).select('firstName lastName');
      const admins = await User.find({ role: 'admin' }).select('_id');
      const adminIds = admins.map(admin => admin._id);

      // Notification for Admin(s)
      if (adminIds.length > 0 && tester) {
        const messageForAdmin = `${tester.firstName} ${tester.lastName} signaled a blocker on test task "${testTask.title}". Details: ${blockerDetails}.`;
        await NotificationService.createNotifications(adminIds, messageForAdmin, testTask._id, 'TestTask');
      }

      // Notification for the Tester (self-notification)
      if (tester) {
        const messageForTester = `You have successfully signaled a blocker on test task "${testTask.title}". Details: ${blockerDetails}.`;
        await NotificationService.createNotifications([userId], messageForTester, testTask._id, 'TestTask');
      }

      return testTask;
    } catch (error) {
      console.error('Error signaling blocker on test task:', error);
      throw error;
    }
  };

