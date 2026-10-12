import InstitutionSettings from '../models/InstitutionSettings.js';
import { recordAudit } from './audit.service.js';
import { AppError } from '../utils/AppError.js';
import { isValidDateOnly, compareDateOnly } from '../utils/dateOnly.js';

export async function getSettings() {
  const settings = await InstitutionSettings.getSettings();
  return settings.toJSON();
}

export async function updateSettings({ actor, data = {} }) {
  const settings = await InstitutionSettings.getSettings();
  const errors = [];

  if (data.institutionName !== undefined) {
    const val = String(data.institutionName).trim();
    if (!val) {
      errors.push({ field: 'institutionName', message: 'Institution name is required' });
    } else if (val.length > 200) {
      errors.push({ field: 'institutionName', message: 'Institution name must not exceed 200 characters' });
    } else {
      settings.institutionName = val;
    }
  }

  if (data.timezone !== undefined) {
    const tz = String(data.timezone).trim();
    if (!tz) {
      errors.push({ field: 'timezone', message: 'Timezone is required' });
    } else {
      settings.timezone = tz;
    }
  }

  if (data.applicationIdPrefix !== undefined) {
    const prefix = String(data.applicationIdPrefix).trim().toUpperCase();
    if (!prefix || prefix.length < 1 || prefix.length > 10) {
      errors.push({ field: 'applicationIdPrefix', message: 'Prefix must be between 1 and 10 characters' });
    } else if (!/^[A-Z0-9]+$/.test(prefix)) {
      errors.push({ field: 'applicationIdPrefix', message: 'Prefix must contain only uppercase letters and digits' });
    } else {
      settings.applicationIdPrefix = prefix;
    }
  }

  if (data.contactEmail !== undefined) {
    const email = String(data.contactEmail).trim().toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ field: 'contactEmail', message: 'Please enter a valid contact email address' });
    } else {
      settings.contactEmail = email;
    }
  }

  if (data.contactPhone !== undefined) {
    settings.contactPhone = String(data.contactPhone).trim();
  }

  if (data.address !== undefined) {
    settings.address = String(data.address).trim().slice(0, 300);
  }

  // Academic year dates
  if (data.academicYear !== undefined) {
    const { startDate, endDate } = data.academicYear || {};
    const cleanStart = startDate ? String(startDate).trim() : null;
    const cleanEnd = endDate ? String(endDate).trim() : null;

    if (cleanStart && !isValidDateOnly(cleanStart)) {
      errors.push({ field: 'academicYear.startDate', message: 'Enter a valid start date (YYYY-MM-DD)' });
    }
    if (cleanEnd && !isValidDateOnly(cleanEnd)) {
      errors.push({ field: 'academicYear.endDate', message: 'Enter a valid end date (YYYY-MM-DD)' });
    }
    if (cleanStart && cleanEnd && isValidDateOnly(cleanStart) && isValidDateOnly(cleanEnd) && compareDateOnly(cleanEnd, cleanStart) < 0) {
      errors.push({ field: 'academicYear.endDate', message: 'End date cannot be before start date' });
    }

    if (errors.length === 0) {
      settings.academicYear = {
        startDate: cleanStart,
        endDate: cleanEnd,
      };
    }
  }

  if (errors.length > 0) {
    throw new AppError('Validation failed', 400, 'VALIDATION_ERROR', errors);
  }

  settings.updatedBy = actor._id;
  await settings.save();

  await recordAudit({
    actor,
    action: 'settings_updated',
    targetType: 'institution_settings',
    targetId: settings._id,
    summary: 'Updated institution settings and academic year parameters',
  });

  return settings.toJSON();
}
