// server/services/NotificationService.js
import User from '../models/User.model.js';
    

const NotificationService = {
  
  extractMentions: (text) => {
    if (!text) return [];
    
    const mentionRegex = /@(\w+)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[1]);
    }
    
    return mentions;
  },
  
  /**
   * Find user IDs based on extracted mentions
   */
  findUsersByMentions: async (mentions) => { 
    if (!mentions || mentions.length === 0) return [];
    
    try {
      const users = await User.find({
        $or: mentions.map(mention => ({
          $expr: { 
            $eq: [
              { $concat: ["$firstName", "$lastName"] }, 
              mention
            ]
          }
        }))
      }).select('_id firstName lastName role');
      
      return users.map(user => user._id);
    } catch (error) {
      console.error('Error finding users by mentions:', error);
      return [];
    }
  },
  
  /**
   * Create notification for users - WORKS FOR ALL ROLES
   */
  createNotifications: async function (userIds, message, relatedTo, model) { 
    if (!userIds || userIds.length === 0){
        console.log('DEBUG: createNotifications - No user IDs provided, skipping notification creation.');
        return;
    }

    try {
      const result = await User.updateMany( 
        { _id: { $in: userIds } },
        {
          $push: {
            notifications: {
              message,
              relatedTo,
              notificationModel: model,
              isRead: false,
              createdAt: new Date()
            }
          }
        }
      );
     
      
    } catch (error) {
      console.error('Error creating notifications:', error);
    }
  },
  
  /**
   * Process mentions - WORKS FOR ALL ROLES
   */
  processMentions: async function (text, authorName, entityId, entityType) { 
    try {
      const mentions = this.extractMentions(text); 
      if (mentions.length === 0) return;
      
      const userIds = await this.findUsersByMentions(mentions);
      if (userIds.length === 0) return;
      
      const message = `${authorName} mentioned you in a ${entityType.toLowerCase()}`;
      
      await this.createNotifications(userIds, message, entityId, entityType); 
      
    } catch (error) {
      console.error('Error processing mentions:', error);
    }
  },
  
  /**
   * Notify user when assigned to a task - WORKS FOR ALL ROLES
   */
  notifyTaskAssignment: async function (userId, taskId, taskName, assignerName) { 
    try {
      const user = await User.findById(userId).select('firstName lastName role');
      if (!user) {
        console.error(`User not found: ${userId}`);
        return;
      }
            
      const message = `${assignerName} assigned you to task: ${taskName}`;
      
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            message,
            relatedTo: taskId,
            notificationModel: 'Task',
            isRead: false,
            createdAt: new Date()
          }
        }
      });
      
    } catch (error) {
      console.error('Error sending task assignment notification:', error);
    }
  },
  
  /**
   * Notify when task is blocked or declined - WORKS FOR ALL ROLES
   */
  notifyTaskBlockedOrDeclined: async function (pmId, taskId, taskName, action, developerName) { 
    try {
      const pm = await User.findById(pmId).select('firstName lastName role');
      if (!pm) {
        console.error(`Project manager not found: ${pmId}`);
        return;
      }
            
      const message = `${developerName} has ${action} task: ${taskName}`;
      
      await User.findByIdAndUpdate(pmId, {
        $push: {
          notifications: {
            message,
            relatedTo: taskId,
            notificationModel: 'Task',
            isRead: false,
            createdAt: new Date()
          }
        }
      });
      
    } catch (error) {
      console.error(`Error sending task ${action} notification:`, error);
    }
  },

  /**
   * Notify ticket assignment - FOR ALL ROLES
   */
  notifyTicketAssignment: async function (userId, ticketId, ticketTitle, assignerName) { 
    try {
      const user = await User.findById(userId).select('firstName lastName role');
      if (!user) {
        console.error(`User not found: ${userId}`);
        return;
      }
            
      const message = `${assignerName} assigned you to ticket: ${ticketTitle}`;
      
      await User.findByIdAndUpdate(userId, {
        $push: {
          notifications: {
            message,
            relatedTo: ticketId,
            notificationModel: 'Ticket',
            isRead: false,
            createdAt: new Date()
          }
        }
      });
      
    } catch (error) {
      console.error('Error sending ticket assignment notification:', error);
    }
  },

  /**
   * Notify ticket status change - FOR ALL ROLES
   */
  notifyTicketStatusChange: async function (userIds, ticketId, ticketTitle, newStatus, changerName) { 
    try {
      if (!Array.isArray(userIds)) {
        userIds = [userIds];
      }
      
      const message = `${changerName} changed ticket "${ticketTitle}" status to ${newStatus}`;
      
      await this.createNotifications(userIds, message, ticketId, 'Ticket'); 
      
    } catch (error) {
      console.error('Error sending ticket status change notification:', error);
    }
  },

  /**
   * General notification for all roles
   */
  createGeneralNotification: async function (userIds, message, relatedTo = null, model = 'User') { 
    try {
      if (!Array.isArray(userIds)) {
        userIds = [userIds];
      }
      
      await this.createNotifications(userIds, message, relatedTo, model); 
      
    } catch (error) {
      console.error('Error sending general notification:', error);
    }
  },
  
  /**
   * Get user's unread notifications - WORKS FOR ALL ROLES
   */
  getUnreadNotifications: async function (userId) { 
    try {      
      const user = await User.findById(userId)
        .select('notifications firstName lastName role')
        .populate({
          path: 'notifications.relatedTo',
          select: 'number title name'
        });
      
      if (!user) {
        return [];
      }

      if (!user.notifications) {
        return [];
      }
      
      const unreadNotifications = user.notifications.filter(n => !n.isRead);
      
      return unreadNotifications;
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  },
  
  /**
   * Mark notification as read - WORKS FOR ALL ROLES
   */
  markNotificationAsRead: async function (userId, notificationId) { 
    try {
      await User.updateOne(
        { 
          _id: userId,
          'notifications._id': notificationId
        },
        {
          $set: { 'notifications.$.isRead': true }
        }
      );
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },
  // NEW FUNCTION: Notify when a test task blocker is reported
  notifyTestTaskBlockerReported: async function (taskId, taskName, reporterName, recipientIds) { 
    try {
        const message = `${reporterName} a rapporté un bloqueur sur la tâche de test "${taskName}".`;
        await this.createNotifications(recipientIds, message, taskId, 'TestTask'); 
    } catch (error) {
        console.error('Error in notifyTestTaskBlockerReported service:', error);
    }
  }
};

export default NotificationService;
