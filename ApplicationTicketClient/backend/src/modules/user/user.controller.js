// src/controllers/userController.js
import mongoose from 'mongoose';
import {
  getAllUsers,
  getUsersByRole,
  getAvailableUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  findUserByEmail,
  updateUserPassword,
  getHierarchicalUsers as getHierarchicalUsersService,
  getLeadersWithDevelopers as getLeadersWithDevelopersService,
  getTesters,
  getClientsByCreator as getClientsByCreatorService,
  getTestersWithResponsible as getTestersWithResponsibleService
} from '../services/user.service.js';
import bcrypt from 'bcryptjs';

const getAllUsersController = async (req, res) => {
  try {
    if (req.user.role === 'agentCommercial') {
      const clients = await getClientsByCreatorService(req.user.id);
      return res.json(clients);
    }
    const users = await getAllUsers(req.user.id);
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get users by role (agent, commercial, responsibleClient, etc.)
const getUsersByRoleController = async (req, res) => {
  try {
    const role = req.params.role;
    const users = await getUsersByRole(role);
    res.json(users);
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get available users based on role
const getAvailableUsersController = async (req, res) => {
  try {
    const users = await getAvailableUsers(req.user.role);
    res.json(users);
  } catch (error) {
    console.error('Get available users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
const getUserByIdController = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new user
const createUserController = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      team,
      responsibleTester,
      projectManager,
      groupLeader,
      company,
      preferredLanguage
    } = req.body;

    // Check if user already exists
    let user = await findUserByEmail(email);
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userData = {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      team,
      company,
      preferredLanguage: preferredLanguage || 'en',
      createdBy: req.user.id
    };

    // Ajout des relations hiérarchiques selon le rôle
    if (role === 'tester' && responsibleTester) {
      userData.responsibleTester = responsibleTester;
    }

    if (role === 'groupLeader' && projectManager) {
      userData.projectManager = projectManager;
    }

    if (role === 'developer' && groupLeader) {
      userData.groupLeader = groupLeader;
    }

    user = await createUser(userData);

    res.status(201).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      team: user.team,
      company: user.company,
      preferredLanguage: user.preferredLanguage
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update user
const updateUserController = async (req, res) => {
  try {
    if (req.user.role === 'agentCommercial') {
      const userToUpdate = await getUserById(req.params.id);
      if (!userToUpdate) {
        return res.status(404).json({ message: 'User not found' });
      }

      // agentCommercial can only edit clients they created
      if (userToUpdate.role !== 'client' || userToUpdate.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You can only edit clients you created.' });
      }
    }

    const {
      firstName,
      lastName,
      email,
      role,
      phone,
      team,
      company,
      preferredLanguage,
      password,
      projectManager,
      groupLeader,
      responsibleTester
    } = req.body;

    if (req.user.role === 'agentCommercial' && role && role !== 'client') {
      return res.status(403).json({ message: 'Access denied. You can only manage client users.' });
    }

    const cleanCompany = company === 'No company' ? null : company;
    const cleanProjectManager = projectManager || null;
    const cleanGroupLeader = groupLeader || null;
    const cleanResponsibleTester = responsibleTester || null;

    const validateReference = (id, name) => {
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return `Invalid ${name} ID`;
      }
      return null;
    };

    const errors = [];
    const companyError = validateReference(cleanCompany, 'company');
    if (companyError) errors.push(companyError);
    const pmError = validateReference(cleanProjectManager, 'project manager');
    if (pmError) errors.push(pmError);
    const glError = validateReference(cleanGroupLeader, 'group leader');
    if (glError) errors.push(glError);
    const rtError = validateReference(cleanResponsibleTester, 'responsible tester');
    if (rtError) errors.push(rtError);

    if (errors.length > 0) {
      return res.status(400).json({ message: errors.join(', ') });
    }

    const userFields = {
      firstName,
      lastName,
      email,
      role,
      phone,
      team,
      company: cleanCompany,
      preferredLanguage,
      projectManager: cleanProjectManager,
      groupLeader: cleanGroupLeader,
      responsibleTester: cleanResponsibleTester
    };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      userFields.password = await bcrypt.hash(password, salt);
    }

    const result = await updateUser(req.params.id, userFields);

    if (result.error) {
      return res.status(result.statusCode || 500).json({ message: result.error });
    }

    return res.json(result);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete user
const deleteUserController = async (req, res) => {
  try {
    const user = await deleteUser(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User removed' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//change password
const changePasswordController = async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  // Authorization check
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ message: 'Access denied' });
  }

  const requireOldPassword = req.user.role !== 'admin';

  const result = await updateUserPassword(
    id,
    newPassword,
    requireOldPassword ? oldPassword : null
  );

  if (result.error) {
    if (result.error === 'User not found') {
      return res.status(404).json({ message: result.error });
    }
    if (result.error === 'Invalid current password') {
      return res.status(400).json({ message: result.error });
    }
    // أخطاء أخرى
    return res.status(500).json({ message: 'Server error' });
  }

  return res.json({ message: 'Password updated successfully' });
};


const getHierarchicalUsers = async (req, res) => {
  try {
    const hierarchicalUsers = await getHierarchicalUsersService();
    res.json(hierarchicalUsers);
  } catch (error) {
    console.error('Error in getHierarchicalUsers controller:', error);
    res.status(500).json({ message: error.message });
  }
};

const getLeadersWithDevelopers = async (req, res) => {
  try {
    const allLeadersWithDevelopers = await getLeadersWithDevelopersService();

    if (req.user.role === 'groupLeader') {
      const currentLeader = allLeadersWithDevelopers.find(
        leader => leader._id.toString() === req.user.id
      );

      if (currentLeader) {
        return res.json([currentLeader]);
      } else {
        return res.json([]);
      }
    }

    res.json(allLeadersWithDevelopers);
  } catch (error) {
    console.error('Error in getLeadersWithDevelopers controller:', error);
    res.status(500).json({ message: error.message });
  }
};

const getTestersController = async (req, res) => {
  try {
    const testers = await getTesters();
    res.json(testers);
  } catch (error) {
    console.error('Get testers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getClientsByCreatorController = async (req, res) => {
  try {
    const creatorId = req.params.creatorId || req.user.id;
    const clients = await getClientsByCreatorService(creatorId);
    res.json(clients);
  } catch (error) {
    console.error('Get clients by creator error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getResponsibleTestersController = async (req, res) => {
  try {
    const testers = await getUsersByRole('responsibleTester');
    res.json(testers);
  } catch (error) {
    console.error('Error getting responsible testers:', error);
    res.status(500).json({ message: error.message });
  }
};

const getTestersWithResponsibleController = async (req, res) => {
  try {
    const testersWithResponsible = await getTestersWithResponsibleService();

    if (req.user.role === 'responsibleTester') {
      const currentResponsible = testersWithResponsible.find(
        responsible => responsible._id.toString() === req.user.id
      );

      if (currentResponsible) {
        return res.json([currentResponsible]);
      } else {
        return res.json([]);
      }
    }

    res.json(testersWithResponsible);
  } catch (error) {
    console.error('Error in getTestersWithResponsible controller:', error);
    res.status(500).json({ message: error.message });
  }
};



export {
  getAllUsersController,
  getUsersByRoleController,
  getAvailableUsersController,
  getUserByIdController,
  createUserController,
  updateUserController,
  deleteUserController,
  changePasswordController,
  getClientsByCreatorController,
  getResponsibleTestersController,
  getHierarchicalUsers,
  getLeadersWithDevelopers,
  getTestersWithResponsibleController,
  getTestersController
};