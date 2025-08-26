// server/routes/notification.routes.js
import express from 'express';
import { auth } from '../../middleware/auth.middleware.js';
import * as notificationController from '../../controllers/notification.controller.js';

const router = express.Router(); 

// ALL ENDPOINTS WORK FOR ALL ROLES
router.post('/mentions', auth, notificationController.processMentions);
router.post('/task-assignment', auth, notificationController.notifyTaskAssignment);
router.post('/ticket-assignment', auth, notificationController.notifyTicketAssignment);
router.post('/task-status', auth, notificationController.notifyTaskBlockedOrDeclined);
router.post('/task-status-change', auth, notificationController.notifyTicketStatusChange);

// New route for test task blocker reported notification
router.post('/test-task-blocker-reported', auth, notificationController.notifyTestTaskBlockerReported); // ADD THIS LINE


// Core notification endpoints - WORK FOR ALL ROLES
router.get('/unread', auth, notificationController.getUnreadNotifications);
router.patch('/:notificationId/read', auth, notificationController.markNotificationAsRead);
router.patch('/read-all', auth, notificationController.markAllAsRead);

export default router;