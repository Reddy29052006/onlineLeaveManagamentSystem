import {
  getApplicantDashboard,
  getAdminDashboard,
} from '../services/dashboard.service.js';

export async function getMine(req, res, next) {
  try {
    const data = await getApplicantDashboard({ user: req.user });
    res.json({ success: true, data, message: 'OK' });
  } catch (error) {
    next(error);
  }
}

export async function getAdmin(req, res, next) {
  try {
    const data = await getAdminDashboard();
    res.json({ success: true, data, message: 'OK' });
  } catch (error) {
    next(error);
  }
}
