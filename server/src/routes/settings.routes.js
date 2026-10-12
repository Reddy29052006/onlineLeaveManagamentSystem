import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { fetchSettings, modifySettings } from '../controllers/settings.controller.js';

const router = Router();

// Any authenticated user can read public institution settings (name, timezone, academic year, contacts)
router.get('/', authenticate, fetchSettings);

// Only admin can modify institution settings
router.patch('/', authenticate, authorizeRole('admin'), modifySettings);

export default router;
