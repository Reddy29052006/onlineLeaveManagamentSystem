import {
  createAccount,
  listAccounts,
  getAccount,
  updateAccount,
  setAccountStatus,
  getLeaveSummary,
} from '../services/user.service.js';

function makeCreate(role) {
  return async function create(req, res, next) {
    try {
      const { user, temporaryPassword } = await createAccount({
        role,
        data: req.body || {},
        actor: req.user,
      });
      res.status(201).json({
        success: true,
        data: { user, temporaryPassword },
        message: `${role === 'student' ? 'Student' : 'Teacher'} account created`,
      });
    } catch (error) {
      next(error);
    }
  };
}

function makeList(role) {
  return async function list(req, res, next) {
    try {
      const { items, pagination } = await listAccounts({ role, query: req.query });
      res.json({
        success: true,
        data: { items, pagination },
        message: 'OK',
      });
    } catch (error) {
      next(error);
    }
  };
}

function makeGet(role) {
  return async function getOne(req, res, next) {
    try {
      const user = await getAccount({ role, id: req.params.id });
      res.json({ success: true, data: { user }, message: 'OK' });
    } catch (error) {
      next(error);
    }
  };
}

function makeUpdate(role) {
  return async function update(req, res, next) {
    try {
      const user = await updateAccount({
        role,
        id: req.params.id,
        data: req.body || {},
        actor: req.user,
      });
      res.json({ success: true, data: { user }, message: 'Account updated' });
    } catch (error) {
      next(error);
    }
  };
}

function makeSetStatus(role) {
  return async function setStatus(req, res, next) {
    try {
      const user = await setAccountStatus({
        role,
        id: req.params.id,
        accountStatus: (req.body || {}).accountStatus,
        actor: req.user,
      });
      res.json({ success: true, data: { user }, message: 'Account status updated' });
    } catch (error) {
      next(error);
    }
  };
}

export const createStudent = makeCreate('student');
export const listStudents = makeList('student');
export const getStudent = makeGet('student');
export const updateStudent = makeUpdate('student');
export const setStudentStatus = makeSetStatus('student');

export const createTeacher = makeCreate('teacher');
export const listTeachers = makeList('teacher');
export const getTeacher = makeGet('teacher');
export const updateTeacher = makeUpdate('teacher');
export const setTeacherStatus = makeSetStatus('teacher');

export async function leaveSummary(req, res, next) {
  try {
    const data = await getLeaveSummary({ id: req.params.id });
    res.json({ success: true, data, message: 'OK' });
  } catch (error) {
    next(error);
  }
}
