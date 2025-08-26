import { body } from 'express-validator';

export const createTaskValidator = [
  body('name').notEmpty().withMessage('Task name is required'),
  body('description').notEmpty().withMessage('Task description is required'),
  body('urgency').optional().isIn(['Critical', 'High', 'Medium', 'Low']).withMessage('Invalid urgency level'),
  body('priority').optional().isIn(['1', '2', '3', '4', '5']).withMessage('Priority must be between 1 and 5'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('assignedTo').optional().custom((value, { req }) => {
    // Handle array format from form data
    if (Array.isArray(value)) {
      return value.every(id => typeof id === 'string' && id.trim() !== '');
    }
    // Handle single value case
    if (typeof value === 'string') {
      return value.trim() !== '';
    }
    return true; // Allow empty/undefined assignedTo
  }).withMessage('Invalid assignedTo value'),
  body('assignedTo.*').optional().isMongoId().withMessage('Invalid user ID format') 
];

export const updateTaskValidator = [
  body('name').optional().notEmpty().withMessage('Task name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Task description cannot be empty'),
  body('urgency').optional().isIn(['Critical', 'High', 'Medium', 'Low']).withMessage('Invalid urgency level'),
  body('priority').optional().isIn(['1', '2', '3', '4', '5']).withMessage('Priority must be between 1 and 5'),
  body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
  body('assignedTo').optional().custom(value => {
    // Check if it's an array of IDs or a single ID string
    if (Array.isArray(value)) {
      // Validate each ID in the array
      return value.every(id => typeof id === 'string' && id.trim() !== '');
    } else if (typeof value === 'string') {
      // Validate single ID string
      return value.trim() !== '';
    }
    return true; // Allow empty/undefined assignedTo
  }).withMessage('Invalid assignedTo value')
];