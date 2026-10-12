import mongoose from 'mongoose';
import { DATE_ONLY_PATTERN, isValidDateOnly, compareDateOnly } from '../utils/dateOnly.js';

const { Schema } = mongoose;

export const SETTINGS_KEY = 'institution';

const institutionSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
    institutionName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
      default: 'Online Leave Management Institution',
    },
    timezone: { type: String, required: true, trim: true, default: 'Asia/Kolkata' },

    leavePolicy: {
      // Confirmed policy: weekends and holidays COUNT toward leave days.
      weekendCountsTowardLeave: { type: Boolean, default: true },
      holidayCountsTowardLeave: { type: Boolean, default: true },
      allowLeaveOnHolidays: { type: Boolean, default: true },
    },

    applicationIdPrefix: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      minlength: 1,
      maxlength: 10,
      default: 'LV',
    },

    academicYear: {
      startDate: { type: String, default: null, match: DATE_ONLY_PATTERN },
      endDate: { type: String, default: null, match: DATE_ONLY_PATTERN },
    },

    contactEmail: { type: String, trim: true, lowercase: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, maxlength: 300, default: '' },

    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform(doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

institutionSettingsSchema.pre('validate', function validateAcademicYear(next) {
  const { startDate, endDate } = this.academicYear || {};
  if (startDate && !isValidDateOnly(startDate)) {
    this.invalidate('academicYear.startDate', 'academic year start must be YYYY-MM-DD');
  }
  if (endDate && !isValidDateOnly(endDate)) {
    this.invalidate('academicYear.endDate', 'academic year end must be YYYY-MM-DD');
  }
  if (startDate && endDate && compareDateOnly(endDate, startDate) < 0) {
    this.invalidate('academicYear.endDate', 'academic year end must be on or after start');
  }
  next();
});

/**
 * Return the singleton settings document, creating it with safe defaults if
 * it does not exist yet.
 */
institutionSettingsSchema.statics.getSettings = async function getSettings() {
  const existing = await this.findOne({ key: SETTINGS_KEY });
  if (existing) return existing;
  return this.create({ key: SETTINGS_KEY });
};

export default mongoose.model('InstitutionSettings', institutionSettingsSchema);
