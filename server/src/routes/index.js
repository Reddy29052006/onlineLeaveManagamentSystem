import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import usersRoutes from './users.routes.js';
import leavesRoutes from './leaves.routes.js';
import calendarRoutes from './calendar.routes.js';
import notificationsRoutes from './notifications.routes.js';
import dashboardRoutes from './dashboard.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/leaves', leavesRoutes);
router.use('/calendar', calendarRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
