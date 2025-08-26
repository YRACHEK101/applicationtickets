import express from "express";
import * as taskController from "../../controllers/task.controller.js";
import { auth, authorize } from "../../middleware/auth.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createTaskValidator, updateTaskValidator } from "../../validators/task.validator.js";
import { validate } from "../../middleware/validate.js";
import Task from "../../models/Task.model.js";
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//base uploads directory where Multer will save files
const BASE_UPLOADS_DIR = path.join(process.cwd(),"server", "uploads", "tasks");

// Setup file upload using multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      let taskIdentifier;
      if (req.params.id) {
        const task = await Task.findById(req.params.id);
        taskIdentifier = task ? task.number : 'temp'; 
      } else {
        const date = new Date();
        const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        taskIdentifier = `TEMP-${formattedDate}-${randomPart}`;
        req.tempUploadFolderName = taskIdentifier; 
        req.tempTaskIdentifier = taskIdentifier;
      }
       
      const taskUploadsDir = path.join(BASE_UPLOADS_DIR, taskIdentifier);
      if (!fs.existsSync(taskUploadsDir)) {
        fs.mkdirSync(taskUploadsDir, { recursive: true });
      }
      cb(null, taskUploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const date = new Date();
    const timestamp = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}${date.getSeconds().toString().padStart(2, '0')}`;
    const ext = path.extname(file.originalname);
    cb(null, `file_${timestamp}${ext}`); 
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const hasTaskAccess = async (userId, userRole, taskId) => {
  const task = await Task.findById(taskId);
  if (!task) return false;

  if (["admin", "projectManager"].includes(userRole)) return true;

  if (
    userRole === "developer" &&
    task.assignedTo &&
    task.assignedTo.toString() === userId
  ) {
    return true;
  }

  return false;
};

router.get("/", auth, taskController.getTasks);
router.get("/testing-tasks", auth, taskController.getTestingTasks);
router.get('/:taskId/blocked-subtasks', auth, taskController.getBlockedSubtasks);
router.get("/:id", auth, taskController.getTaskById);

router.post(
  "/",
  auth,
  authorize(["admin", "projectManager", "agentCommercial", "groupLeader"]),
  upload.array("attachments"),
  createTaskValidator,
  validate,
  taskController.createTask
);



router.put(
  "/:id",
  auth,
  upload.array("attachments"),
  updateTaskValidator,
  validate,
  taskController.updateTask
);

router.post("/:id/comments", auth, taskController.addCommentToTask); 
router.post("/:id/block", auth, taskController.reportTaskBlocker);


//Download a specific attachment for a task
router.get("/:taskId/files/:filename", auth, async (req, res) => {
  try {
    const { taskId, filename } = req.params; 
    const userId = req.user.id;
    const userRole = req.user.role;

    // 1. Verify task existence and user access
    const task = await Task.findById(taskId);
    if (!task) {
      console.warn(`Download: Task not found for ID: ${taskId}`);
      return res.status(404).json({ message: "Task not found." });
    }

    // Simplified access check function
    const simplifiedAccessCheck = async (uId, uRole, tsk) => {
        if (['admin', 'projectManager', 'groupLeader', 'responsibleClient', 'responsibleTester', 'agentCommercial'].includes(uRole)) return true;
        if (tsk.createdBy && tsk.createdBy.toString() === uId) return true;
        if (Array.isArray(tsk.assignedTo) && tsk.assignedTo.some(assignee => assignee.toString() === uId)) return true;
        return false;
    };

    if (!(await simplifiedAccessCheck(userId, userRole, task))) {
         console.warn(`Download: User ${userId} (${userRole}) not authorized for task ${taskId}`);
         return res.status(403).json({ message: "Not authorized to download this file." });
    }

    // 2. Find the attachment in the task's attachments array
    const attachment = task.attachments.find(att => att.url === filename);
    if (!attachment) {
      console.warn(`Download: Attachment metadata for filename '${filename}' not found in task ${taskId}`);
      return res.status(404).json({ message: "Attachment metadata not found in task." });
    }

    // 3. Construct the full path to the file on the server
    if (!task.number) {
        console.error(`Download: Task ${taskId} has no 'number' property. Cannot construct file path.`);
        return res.status(500).json({ message: "Task number missing for attachment path." });
    }
    const fileActualPath = path.join(BASE_UPLOADS_DIR, task.number, filename);


    // 4. Check if the file physically exists on the server
    if (!fs.existsSync(fileActualPath)) {
      console.warn(`Download: File not found on disk at: ${fileActualPath}`);
      return res.status(404).json({ message: "File not found on server at the expected path." });
    }

    // 5. Send the file for download
    res.download(fileActualPath, attachment.name, (err) => {
      if (err) {
        console.error("File download error:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Error downloading file." });
        }
      }
    });

  } catch (error) {
    console.error("Download attachment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
