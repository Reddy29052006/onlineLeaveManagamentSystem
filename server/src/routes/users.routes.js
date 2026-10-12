import { Router } from 'express';
import {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  setStudentStatus,
  createTeacher,
  listTeachers,
  getTeacher,
  updateTeacher,
  setTeacherStatus,
  leaveSummary,
} from '../controllers/users.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRole } from '../middleware/authorizeRole.js';
import { authorizeSelfOrAdmin } from '../middleware/authorizeSelfOrAdmin.js';

const router = Router();

const adminOnly = [authenticate, authorizeRole('admin')];

// Student management
router.post('/students', ...adminOnly, createStudent);
router.get('/students', ...adminOnly, listStudents);
router.get('/students/:id', authenticate, authorizeSelfOrAdmin('id'), getStudent);
router.patch('/students/:id', ...adminOnly, updateStudent);
router.patch('/students/:id/status', ...adminOnly, setStudentStatus);

// Teacher management
router.post('/teachers', ...adminOnly, createTeacher);
router.get('/teachers', ...adminOnly, listTeachers);
router.get('/teachers/:id', authenticate, authorizeSelfOrAdmin('id'), getTeacher);
router.patch('/teachers/:id', ...adminOnly, updateTeacher);
router.patch('/teachers/:id/status', ...adminOnly, setTeacherStatus);

// Leave summary (admin, or the user themselves)
router.get('/:id/leave-summary', authenticate, authorizeSelfOrAdmin('id'), leaveSummary);

export default router;
