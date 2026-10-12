import { Router } from 'express';
import { getMine, getAdmin } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = Router();

router.get('/mine', authenticate, authorizeRole('student', 'teacher'), getMine);
router.get('/admin', authenticate, authorizeRole('admin'), getAdmin);

export default router;
