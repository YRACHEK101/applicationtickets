import express from 'express';
import { auth, authorize } from '../../middleware/auth.middleware.js';
import { 
  getAllUsersController, 
  getUsersByRoleController, 
  getAvailableUsersController, 
  getUserByIdController, 
  createUserController, 
  updateUserController, 
  deleteUserController,
  changePasswordController,
  getHierarchicalUsers,
  getLeadersWithDevelopers,
  getClientsByCreatorController,
  getResponsibleTestersController,
  getTestersController
} from '../../controllers/user.controller.js';

const router = express.Router();

// Get all users
router.get('/', auth, getAllUsersController);

// Get users by role
router.get('/role/:role', auth, getUsersByRoleController);

// Get available users for assignment
router.get('/available', auth, getAvailableUsersController);

// Get hierarchical users structure (project managers -> group leaders -> developers)
router.get('/hierarchical', auth, authorize(['admin', 'projectManager']), getHierarchicalUsers);

// Get group leaders with their developers
router.get('/leaders-with-developers', auth, getLeadersWithDevelopers);
router.get('/testers', auth, getTestersController);

router.get('/responsible-testers', auth, getResponsibleTestersController);

// Get clients created by the current user
router.get('/clients/:userId', auth, getClientsByCreatorController);

// Get user by ID
router.get('/:id', auth, authorize(['admin']), getUserByIdController);

// Create a new user
router.post('/', auth, authorize(['admin']), createUserController);

// Update user
router.put('/:id', auth, authorize(['admin', 'agentCommercial']), updateUserController);

// Change password
router.put('/:id/change-password', auth, changePasswordController);

// Delete user
router.delete('/:id', auth, authorize(['admin', 'agentCommercial']), deleteUserController);


export default router;
