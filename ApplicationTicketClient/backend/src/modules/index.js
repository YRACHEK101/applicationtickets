import { Router } from 'express';
import authRoutes from './auth/auth.routes.js';
import companyRoutes from './company/company.routes.js';
import taskRoutes from './task/task.routes.js';
import  userRoutes from './user/user.routes.js';
import ticketRoutes from './ticket/ticket.routes.js';
import testTasksRoutes from './testTask/testTasks.routes.js';
import notificationRoutes from './notification/notification.routes.js'
const router = Router();

router.get('/', (req, res) => {
  res.json({
    message: 'API v1',
    endpoints: {
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      statistics: '/api/v1/statistics'
    }
  });
});

router.use('/auth', authRoutes); 
router.use('/company', companyRoutes); 
router.use('/task', taskRoutes);
router.use('/notifications', notificationRoutes);
router.use('/user', userRoutes);
router.use('/ticket', ticketRoutes);
router.use('/testing', testTasksRoutes);


router.use((req, res) => {
    res.status(404).json({ message: "API V1 endpoint not found." });
});

export default router;