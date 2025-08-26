// controllers/ticketController.js
import * as ticketService from './tickets.service.js';
import path from 'path';
import fs from 'fs'; 
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_UPLOADS_ROOT = path.join(process.cwd(), "server", "uploads");

export const getClientTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getClientTickets(req.user.id);
        res.json(tickets);
    } catch (error) {
        console.error('Get client tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAgentTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getAgentTickets(req.user.id);
        res.json(tickets);
    } catch (error) {
        console.error('Get agent tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getResponsibleTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getResponsibleTickets(req.user.id);
        res.json(tickets);
    } catch (error) {
        console.error('Get responsible tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getResponsibleTesterTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getResponsibleTesterTickets(req.user.id);
        res.json(tickets);
    } catch (error) {
        console.error('Get responsible tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getCommercialTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getCommercialTickets(req.user.id);
        res.json(tickets);
    } catch (error) {
        console.error('Get commercial tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getProjectManagerTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getProjectManagerTickets(req.user.id);
        res.json(tickets);
    } catch (error) {
        console.error('Get commercial tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getGroupLeaderTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getGroupLeaderTickets(req.user.id);
        res.json(tickets);
    } catch (error) {
        console.error('Get commercial tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getStats = async (req, res) => {
    try {
        const stats = await ticketService.getStats(req.user);
        res.json(stats);
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getRecentActivity = async (req, res) => {
    try {
        const activities = await ticketService.getRecentActivity(req.user);
        res.json(activities);
    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTickets = async (req, res) => {
    try {
        const tickets = await ticketService.getTickets(req.user);
        res.json(tickets);
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getTicketById = async (req, res) => {
    try {
        const ticket = await ticketService.getTicketById(req.params.id, req.user);
        res.json(ticket);
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const createTicket = async (req, res) => {
    try {
        const newTicket = await ticketService.createTicket(req.user, req.body, req.files);
        res.status(201).json(newTicket);
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   PATCH /api/tickets/:id/status
// @desc    Update ticket status
// @access  Private (Admin and ResponsibleClient only)
export const updateTicketStatus = async (req, res) => {
    try {
        const updatedTicket = await ticketService.updateTicketStatus(req.params.id, req.body, req.user);
        res.json(updatedTicket);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update ticket status
// @access  Private (Admin and ResponsibleClient only)
export const updateTicket = async (req, res) => {
    try {
        const updatedTicket = await ticketService.updateTicket(req.params.id, req.body, req.user);
        res.json(updatedTicket);
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   POST /api/tickets/:id/comments
// @desc    Add a comment to a ticket
// @access  Private
export const addCommentToTicket = async (req, res) => {
    try {
        const updatedTicket = await ticketService.addCommentToTicket(req.params.id, req.body, req.user, req.files);
        res.json(updatedTicket);
    } catch (error) {
        console.error('Add comment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   GET /api/tickets/:id/availability
// @desc    Get availability slots for a ticket
// @access  Private
export const getTicketAvailability = async (req, res) => {
    try {
        const availabilitySlots = await ticketService.getTicketAvailability(req.params.id);
        res.json(availabilitySlots);
    } catch (error) {
        console.error('Get availability error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   POST /api/tickets/:id/meetings
// @desc    Add a meeting to a ticket
// @access  Private (ResponsibleClient and Admin only)
export const addMeetingToTicket = async (req, res) => {
    try {
        const updatedTicket = await ticketService.addMeetingToTicket(req.params.id, req.body, req.user);
        res.json(updatedTicket);
    } catch (error) {
        console.error('Add meeting error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @route   POST /api/tickets/:id/interventions
// @desc    Create or start an intervention
// @access  Private (Agent role only)
export const addInterventionToTicket = async (req, res) => {
    try {
        const updatedTicket = await ticketService.addInterventionToTicket(req.params.id, req.body, req.user);
        res.json(updatedTicket);
    } catch (error) {
        console.error('Intervention error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


export const requestValidation = async (req, res) => {
    try {
        const updatedTicket = await ticketService.validateIntervention(req.params.id, req.user.id);
        res.json(updatedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const validateOrReject = async (req, res) => {
    try {
        const { isApproved } = req.body;
        if (isApproved === undefined) {
            return res.status(400).json({ message: 'Validation decision is required' });
        }
        const updatedTicket = await ticketService.validateOrRejectIntervention(req.params.id, req.params.interventionId, isApproved, req.user.id);
        res.json(updatedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addBlockerToIntervention = async (req, res) => {
    try {
        const updatedTicket = await ticketService.addBlocker(req.params.id, req.params.interventionId, req.body, req.user.id);
        res.json(updatedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const resolveBlocker = async (req, res) => {
    try {
        const updatedTicket = await ticketService.resolveBlocker(req.params.id, req.params.interventionId, req.params.blockerId, req.body.resolutionNotes, req.user.id);
        res.json(updatedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const assignTicketRoles = async (req, res) => {
    try {
        const updatedTicket = await ticketService.assignRoles(req.params.id, req.body, req.user.id, req.user.role);
        res.json(updatedTicket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const downloadAttachment = async (req, res) => {
    try {

        console.log(`[Controller] Download request for ticketId: ${req.params.id}, attachmentId: ${req.params.attachmentId}`);

        const attachment = await ticketService.downloadAttachment(req.params.id, req.params.attachmentId);
        console.log('[Controller] Attachment object from service:', attachment);

        
        if (!attachment) {
            console.warn('[Controller] Attachment not found by service.');

            return res.status(404).json({ message: 'Attachment not found' });
        }

        // Check if attachment.path exists and is valid
        if (!attachment.path || !fs.existsSync(attachment.path)) {
            console.error(`[Controller] File path missing or file not found on disk: ${attachment.path}`);
            return res.status(404).json({ message: 'File not found on server.' });
        }

        // Set appropriate headers
        res.setHeader('Content-Type', attachment.contentType || 'application/octet-stream'); // Add fallback
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.name || attachment.filename}"`); // Use name first, then filename

        // Log the path being sent
        console.log(`[Controller] Sending file from path: ${attachment.path}`);


        // Send the file
        res.sendFile(attachment.path, (err) => {
            if (err) {
                console.error('[Controller] Error sending file with res.sendFile:', err);
                // Check if headers have already been sent to avoid "Cannot set headers after they are sent"
                if (!res.headersSent) {
                    res.status(500).json({ message: 'Error sending file.' });
                }
            } else {
                console.log(`[Controller] File ${attachment.name || attachment.filename} sent successfully.`);
            }
        });
    } catch (error) {
       console.error('[Controller] Download attachment error (catch block):', error);
        res.status(500).json({ message: 'Server error', details: error.message });
   
    }
};

/**
 * @desc    Send a draft ticket (change status from Draft to Sent)
 * @route   PUT /api/v1/ticket/:id/send
 * @access  Private
 */
export const sendDraftTicket = async (req, res) => {
    try {
        // Find the ticket and verify it's a draft
        const ticket = await ticketService.getTicketById(req.params.id);
        
        if (!ticket) {
            return res.status(404).json({ message: 'Ticket not found' });
        }
        
        if (ticket.status !== 'Draft') {
            return res.status(400).json({ message: 'Only draft tickets can be sent' });
        }
        
        // Update the ticket status to 'Sent'
        const updatedTicket = await ticketService.updateTicketStatus(
            req.params.id, 
            { status: 'Sent' }, 
            req.user
        );
        
        res.json(updatedTicket);
    } catch (error) {
        console.error('Send draft ticket error:', error);
        res.status(500).json({ message: error.message || 'Server error' });
    }
};