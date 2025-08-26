// controllers/authController.js
import * as authService from '../services/auth.service.js';
import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

// Add this new controller function
export const register = async (req, res) => {
  const result = await authService.registerUser(req.body, req.user);

  if (result.error) {
    return res.status(400).json({ message: result.error });
  }

  res.status(201).json(result);
};


const validateReference = (id, name) => {
  if (id && !mongoose.Types.ObjectId.isValid(id)) {
    return { error: `ID invalide pour ${name}` };
  }
  return { value: id };
};

// ✅ Fonction principale
export const registerUser = async (userData, currentUser) => {
  try {
    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      return { error: 'Cet email est déjà utilisé' };
    }

    // Nettoyage des valeurs
    const cleanCompany = userData.company === 'No company' ? null : userData.company;
    const cleanProjectManager = userData.projectManager || null;
    const cleanGroupLeader = userData.groupLeader || null;
    const cleanResponsibleTester = userData.responsibleTester || null;

    // ✅ Validation des IDs
    let result;

    result = validateReference(cleanCompany, 'company');
    if (result.error) return { error: result.error };

    result = validateReference(cleanProjectManager, 'projectManager');
    if (result.error) return { error: result.error };

    result = validateReference(cleanGroupLeader, 'groupLeader');
    if (result.error) return { error: result.error };

    result = validateReference(cleanResponsibleTester, 'responsibleTester');
    if (result.error) return { error: result.error };

    // Vérifier les autorisations
    if (currentUser && currentUser.role === 'agentCommercial' && userData.role !== 'client') {
      return { error: 'Les agents commerciaux ne peuvent créer que des clients' };
    }

    // Vérifier les relations hiérarchiques
    if (userData.role === 'groupLeader' && !cleanProjectManager) {
      return { error: 'Un chef de groupe doit être rattaché à un chef de projet' };
    }
    if (userData.role === 'developer' && !cleanGroupLeader) {
      return { error: 'Un développeur doit être rattaché à un chef de groupe' };
    }
    if (userData.role === 'tester' && !cleanResponsibleTester) {
      return { error: 'Un testeur doit être rattaché à un responsable testeur' };
    }

    // Vérifier les rôles des références
    if (cleanProjectManager) {
      const pm = await User.findById(cleanProjectManager);
      if (!pm || pm.role !== 'projectManager') {
        return { error: 'L\'utilisateur sélectionné n\'est pas un chef de projet' };
      }
    }

    if (cleanGroupLeader) {
      const gl = await User.findById(cleanGroupLeader);
      if (!gl || gl.role !== 'groupLeader') {
        return { error: 'L\'utilisateur sélectionné n\'est pas un chef de groupe' };
      }
    }

    if (cleanResponsibleTester) {
      const rt = await User.findById(cleanResponsibleTester);
      if (!rt || rt.role !== 'responsibleTester') {
        return { error: 'L\'utilisateur sélectionné n\'est pas un responsable testeur' };
      }
    }

    // Création de l'utilisateur
    const newUser = new User({
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      phone: userData.phone,
      company: cleanCompany,
      preferredLanguage: userData.preferredLanguage || 'en',
      projectManager: userData.role === 'groupLeader' ? cleanProjectManager : undefined,
      groupLeader: userData.role === 'developer' ? cleanGroupLeader : undefined,
      responsibleTester: userData.role === 'tester' ? cleanResponsibleTester : undefined,
      createdBy: currentUser ? currentUser.id : undefined
    });

    await newUser.save();

    // Supprimer le mot de passe
    const userObject = newUser.toObject();
    delete userObject.password;

    return userObject;

  } catch (err) {
    console.error("Erreur interne:", err);
    return { error: 'Une erreur inattendue est survenue.' };
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const updateUserPreferences = async (req, res) => {
  try {
    const user = await authService.updatePreferences(req.user.id, req.body.preferredLanguage);
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const suspendAccount = async (req, res) => {
  try {
    const { isSuspended } = req.body;
    const result = await authService.suspendUser(req.user.id, req.params.id, isSuspended);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const notifications = await authService.getNotifications(req.user.id);
    res.json(notifications);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const notifications = await authService.markNotificationAsRead(req.user.id, req.params.id);
    res.json(notifications);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
