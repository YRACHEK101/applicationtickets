// services/authService.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../../../server/models/User.model.js';

export const registerUser = async (data, currentUser) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      company,
      preferredLanguage = 'en',
      projectManager,
      groupLeader
    } = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) return { error: 'Cet email est déjà utilisé' };

    if (currentUser.role === 'agentCommercial' && role !== 'client') {
      return { error: 'Les agents commerciaux ne peuvent créer que des comptes clients' };
    }

    if (role === 'groupLeader' && !projectManager) {
      return { error: 'Un Group Leader doit être attaché à un Project Manager' };
    }

    if (role === 'developer' && !groupLeader) {
      return { error: 'Un développeur doit être attaché à un Group Leader' };
    }

    if (projectManager) {
      const pm = await User.findById(projectManager);
      if (!pm || pm.role !== 'projectManager') {
        return { error: 'L\'utilisateur sélectionné n\'est pas un Project Manager' };
      }
    }

    if (groupLeader) {
      const gl = await User.findById(groupLeader);
      if (!gl || gl.role !== 'groupLeader') {
        return { error: 'L\'utilisateur sélectionné n\'est pas un Group Leader' };
      }
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      password,
      role,
      phone,
      company,
      preferredLanguage,
      createdBy: currentUser.id,
      projectManager: role === 'groupLeader' ? projectManager : undefined,
      groupLeader: role === 'developer' ? groupLeader : undefined
    });

    await newUser.save();

    return {
      id: newUser.id,
      firstName,
      lastName,
      email,
      role
    };
  } catch (err) {
    console.error('Erreur interne lors de l\'enregistrement:', err);
    return { error: 'Une erreur inattendue est survenue.' };
  }
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user || user.isSuspended) throw new Error('Invalid credentials or suspended');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Invalid credentials');

  const payload = { id: user.id, role: user.role };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

  return {
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage
    }
  };
};

export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select('-password').populate('company', 'name');
  if (!user) throw new Error('User not found');

  const unreadCount = user.notifications?.filter(n => !n.isRead).length || 0;
  return { ...user.toObject(), unreadNotificationsCount: unreadCount };
};

export const updatePreferences = async (userId, preferredLanguage) => {
  const validLanguages = ['en', 'fr', 'de', 'es', 'ar'];
  if (preferredLanguage && !validLanguages.includes(preferredLanguage)) {
    throw new Error('Invalid language selection');
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { preferredLanguage },
    { new: true }
  ).select('-password');

  return updatedUser;
};

export const suspendUser = async (adminId, targetId, isSuspended) => {
  if (adminId === targetId) throw new Error('You cannot suspend your own account');

  const user = await User.findByIdAndUpdate(
    targetId,
    { isSuspended },
    { new: true }
  ).select('-password');

  if (!user) throw new Error('User not found');

  return {
    message: isSuspended ? 'User account suspended' : 'User account activated',
    user
  };
};

export const getNotifications = async (userId) => {
  const user = await User.findById(userId)
    .select('notifications')
    .populate({ path: 'notifications.relatedTo', select: 'number title name' });

  if (!user) throw new Error('User not found');
  return user.notifications;
};

export const markNotificationAsRead = async (userId, notificationId) => {
  const user = await User.findOneAndUpdate(
    { _id: userId, 'notifications._id': notificationId },
    { $set: { 'notifications.$.isRead': true } },
    { new: true }
  ).select('notifications');

  if (!user) throw new Error('Notification not found');
  return user.notifications;
};
