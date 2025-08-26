// server/controllers/taskController.js
import * as taskService from "./task.service.js";
import User from "../user/User.js";

import path from 'path';  
import fs from 'fs';  
import { fileURLToPath } from 'url';  

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



export const reportTaskBlocker = async (req, res) => {
  try {
    const {id: taskId } = req.params;
    const { reason } = req.body;  // Destructuring both fields
    const userId = req.user.id;

    // Make sure both reason and description are provided
    if (!reason ) {
      return res.status(400).json({ message: 'Reason are required' });
    }

    // Call the service to add the blocker
    const blocker = await taskService.addBlockerToTask({ taskId, reason, userId });

    if (!blocker) {
      return res.status(404).json({ message: 'Failed to add blocker' });
    }

    res.status(200).json(blocker);  // Returning the blocker object as a response
  } catch (error) {
    console.error('Report task blocker error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const buildQueryBasedOnRole = async (user, filter) => {
  if (user.role === 'admin') {
    return {};
  } else if (user.role === 'groupLeader') {
    if (filter === 'created') {
      return { createdBy: user.id };
    } else if (filter === 'assigned') {
      return { assignedTo: user.id };
    } else {
      return {
        $or: [
          { createdBy: user.id },
          { assignedTo: user.id }
        ]
      };
    }
  } else if (user.role === 'projectManager' || user.role === 'responsibleClient') {
    const groupLeaders = await User.find({ projectManager: user.id }, '_id');
    const groupLeaderIds = groupLeaders.map(gl => gl._id);
    return { 
      $or: [
        { createdBy: user.id },
        { assignedTo: user.id },
        { createdBy: { $in: groupLeaderIds } }
      ] 
    };
  }else if(user.role === 'responsibleTester'){
    return {
      $or: [
        { status: "Testing" }
      ]
    };
  }
   else {
    return { assignedTo: user.id };
  }
};


// Get tasks based on user role
export const getTasks = async (req, res) => {
  try {
    const filter = req.query.filter; 
    const query = await buildQueryBasedOnRole(req.user, filter); // Notez l'appel await ici
    const tasks = await taskService.getTasks(query);
    res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTestingTasks = async (req, res) => {
  try {
    const filter = req.query.filter;
    const baseQuery = await buildQueryBasedOnRole(req.user, filter);
    const tasks = await taskService.getTasks({
      ...baseQuery,
      status: 'Testing'
    });
    res.json(tasks);
  } catch (error) {
    console.error("Get testing tasks error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get task by ID
export const getTaskById = async (req, res) => {
  try {
    const task = await taskService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    res.json(task);
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const createTask = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      assignedTo: req.body.assignedTo ? 
        (Array.isArray(req.body.assignedTo) ? req.body.assignedTo : [req.body.assignedTo]) : 
        [],
      urgency: req.body.urgency || 'Medium',
      priority: req.body.priority || '3',
      dueDate: req.body.dueDate || undefined,
      estimatedHours: req.body.estimatedHours || undefined,
      parentTask: req.body.parentTask || undefined
    };

    const files = req.files ? 
      (Array.isArray(req.files) ? req.files : [req.files]) : 
      [];

      const tempUploadFolderName = req.tempUploadFolderName; 

    const newTask = await taskService.createTask(taskData, req.user.id, files);

    // --- RENAMING UPLOAD FOLDER ---
    if (tempUploadFolderName && newTask.number) {
        const baseUploadsRoot = path.join(__dirname, '..', 'server',  'uploads', 'tasks');

        const oldPath = path.join(baseUploadsRoot, tempUploadFolderName);
        const newPath = path.join(baseUploadsRoot, newTask.number);

        if (fs.existsSync(oldPath)) {
            fs.rename(oldPath, newPath, (err) => {
                if (err) {
                    console.error(`Controller: ERROR renaming upload directory from ${oldPath} to ${newPath}:`, err);
                } else {
                    console.log(`Controller: Successfully renamed upload directory to: ${newPath}`);
                }
            });
        } else {
            console.warn(`Controller: Temporary upload directory NOT FOUND for renaming: ${oldPath}`);
        }
    } else {
        console.warn("Controller: Skipping folder rename. tempUploadFolderName or newTask.number is missing.");
    }
    res.status(201).json(newTask);
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ 
      message: error.message || "Server error",
      errors: error.errors 
    });
  }
};


export const updateTask = async (req, res) => {
  try {
    const updateData = req.body;
    
    if (updateData.assignedTo && !Array.isArray(updateData.assignedTo)) {
      updateData.assignedTo = [updateData.assignedTo];
    }
    
    // Add userId from authenticated user
    updateData.userId = req.user.id;
    
    const updatedTask = await taskService.updateTask(req.params.id, updateData, req.files);
    res.json(updatedTask);
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const addCommentToTask = async (req, res) => {
  try {
    const { text, mentions } = req.body;
    const taskId = req.params.id;
    const userId = req.user.id;

    if (!text) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const updatedTask = await taskService.addComment(taskId, userId, text, mentions, req.files);

    res.json(updatedTask);
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
export const getBlockedSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const blockedSubtasks = await Task.find({ 
      parentTask: taskId,
      status: 'Blocked'
    })
    .populate('assignedTo', 'firstName lastName')
    .populate('blockers.createdBy', 'firstName lastName role')
    .select('name number status blockers');
    
    res.status(200).json(blockedSubtasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};