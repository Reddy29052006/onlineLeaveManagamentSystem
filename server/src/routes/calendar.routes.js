import { Router } from 'express';
import {
  checkRange,
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/calendar.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = Router();
const adminOnly = [authenticate, authorizeRole('admin')];

// Authenticated queries
router.get('/events', authenticate, getEvents);
router.get('/events/:id', authenticate, getEvent);
router.post('/check-range', authenticate, checkRange);

// Admin-only event management
router.post('/events', ...adminOnly, createEvent);
router.patch('/events/:id', ...adminOnly, updateEvent);
router.delete('/events/:id', ...adminOnly, deleteEvent);

export default router;
