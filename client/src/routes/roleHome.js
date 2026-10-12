export const ROLE_HOME = {
  admin: '/admin',
  student: '/student',
  teacher: '/teacher',
};

export const ROLE_LABELS = {
  admin: 'Administrator',
  student: 'Student',
  teacher: 'Teacher',
};

export function homePathForRole(role) {
  return ROLE_HOME[role] || '/login';
}
