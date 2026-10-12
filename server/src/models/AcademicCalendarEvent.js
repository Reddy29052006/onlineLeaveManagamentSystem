import mongoose from 'mongoose';
import { DATE_ONLY_PATTERN, isValidDateOnly, compareDateOnly } from '../utils/dateOnly.js';

const { Schema } = mongoose;

export const CALENDAR_EVENT_TYPES = [
  'public_holiday',
  'institution_holiday',
  'weekend_override',
  'academic_event',
];

const academicCalendarEventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    startDate: { type: String, required: true, match: DATE_ONLY_PATTERN },
    endDate: { type: String, required: true, match: DATE_ONLY_PATTERN },
    type: { type: String, required: true, enum: CALENDAR_EVENT_TYPES },
    description: { type: String, trim: true, maxlength: 500, default: '' },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
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

academicCalendarEventSchema.index({ startDate: 1, endDate: 1 });
academicCalendarEventSchema.index({ type: 1 });
academicCalendarEventSchema.index({ isActive: 1 });

academicCalendarEventSchema.pre('validate', function validateEventRange(next) {
  if (!isValidDateOnly(this.startDate)) {
    this.invalidate('startDate', 'startDate must be a valid YYYY-MM-DD date');
  }
  if (!isValidDateOnly(this.endDate)) {
    this.invalidate('endDate', 'endDate must be a valid YYYY-MM-DD date');
  }
  if (
    isValidDateOnly(this.startDate) &&
    isValidDateOnly(this.endDate) &&
    compareDateOnly(this.endDate, this.startDate) < 0
  ) {
    this.invalidate('endDate', 'endDate must be on or after startDate');
  }
  next();
});

export default mongoose.model('AcademicCalendarEvent', academicCalendarEventSchema);
