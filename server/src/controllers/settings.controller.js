import { getSettings, updateSettings } from '../services/settings.service.js';

export async function fetchSettings(req, res, next) {
  try {
    const settings = await getSettings();
    res.json({ success: true, data: { settings }, message: 'OK' });
  } catch (error) {
    next(error);
  }
}

export async function modifySettings(req, res, next) {
  try {
    const settings = await updateSettings({
      actor: req.user,
      data: req.body || {},
    });
    res.json({
      success: true,
      data: { settings },
      message: 'Institution settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
