import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

export function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword, passwordHash) {
  if (!plainPassword || !passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plainPassword, passwordHash);
}
