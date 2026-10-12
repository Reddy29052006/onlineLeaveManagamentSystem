import { Router } from 'express';
import {
  createLeave,
  getLeave,
  getLeaveLetter,
  listLeaves,
  approveLeave,
  rejectLeave,
  listMyLeaves,
  myLeaveSummary,
  downloadLeavePdf,
} from '../controllers/leaves.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorizeRole.js';

const router = Router();

const adminOnly = [authenticate, authorizeRole('admin')];

// Applicant submission
router.post('/', authenticate, authorizeRole('student', 'teacher'), createLeave);

// Admin review
router.get('/', ...adminOnly, listLeaves);
router.post('/:id/approve', ...adminOnly, approveLeave);
router.post('/:id/reject', ...adminOnly, rejectLeave);

// Applicant's own applications (static paths must precede /:id)
router.get('/mine', authenticate, authorizeRole('student', 'teacher'), listMyLeaves);
router.get(
  '/mine/summary',
  authenticate,
  authorizeRole('student', 'teacher'),
  myLeaveSummary
);

// Owner or admin reads
router.get('/:id', authenticate, getLeave);
router.get('/:id/letter', authenticate, getLeaveLetter);
router.get('/:id/pdf', authenticate, downloadLeavePdf);

export default router;
