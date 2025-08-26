// server/services/TeamsIntegrationService.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Microsoft Teams webhook URL from environment variable
const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || '';

const TeamsIntegrationService = {
  /**
   * Create a Microsoft Teams channel for a ticket
   * @param {Object} ticket - The ticket object
   * @returns {Promise<string>} - The Teams channel URL
   */
  createTeamsChannel: async (ticket) => {
    try {
      console.log(`Creating Teams channel for ticket ${ticket.number}`);

      // This is a mock implementation - in a real application,
      // you would use Microsoft Graph API to create a Teams channel

      // For demonstration purposes, we're returning a mock Teams URL
      const teamsChannelUrl = `https://teams.microsoft.com/l/channel/${ticket._id}`;

      return teamsChannelUrl;
    } catch (error) {
      console.error('Error creating Teams channel:', error);
      throw error;
    }
  },

  /**
   * Send notification to Microsoft Teams about ticket creation
   * @param {Object} ticket - The ticket object
   * @returns {Promise<void>}
   */
  notifyTicketCreation: async (ticket) => {
    if (!TEAMS_WEBHOOK_URL) {
      console.warn('Teams webhook URL not configured. Skipping Teams notification.');
      return;
    }

    try {
      const message = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": `New Ticket: ${ticket.title}`,
        "sections": [
          {
            "activityTitle": `**New Ticket Created: ${ticket.number}**`,
            "activitySubtitle": ticket.title,
            "facts": [
              {
                "name": "Status",
                "value": ticket.status
              },
              {
                "name": "Urgency",
                "value": ticket.urgency
              },
              {
                "name": "Application",
                "value": ticket.application
              },
              {
                "name": "Environment",
                "value": ticket.environment
              }
            ],
            "text": ticket.description
          }
        ],
        "potentialAction": [
          {
            "@type": "OpenUri",
            "name": "View Ticket",
            "targets": [
              {
                "os": "default",
                "uri": `${process.env.APP_URL || 'http://0.0.0.0:3000'}/tickets/${ticket._id}`
              }
            ]
          }
        ]
      };

      if (TEAMS_WEBHOOK_URL) {
        await axios.post(TEAMS_WEBHOOK_URL, message);
        console.log(`Teams notification sent for ticket ${ticket.number}`);
      } else {
        console.log(`[Mock] Teams notification would be sent for ticket ${ticket.number}`);
      }
    } catch (error) {
      console.error('Error sending Teams notification:', error);
    }
  },

  /**
   * Update Teams channel with ticket status change
   * @param {Object} ticket - The ticket object
   * @param {string} previousStatus - The previous status
   * @returns {Promise<void>}
   */
  notifyStatusChange: async (ticket, previousStatus) => {
    if (!TEAMS_WEBHOOK_URL || !ticket.teamsLink) {
      return;
    }

    try {
      const message = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": `Ticket Status Changed: ${ticket.number}`,
        "sections": [
          {
            "activityTitle": `**Ticket Status Changed: ${ticket.number}**`,
            "activitySubtitle": ticket.title,
            "facts": [
              {
                "name": "Previous Status",
                "value": previousStatus
              },
              {
                "name": "New Status",
                "value": ticket.status
              },
              {
                "name": "Updated At",
                "value": new Date().toLocaleString()
              }
            ]
          }
        ],
        "potentialAction": [
          {
            "@type": "OpenUri",
            "name": "View Ticket",
            "targets": [
              {
                "os": "default",
                "uri": `${process.env.APP_URL || 'http://0.0.0.0:3000'}/tickets/${ticket._id}`
              }
            ]
          }
        ]
      };

      if (TEAMS_WEBHOOK_URL) {
        await axios.post(TEAMS_WEBHOOK_URL, message);
        console.log(`Teams notification sent for ticket status change ${ticket.number}`);
      } else {
        console.log(`[Mock] Teams status change notification would be sent for ticket ${ticket.number}`);
      }
    } catch (error) {
      console.error('Error sending Teams status notification:', error);
    }
  },

  /**
   * Notify Teams channel about a new comment
   * @param {Object} ticket - The ticket object
   * @param {Object} comment - The comment object
   * @returns {Promise<void>}
   */
  notifyNewComment: async (ticket, comment) => {
    if (!TEAMS_WEBHOOK_URL || !ticket.teamsLink) {
      return;
    }

    try {
      const message = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": `New Comment on Ticket: ${ticket.number}`,
        "sections": [
          {
            "activityTitle": `**New Comment on Ticket: ${ticket.number}**`,
            "activitySubtitle": `From: ${comment.author}`,
            "text": comment.text
          }
        ],
        "potentialAction": [
          {
            "@type": "OpenUri",
            "name": "View Ticket",
            "targets": [
              {
                "os": "default",
                "uri": `${process.env.APP_URL || 'http://10.10.11.18:3000'}/tickets/${ticket._id}`
              }
            ]
          }
        ]
      };

      if (TEAMS_WEBHOOK_URL) {
        await axios.post(TEAMS_WEBHOOK_URL, message);
        console.log(`Teams notification sent for new comment on ticket ${ticket.number}`);
      } else {
        console.log(`[Mock] Teams comment notification would be sent for ticket ${ticket.number}`);
      }
    } catch (error) {
      console.error('Error sending Teams comment notification:', error);
    }
  },

  /**
   * Schedule a Teams meeting for a ticket
   * @param {Object} ticket - The ticket object
   * @param {Object} meetingDetails - Meeting details
   * @returns {Promise<string>} - The Teams meeting URL
   */
  scheduleMeeting: async (ticket, meetingDetails) => {
    try {
      console.log(`Scheduling Teams meeting for ticket ${ticket.number}`);

      // This is a mock implementation - in a real application,
      // you would use Microsoft Graph API to schedule a Teams meeting

      // For demonstration purposes, we're returning a mock meeting URL
      const meetingUrl = `https://teams.microsoft.com/l/meetup-join/meeting_${Date.now()}`;

      return meetingUrl;
    } catch (error) {
      console.error('Error scheduling Teams meeting:', error);
      throw error;
    }
  }
};

export default TeamsIntegrationService;