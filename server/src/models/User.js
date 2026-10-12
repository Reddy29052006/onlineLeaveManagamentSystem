import mongoose from 'mongoose';

const { Schema } = mongoose;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ROLES = ['admin', 'student', 'teacher'];
export const ACCOUNT_STATUSES = ['active', 'inactive'];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Invalid email address'],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 60,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ROLES },
    accountStatus: {
      type: String,
      enum: ACCOUNT_STATUSES,
      default: 'active',
    },
    department: { type: String, trim: true, maxlength: 120 },

    // Student-specific
    studentId: { type: String, trim: true, uppercase: true },
    course: { type: String, trim: true, maxlength: 120 },
    year: { type: String, trim: true, maxlength: 40 },
    section: { type: String, trim: true, maxlength: 40 },

    // Teacher-specific
    teacherId: { type: String, trim: true, uppercase: true },
    designation: { type: String, trim: true, maxlength: 120 },

    phone: { type: String, trim: true, maxlength: 30 },
    mustChangePassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      transform(doc, ret) {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ role: 1, accountStatus: 1 });
userSchema.index({ studentId: 1 }, { unique: true, sparse: true });
userSchema.index({ teacherId: 1 }, { unique: true, sparse: true });

userSchema.pre('validate', function validateRoleFields(next) {
  if (this.role === 'student') {
    if (!this.studentId) {
      this.invalidate('studentId', 'studentId is required for student accounts');
    }
    if (!this.department && !this.course) {
      this.invalidate(
        'department',
        'department or course is required for student accounts'
      );
    }
  }

  if (this.role === 'teacher') {
    if (!this.teacherId) {
      this.invalidate('teacherId', 'teacherId is required for teacher accounts');
    }
    if (!this.designation) {
      this.invalidate('designation', 'designation is required for teacher accounts');
    }
    if (!this.department) {
      this.invalidate('department', 'department is required for teacher accounts');
    }
  }

  next();
});

export function getPublicUser(user) {
  if (!user) return null;
  const object = user.toObject ? user.toObject() : { ...user };
  delete object.passwordHash;
  delete object.__v;
  return object;
}

export default mongoose.model('User', userSchema);
