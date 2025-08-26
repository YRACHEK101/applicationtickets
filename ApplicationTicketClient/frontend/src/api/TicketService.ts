import api from './api';

export interface TicketFormData {
  title: string;
  application: string;
  environment: string;
  requestType: string;
  urgency: string;
  description: string;
  driveLink?: string;
  additionalInfo?: string;
  links?: Array<{ description: string; url: string }>;
  contacts?: Array<{
    name: string;
    email: string;
    phone?: string;
    availability?: string[];
  }>;
  status?: string;
  files?: File[];
}

export const TicketService = {
  // Get all tickets based on user role
  getAllTickets: async () => {
    try {
      // Make sure this is just "/tickets" not "/api/tickets" since the base URL already includes "/api"
      const response = await api.get('/v1/ticket/tickets');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get tickets for client
  getClientTickets: async () => {
    try {
      const response = await api.get('/v1/ticket/client');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get tickets for agent
  getAgentTickets: async () => {
    try {
      const response = await api.get('/v1/ticket/agent');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get tickets for responsible client
  getResponsibleTickets: async () => {
    try {
      const response = await api.get('/v1/ticket/responsible');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get tickets for commercial
  getCommercialTickets: async () => {
    try {
      const response = await api.get('/v1/ticket/commercial');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get tickets for responsible client
  getResponsibleTesterTickets: async () => {
    try {
      const response = await api.get('/v1/ticket/responsibletester');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getProjectManagerTickets: async () => {
    try {
      const response = await api.get('/v1/ticket/projectmanager');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  getGroupLeaderTickets: async () => {
    try {
      const response = await api.get('/v1/ticket/groupleader');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // Get ticket by ID
  getTicketById: async (ticketId: string) => {
    try {
      const response = await api.get(`/v1/ticket/ticket/${ticketId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a new ticket
  createTicket: async (ticketData: TicketFormData | FormData) => {
    try {
      if (ticketData instanceof FormData) {
        const response = await api.post('/v1/ticket/ticket', ticketData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        return response.data;
      } else {
        const response = await api.post('/v1/ticket/ticket', ticketData);
        return response.data;
      }
    } catch (error) {
      throw error;
    }
  },

  saveDraftWithFormData: async (formData: FormData) => {
    try {
      const response = await api.post('/v1/ticket/ticket', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Save ticket as draft
  saveDraft: async (ticketData: TicketFormData) => {
    try {
      // Handle file uploads if needed
      if (ticketData.files && ticketData.files.length > 0) {
        const formData = new FormData();

        // Add ticket data as JSON string
        formData.append('ticketData', JSON.stringify(ticketData));

        // Add files
        ticketData.files.forEach(file => {
          formData.append('files', file);
        });

        const response = await api.post('/v1/ticket/draft', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        return response.data;
      } else {
        // Regular JSON request without files
        const response = await api.post('/v1/ticket/draft', ticketData);
        return response.data;
      }
    } catch (error) {
      console.error('Save draft error:', error);
      throw error;
    }
  },

  // Send a draft ticket
  sendTicket: async (ticketId: string) => {
    try {
      const response = await api.put(`/v1/ticket/${ticketId}/send`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update ticket status
  updateTicketStatus: async (ticketId: string, status: string) => {
    try {
      const response = await api.patch(`/v1/ticket/${ticketId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update ticket status
  updateTicketFinancialStatus: async (ticketId: string, status: string) => {
    try {
      const response = await api.patch(`/v1/ticket/${ticketId}/financialstatus`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  // Update ticket
  updateTicket: async (ticketId: string, updateData: any) => {
    try {
      const response = await api.patch(`/v1/ticket/ticket/${ticketId}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add comment to ticket
  addComment: async (ticketId: string, formData: FormData) => {
    try {
      const response = await api.post(`/v1/ticket/${ticketId}/comments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  // Create a meeting
  createMeeting: async (ticketId: string, meetingData: {
    title: string;
    dateTime: string;
    meetingLink: string;
    agenda?: string;
    selectedAgents: string[];
  }) => {
    try {
      const response = await api.post(`/v1/ticket/${ticketId}/meetings`, meetingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create intervention
  createIntervention: async (ticketId: string, interventionData: {
    type: string;
    urgencyLevel: string;
    description: string;
    deadline: string;
  }) => {
    try {
      const response = await api.post(`/v1/ticket/${ticketId}/interventions`, interventionData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Start intervention
  startIntervention: async (ticketId: string) => {
    try {
      const response = await api.post(`/v1/ticket/${ticketId}/interventions`, { action: 'start' });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Request intervention validation
  requestValidation: async (ticketId: string) => {
    try {
      const response = await api.post(`/v1/ticket/${ticketId}/interventions/validate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Validate or reject intervention
  validateIntervention: async (ticketId: string, interventionId: string, isApproved: boolean) => {
    try {
      const response = await api.post(`/v1/ticket/${ticketId}/interventions/${interventionId}/validate`, { isApproved });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Add blocker to intervention
  addBlocker: async (ticketId: string, interventionId: string, blockerData: {
    type: string;
    description: string;
    impact: string;
  }) => {
    try {
      const response = await api.post(`/v1/ticket/${ticketId}/interventions/${interventionId}/blockers`, blockerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resolve a blocker
  resolveBlocker: async (ticketId: string, interventionId: string, blockerId: string, resolutionNotes: string) => {
    try {
      const response = await api.patch(
        `/v1/ticket/${ticketId}/interventions/${interventionId}/blockers/${blockerId}`,
        { resolutionNotes }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Assign team members to a ticket
  assignTeam: async (ticketId: string, assignmentData: {
    responsibleClient?: string;
    commercial?: string;
    agents?: string[];
  }) => {
    try {
      const response = await api.post(`/v1/ticket/${ticketId}/assign`, assignmentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get ticket statistics
  getTicketStats: async () => {
    try {
      const response = await api.get('/v1/ticket/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get recent activity
  getRecentActivity: async () => {
    try {
      const response = await api.get('/v1/ticket/recent-activity');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get available users for assignment
  getAvailableUsers: async () => {
    try {
      const response = await api.get('/v1/user/available');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  downloadAttachment: async (ticketId, attachmentId) => {
    try {
      const response = await api.get(`/v1/ticket/${ticketId}/attachments/${attachmentId}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw error;
    }
  },

  // Add comment with files
  // addComment: async (ticketId: string, formData: FormData) => {
  //   try {
  //     const response = await api.post(`/v1/ticket/${ticketId}/comments`, formData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //       },
  //     });
  //     return response.data;
  //   } catch (error) {
  //     throw error;
  //   }
  // }
};

export default TicketService;