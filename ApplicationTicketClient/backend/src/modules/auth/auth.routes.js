// routes/auth.js
import express from 'express';
import { auth, authorize } from '../../../server/middleware/auth.middleware.js';
import { registerUser, login, getMe, updateUserPreferences, suspendAccount, getUserNotifications, markAsRead } from '../../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', auth, async (req, res) => {
  try {
    const result = await registerUser(req.body, req.user);

    if (result.error) {
      return res.status(400).json({ message: result.error });
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("Erreur route /register:", error);
    return res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/preferences', auth, updateUserPreferences);
router.put('/suspend/:id', auth, authorize(['admin']), suspendAccount);
router.get('/notifications', auth, getUserNotifications);
router.put('/notifications/:id', auth, markAsRead);

export default router;
