// server/controllers/notification.controller.js
import NotificationService from '../services/NotificationService.js';
import User from '../../../server/models/User.model.js';

export const processMentions = async (req, res) => {
    try {
        const { text, authorName, entityId, entityType } = req.body;
        await NotificationService.processMentions(text, authorName, entityId, entityType);
        res.status(200).json({ message: 'Mentions processed successfully' });
    } catch (error) {
        console.error('Process mentions error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const notifyTaskAssignment = async (req, res) => {
    try {
        const { userId, taskId, taskName, assignerName } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        await NotificationService.notifyTaskAssignment(userId, taskId, taskName, assignerName);
        res.status(200).json({ message: 'Task assignment notification sent' });
    } catch (error) {
        console.error('Task assignment notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const notifyTaskBlockedOrDeclined = async (req, res) => {
    try {
        const { pmId, taskId, taskName, action, developerName } = req.body;
        if (!pmId) {
            return res.status(400).json({ message: 'Project manager ID is required' });
        }
        await NotificationService.notifyTaskBlockedOrDeclined(pmId, taskId, taskName, action, developerName);
        res.status(200).json({ message: 'Task status notification sent' });
    } catch (error) {
        console.error('Task status notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// WORKS FOR ALL ROLES
export const getUnreadNotifications = async (req, res) => {
    try {
        
        // NO ROLE FILTERING - Get notifications for ANY role
        const notifications = await NotificationService.getUnreadNotifications(req.user.id);
        
        res.status(200).json(notifications);
    } catch (error) {
        console.error('Get unread notifications error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// WORKS FOR ALL ROLES
export const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        await NotificationService.markNotificationAsRead(req.user.id, notificationId);
        res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification as read error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// WORKS FOR ALL ROLES
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const result = await User.updateOne(
            { _id: userId },
            { $set: { "notifications.$[].isRead": true } }
        );
        
        res.json({ message: "All notifications marked as read" });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ 
            message: "Failed to mark all as read",
            error: error.message 
        });
    }
};

// TEST ENDPOINT FOR ALL ROLES
export const testNotification = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role;        
        const message = `Test notification for ${userRole} role - ${new Date().toLocaleTimeString()}`;
        
        await User.findByIdAndUpdate(userId, {
            $push: {
                notifications: {
                    message,
                    relatedTo: null,
                    notificationModel: 'User',
                    isRead: false,
                    createdAt: new Date()
                }
            }
        });
        
        res.json({ 
            message: `Test notification created successfully`,
            userId,
            role: userRole,
            testMessage: message
        });
    } catch (error) {
        console.error('Test notification error:', error);
        res.status(500).json({ message: 'Test failed' });
    }
};


// Ticket assignment notification
export const notifyTicketAssignment = async (req, res) => {
    try {
        const { userId, ticketId, ticketTitle, assignerName } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        await NotificationService.notifyTicketAssignment(userId, ticketId, ticketTitle, assignerName);
        res.status(200).json({ message: 'Ticket assignment notification sent' });
    } catch (error) {
        console.error('Ticket assignment notification error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


/**
   * Notify ticket status change - FOR ALL ROLES
   */
export const notifyTicketStatusChange = async (req, res) => {
    try {
        let { userIds, ticketId, ticketTitle, newStatus, changerName } = req.body;

        if (!Array.isArray(userIds)) {
            userIds = [userIds];
        }

        const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName role');

        const message = `${changerName} changed ticket "${ticketTitle}" status to ${newStatus}`;

        await NotificationService.createNotifications(userIds, message, ticketId, 'Ticket');

        res.status(200).json({ message: 'Ticket status change notification sent' });
    } catch (error) {
        console.error('Error sending ticket status change notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// New function to handle test task blocker reported notifications
export const notifyTestTaskBlockerReported = async (req, res) => {
    try {
        // Extract data from req.body
        const { taskId, taskName, reporterName, recipientIds } = req.body;

        if (!taskId || !taskName || !reporterName || !recipientIds || recipientIds.length === 0) {
            return res.status(400).json({ message: 'Missing required notification data for blocker report' });
        }

        const message = `${reporterName} a rapporté un bloqueur sur la tâche de test "${taskName}".`;

        // Call the service to create notifications
        await NotificationService.notifyTestTaskBlockerReported(taskId, taskName, reporterName, recipientIds);

        res.status(200).json({ message: 'Test task blocker reported notification sent' });
    } catch (error) {
        console.error('Error sending test task blocker reported notification:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
