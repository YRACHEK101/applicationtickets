import express from "express";
import {
  getTasksByTicket,
  getTask,
  getTaskById,
  createTestTask,
  updateTask,
  addCommentToTask,
  getTestingTasks,
  reportTaskBlocker
} from '../../controllers/TestTasks.controller.js'; 

import { auth, authorize } from "../../middleware/auth.middleware.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import TestTask from "../../models/TestTasks.model.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const BASE_UPLOADS_DIR = path.join(process.cwd(), "server", "uploads", "test-tasks");
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      let taskNumber;
      if (req.params.id) {
        // For existing tasks, get the task number from database
        const task = await TestTask.findById(req.params.id);
        taskNumber = task ? task.number : 'temp';
      } else {
        // For new tasks, generate the number following the same pattern
        const date = new Date();
        const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
        const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        taskNumber = `TASK-${formattedDate}-${randomPart}`; 
         req.tempUploadFolderName = taskNumber; 
         req.tempTaskIdentifier = taskNumber;
      }


      // Create base uploads directory
      const taskUploadsDir  = path.join(BASE_UPLOADS_DIR, taskNumber); 
      
      if (!fs.existsSync(taskUploadsDir )) {
        fs.mkdirSync(taskUploadsDir , { recursive: true });
      }
      
      cb(null, taskUploadsDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const date = new Date();
    const timestamp = `${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${date.getTime()}`;
    const ext = path.extname(file.originalname);
    const fileName = `file_${timestamp}${ext}`;
    cb(null, `file_${timestamp}${ext}`); 
  }
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB


router.get('/tickets/:ticketId/tasks', auth, getTasksByTicket);
router.get('/testing-tasks', auth, getTestingTasks);


// Create test task route
router.post(
  "/",
  auth,
  authorize(["admin", "responsibleTester"]),
  upload.array("attachments"),
  createTestTask
);

// File download route
//Download a specific attachment for a task
router.get("/:taskId/files/:filename", auth, async (req, res) => {
  try {
    const { taskId, filename } = req.params; 
    const userId = req.user.id;
    const userRole = req.user.role;

    const testTask = await TestTask.findById(taskId);
    if (!testTask) {
      console.warn(`[Download] Test Task not found for ID: ${taskId}`);
      return res.status(404).json({ message: "test Task not found." });
    }

        // Authorization check
        const simplifiedAccessCheck = async (uId, uRole, tsk) => {
          if (['admin', 'projectManager', 'groupLeader', 'responsibleClient', 'responsibleTester', 'agentCommercial'].includes(uRole)) return true;
          if (tsk.createdBy && tsk.createdBy.toString() === uId) return true;
          if (Array.isArray(tsk.assignedTo) && tsk.assignedTo.some(assignee => assignee.toString() === uId)) return true;
          return false;
        };

        if (!(await simplifiedAccessCheck(userId, userRole, testTask))) {
          console.warn(`Download: User ${userId} (${userRole}) not authorized for task ${taskId}`);
          return res.status(403).json({ message: "Not authorized to download this file." });
        }

        const attachment = testTask.attachments.find(att => att.url === filename);
        if (!attachment) {
          console.warn(`Download: Attachment metadata for filename '${filename}' not found in task ${taskId}`);
          return res.status(404).json({ message: "Attachment metadata not found in task." });
        }
        
        // Construct the direct file path
          const taskNumber = testTask.number; // Assuming testTask.number holds the unique identifier for the task's folder
          const filePath = path.join(BASE_UPLOADS_DIR, taskNumber, filename);

          // Check if the file exists at the direct path
          if (!fs.existsSync(filePath)) {
            console.warn(`[Download] File not found at direct path: ${filePath}`);
            return res.status(404).json({ message: "File not found on server." });
          }

        // Download the found file
        return res.download(filePath, attachment.name, (err) => {
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


router.get('', auth, getTask);
router.get('/:id', auth, getTaskById);
router.put('/:id', auth, updateTask);
router.post('/:id/comments', auth, addCommentToTask);
router.post("/:id/block", auth, reportTaskBlocker);


export default router;
