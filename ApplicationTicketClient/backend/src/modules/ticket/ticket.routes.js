import * as ticketController from '../../controllers/tickets.controller.js';
import express from 'express';
import multer from 'multer';
import { auth, authorize } from '../../../server/middleware/auth.middleware.js';
import { validate } from '../../../server/middleware/validate.js';
import {assignRolesValidator,
        resolveBlockerValidator,
        addBlockerValidator,
        validateOrRejectInterventionValidator,
        validateInterventionValidator,
        addInterventionToTicketValidator,
        addMeetingToTicketValidator,
        addCommentToTicketValidator,
        updateTicketValidator,
        updateTicketStatusValidator,
        createTicketValidator
} from '../../../server/validators/ticket.validator.js'
import upload from '../../../server/config/multer.config.js'; // Import from the new config file

const router = express.Router();

// @route   GET /api/tickets/client
// @desc    Get client's tickets
// @access  Private (Client role only)
router.get('/client', auth, authorize(['client']), ticketController.getClientTickets);
router.get('/agent', auth, authorize(['agentCommercial']), ticketController.getAgentTickets);
router.get('/responsible', auth, authorize(['responsibleClient']), ticketController.getResponsibleTickets);
router.get('/commercial', auth, authorize(['agentCommercial']), ticketController.getCommercialTickets);
router.get('/responsibletester', auth, authorize(['responsibleTester']), ticketController.getResponsibleTesterTickets);
router.get('/groupleader', auth, authorize(['groupLeader']), ticketController.getGroupLeaderTickets);
router.get('/responsibletester', auth, authorize(['responsibleTester']), ticketController.getResponsibleTesterTickets);
router.get('/projectmanager', auth, authorize(['projectManager']), ticketController.getProjectManagerTickets);
router.get('/stats', auth, ticketController.getStats);
router.get('/recent-activity', auth,authorize(['admin','agentCommercial', 'responsibleClient','client','groupLeader','projectManager','responsibleTester']), ticketController.getRecentActivity);
router.get('/tickets', auth, ticketController.getTickets);
router.get('/ticket/:id', auth, ticketController.getTicketById);

router.patch('/:id/status', auth, authorize(['admin', 'responsibleClient']), validate, updateTicketStatusValidator ,ticketController.updateTicketStatus);
router.patch('/ticket/:id', auth, authorize(['admin', 'responsibleClient','projectManager']), validate, updateTicketValidator,ticketController.updateTicket);
// Update the comment route to handle file uploads
router.post('/:id/comments', 
  auth, 
  upload.array('files'), // Add multer middleware
  validate, 
  addCommentToTicketValidator, 
  ticketController.addCommentToTicket
);
router.get('/:id/availability', auth, validate, ticketController.getTicketAvailability);
router.post('/:id/meetings', auth, validate, addMeetingToTicketValidator, authorize(['admin', 'responsibleClient']), ticketController.addMeetingToTicket);
router.post('/:id/interventions', auth, validate, addInterventionToTicketValidator, authorize(['admin', 'agentCommercial','responsibleClient']), ticketController.addInterventionToTicket);
router.post('/:id/interventions/validate', auth, validate, validateInterventionValidator, authorize(['admin', 'agentCommercial','responsibleClient']), ticketController.requestValidation);
router.post('/:id/interventions/:interventionId/validate', auth, validate, validateOrRejectInterventionValidator, authorize(['admin', 'responsibleClient','agentCommercial',]), ticketController.validateOrReject);
router.post('/:id/interventions/:interventionId/blockers', auth, validate, addBlockerValidator, authorize(['admin', 'agentCommercial','responsibleClient']), ticketController.addBlockerToIntervention);
router.patch('/:id/interventions/:interventionId/blockers/:blockerId', auth, validate, resolveBlockerValidator, authorize(['admin', 'responsibleClient','agentCommercial',]), ticketController.resolveBlocker);
router.post('/:id/assign', auth, validate, assignRolesValidator, authorize(['admin','agentCommercial']), ticketController.assignTicketRoles);

router.post(
        '/ticket',
        auth,
        authorize(['admin','agentCommercial', 'client']),
        validate,
        upload.array('files'), 
        createTicketValidator,
        ticketController.createTicket
);

// @route   POST /api/tickets/draft
// @desc    Save a ticket as draft
// @access  Private
router.post(
        '/draft',
        auth,
        authorize(['admin','agentCommercial', 'client']),
        upload.array('files'),
        ticketController.createTicket
);

router.get('/:id/attachments/:attachmentId', auth, ticketController.downloadAttachment);

// @route   PUT /api/v1/ticket/:id/send
// @desc    Send a draft ticket (change status from Draft to Sent)
// @access  Private
router.put(
  '/:id/send',
  auth,
  authorize(['admin', 'agentCommercial', 'client']),
  ticketController.sendDraftTicket
);

export default router;
