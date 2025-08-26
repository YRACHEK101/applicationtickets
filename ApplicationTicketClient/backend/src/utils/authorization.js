import Task from "../../server/models/Task.model.js"
import TestTask from '../modules/testTask/TestTasks.model.js'
export const hasTaskAccess = async (userId, userRole, taskId) => {
  const task = await Task.findById(taskId);

  if (!task) return false;

  // Example: Admins have access to everything
  if (userRole === "admin") return true;

  // If user is the creator of the task
  if (task.createdBy.toString() === userId.toString()) return true;

  // If user is assigned to the task
  if (Array.isArray(task.assignedTo)) {
    if (task.assignedTo.map(u => u.toString()).includes(userId.toString())) return true;
  } else if (task.assignedTo && task.assignedTo.toString() === userId.toString()) {
    return true;
  }

  // No access otherwise
  return false;
};

export const hasTaskAccessTesting = async (userId, userRole, taskId) => {
  const task = await TestTask.findById(taskId);

  if (!task) return false;

  // Example: Admins have access to everything
  if (userRole === "admin") return true;

  // If user is the creator of the task
  if (task.createdBy.toString() === userId.toString()) return true;

  // If user is assigned to the task
  if (Array.isArray(task.assignedTo)) {
    if (task.assignedTo.map(u => u.toString()).includes(userId.toString())) return true;
  } else if (task.assignedTo && task.assignedTo.toString() === userId.toString()) {
    return true;
  }

  // No access otherwise
  return false;
};