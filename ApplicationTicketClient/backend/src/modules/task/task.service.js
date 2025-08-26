// server/services/taskService.js
import Task from "../../../server/models/Task.model.js";
import Ticket from "../../../server/models/Ticket.model.js";
import User from "../../../server/models/User.model.js";
import { hasTaskAccess } from "../../utils/authorization.js";
import NotificationService from "../../../server/services/NotificationService.js"; // You can define notification service logic here
import mongoose from "mongoose";

export const addBlockerToTask = async ({ taskId, reason, userId }) => {
  // Find the task by ID
  const task = await Task.findById(taskId)
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

export const createTask = async (taskData, userId, files) => {
  try {
    const { name, description, ticket, assignedTo, urgency, priority, dueDate, parentTask, mentions, estimatedHours } = taskData;
    
    // Create the base task object
    const taskObj = {
      name,
      description,
      urgency: urgency || 'Medium',
      priority: priority || 3,
      dueDate: dueDate || undefined,
      estimatedHours: estimatedHours || undefined,
      createdBy: userId,
    };

    // Handle relationships
    if (ticket && ticket.trim() !== '') {
      taskObj.ticket = ticket;
    }
    if (parentTask && parentTask.trim() !== '') {
      taskObj.parentTask = parentTask;
    }

    // Process assignedTo array
    if (assignedTo) {
      taskObj.assignedTo = Array.isArray(assignedTo) 
        ? assignedTo.map(id => new mongoose.Types.ObjectId(id))
        : [new mongoose.Types.ObjectId(assignedTo)];
    }

    // Create new task instance
    const newTask = new Task(taskObj);

    // Handle file attachments
    if (files && files.length > 0) {
      newTask.attachments = files.map((file) => ({
        name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        url: file.filename, // Use filename instead of full path
        uploadedBy: userId,
        uploadedAt: new Date()
      }));
    }

    // Save the task
    await newTask.save();

    // Update parent task if exists
    if (parentTask && parentTask.trim() !== '') {
      await Task.findByIdAndUpdate(parentTask, { 
        $push: { subtasks: newTask._id } 
      });
    }

    // Update related ticket
    if (ticket && ticket.trim() !== '') {
      await Ticket.findByIdAndUpdate(ticket, { 
        $push: { tasks: newTask._id } 
      });
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
          `${creatorName} mentioned you in task: ${newTask.name}`,
          newTask._id,
          "Task"
        );
      }
    }

    // Notify assigned developers
    if (taskObj.assignedTo?.length > 0) {
      const taskCreator = await User.findById(userId);
      const creatorName = `${taskCreator.firstName} ${taskCreator.lastName}`;
      
      for (const devId of taskObj.assignedTo) {
        await NotificationService.notifyTaskAssignment(
          devId,
          newTask._id,
          newTask.name,
          creatorName
        );
      }
    }

    return newTask;
  } catch (error) {
    throw new Error("Error creating task: " + error.message);
  }
};

// Get tasks based on user role
export const getTasks = async (query) => {
  try {
    return await Task.find(query)
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName email")
      .populate("ticket", "number title")
      .sort({ createdAt: -1 });
  } catch (error) {
    throw new Error("Error retrieving tasks: " + error.message);
  }
};

// Get task by ID
export const getTaskById = async (taskId) => {
  try {
    return await Task.findById(taskId)
      .readConcern('majority')
      .populate("createdBy", "firstName lastName")
      .populate('blockers.createdBy', 'firstName lastName role')
      .populate("assignedTo", "firstName lastName email")
      .populate("ticket", "number title status groupLeader createdBy  agentCommercial projectManager")
      .populate("parentTask", "number name status")
      .populate({
        path: "subtasks",
        populate: [
          { path: "assignedTo", select: "firstName lastName email" },
          { path: "blockers.createdBy", select: "firstName lastName role" }
        ]
      })
      .populate({ path: "comments.author", select: "firstName lastName" });
      
  } catch (error) {
    throw new Error("Error retrieving task by ID: " + error.message);
  }
};
// Update task
export const updateTask = async (taskId, updateData, files) => {
  try {
    // Get the current task to compare status
    const currentTask = await Task.findById(taskId);
    
    // Initialize $push if not exists
    if (!updateData.$push) {
      updateData.$push = {};
    }
    
    if (files && files.length > 0) {
      const newAttachments = files.map((file) => ({
        name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        url: file.filename,  
        uploadedBy: updateData.userId,
        uploadedAt: new Date(),
      }));
      updateData.$push.attachments = { $each: newAttachments };
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

      // Notify assigned users and admins about status change
      const changer = await User.findById(updateData.userId);
      const changerName = `${changer.firstName} ${changer.lastName}`;
      const message = `${changerName} changed the status of task "${currentTask.name}" from ${currentTask.status} to ${updateData.status}`;
      const assignedUserIds = currentTask.assignedTo.map(id => id.toString());
      const admins = await User.find({ role: 'admin' });
      const adminUserIds = admins.map(admin => admin._id.toString());
      const allUserIds = [...new Set([...assignedUserIds, ...adminUserIds])]; // Avoid duplicates
      await NotificationService.createNotifications(allUserIds, message, taskId, 'Task');
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

    updateData.$push.history = historyEntry;

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true })
      .populate("createdBy", "firstName lastName")
      .populate("assignedTo", "firstName lastName");
    
    return updatedTask;
  } catch (error) {
    throw new Error("Error updating task: " + error.message);
  }
};

export const addComment = async (taskId, userId, text, mentions, files) => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new Error("Task not found");
  }
  const user = await User.findById(userId);

  if (user.role !== "admin" && 
    user.role !== "projectManager" && 
    user.role !== "responsibleTester" &&
    !(await hasTaskAccess(userId, user.role, taskId))) {
    throw new Error("Not authorized to comment on this task");
  }

  const comment = {
    text,
    author: userId,
    createdAt: new Date(),
  };

  if (files && files.length > 0) {
    comment.files = files.map((file) => ({
      name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
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

  const updatedTask = await Task.findById(taskId)
    .populate("createdBy", "firstName lastName")
    .populate("assignedTo", "firstName lastName")
    .populate({
      path: "comments.author",
      select: "firstName lastName",
    });

  return updatedTask;
};


