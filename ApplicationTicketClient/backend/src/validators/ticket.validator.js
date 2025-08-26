import { body, param  } from "express-validator";

export const createTicketValidator = [
  body('title').notEmpty().withMessage('Title is required'),
  body('application').notEmpty().withMessage('Application is required'),
  body('environment').notEmpty().isIn(['Production', 'Test', 'Development']).withMessage('Invalid environment'),
  body('requestType').notEmpty().isIn(['Incident', 'Improvement', 'Other']).withMessage('Invalid request type'),
  body('urgency').notEmpty().isIn(['Critical', 'High', 'Medium', 'Low']).withMessage('Invalid urgency level'),
  body('description').notEmpty().withMessage('Description is required'),
  body('status').optional().isIn([
    'Registered', 'Sent', 'InProgress', 'TechnicalValidation', 'Revision', 
    'ClientValidation', 'Validated', 'Closed', 'Transferred', 'Expired'
  ]).withMessage('Invalid status'),
  body('financialStatus').optional().isIn([
    'ToQualify', 'Subscription', 'Quote', 'FlexSubscription', 
    'ExcessHours', 'ExcessInterventions', 'ExtraOn'
  ]).withMessage('Invalid financial status'),
  body('driveLink').optional().isURL().withMessage('Invalid drive link'),
  body('links').optional().isArray().withMessage('Links must be an array'),
  body('links.*.description').optional().isString().withMessage('Link description must be a string'),
  body('links.*.url').optional().isURL().withMessage('Each link must have a valid URL'),
  body('contacts').optional().isArray().withMessage('Contacts must be an array'),
  body('contacts.*.name').optional().notEmpty().withMessage('Contact name is required'),
  body('contacts.*.email').optional().isEmail().withMessage('Valid contact email is required'),
  body('contacts.*.phone').optional().isString(),
  body('contacts.*.availability').optional().isArray().withMessage('Availability must be an array'),
  body('clientId').optional().isMongoId().withMessage('Invalid client ID'),
];


export const updateTicketStatusValidator = [
    body('status')
      .notEmpty().withMessage('Status is required')
      .isIn([
        'Registered', 'Sent', 'InProgress', 'TechnicalValidation', 'Revision',
        'ClientValidation', 'Validated', 'Closed', 'Transferred', 'Expired'
      ]).withMessage('Invalid status value')
];


export const updateTicketValidator = [
    body('financialStatus')
      .optional()
      .isIn([
        'ToQualify', 'Subscription', 'Quote', 'FlexSubscription',
        'ExcessHours', 'ExcessInterventions', 'ExtraOn'
      ]).withMessage('Invalid financial status'),
    
    body('estimatedHours')
      .optional()
      .isNumeric().withMessage('Estimated hours must be a number')
      .custom(value => value >= 0).withMessage('Estimated hours must be non-negative'),
    
    body('actualHours')
      .optional()
      .isNumeric().withMessage('Actual hours must be a number')
      .custom(value => value >= 0).withMessage('Actual hours must be non-negative')
];


export const addCommentToTicketValidator = [
  body('comment')
    .notEmpty()
    .withMessage('Comment text is required')
    .isString()
    .withMessage('Comment must be a string')
    .isLength({ max: 1000 })
    .withMessage('Comment must not exceed 1000 characters')
];


export const addMeetingToTicketValidator = [
  body('title')
    .notEmpty().withMessage('Meeting title is required')
    .isString().withMessage('Meeting title must be a string'),

  body('dateTime')
    .notEmpty().withMessage('Meeting dateTime is required')
    .isISO8601().withMessage('Invalid meeting date format'),

  body('meetingLink')
    .notEmpty().withMessage('Meeting link is required')
    .isURL().withMessage('Meeting link must be a valid URL'),

  body('agenda')
    .optional()
    .isString().withMessage('Agenda must be a string'),

  body('selectedAgents')
    .optional()
    .isArray().withMessage('Selected agents must be an array of user IDs')
];

export const addInterventionToTicketValidator = [
    body('action')
      .optional()
      .isIn(['start']).withMessage('Invalid action type'),
  
    body('type')
      .if(body('action').not().equals('start'))
      .notEmpty().withMessage('Intervention type is required')
      .isString().withMessage('Intervention type must be a string'),
  
    body('urgencyLevel')
      .if(body('action').not().equals('start'))
      .notEmpty().withMessage('Urgency level is required')
      .isString().withMessage('Urgency level must be a string'),
  
    body('description')
      .if(body('action').not().equals('start'))
      .notEmpty().withMessage('Description is required')
      .isString().withMessage('Description must be a string'),
  
    body('deadline')
      .if(body('action').not().equals('start'))
      .optional()
      .isString().withMessage('Deadline must be a string')
];

export const validateInterventionValidator = [
    param('ticketId')
      .isMongoId().withMessage('Invalid ticket ID'),
];
  
export const validateOrRejectInterventionValidator = [
    param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
    param('interventionId').isMongoId().withMessage('Invalid intervention ID'),
    body('isApproved')
      .not().isEmpty().withMessage('Approval decision is required')
      .isBoolean().withMessage('Approval decision must be true or false')
];

export const addBlockerValidator = [
    param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
    param('interventionId').isMongoId().withMessage('Invalid intervention ID'),
    body('type').notEmpty().withMessage('Blocker type is required'),
    body('description').notEmpty().withMessage('Blocker description is required'),
    body('impact').notEmpty().withMessage('Blocker impact is required'),
];

export const resolveBlockerValidator = [
    param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
    param('interventionId').isMongoId().withMessage('Invalid intervention ID'),
    param('blockerId').isMongoId().withMessage('Invalid blocker ID'),
    body('resolutionNotes').notEmpty().withMessage('Resolution notes are required')
];

export const assignRolesValidator = [
    param('ticketId').isMongoId().withMessage('Invalid ticket ID'),
    body('responsibleClient').optional().isMongoId().withMessage('Invalid responsibleClient ID'),
    body('commercial').optional().isMongoId().withMessage('Invalid commercial ID'),
    body('groupLeader').optional().isMongoId().withMessage('Invalid groupLeader ID'),
    body('projectManager').optional().isMongoId().withMessage('Invalid projectManager ID')
];