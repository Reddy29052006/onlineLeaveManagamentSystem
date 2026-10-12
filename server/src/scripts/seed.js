import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import User from '../models/User.js';
import InstitutionSettings from '../models/InstitutionSettings.js';
import { hashPassword } from '../utils/password.js';

const ADMIN = {
  name: process.env.ADMIN_NAME || 'System Administrator',
  email: (process.env.ADMIN_EMAIL || 'admin@institution.local').toLowerCase(),
  username: (process.env.ADMIN_USERNAME || 'admin').toLowerCase(),
  password: process.env.ADMIN_PASSWORD || 'Admin@12345',
};

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD || 'Demo@12345';

async function upsertUser({ name, email, username, password, role, ...profile }) {
  const normalizedEmail = email.toLowerCase();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    console.log(`  exists   ${role.padEnd(7)} ${normalizedEmail}`);
    return existing;
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({
    name,
    email: normalizedEmail,
    username: username.toLowerCase(),
    passwordHash,
    role,
    accountStatus: 'active',
    mustChangePassword: true,
    ...profile,
  });
  console.log(`  created  ${role.padEnd(7)} ${normalizedEmail}`);
  return user;
}

async function ensureSettings() {
  const settings = await InstitutionSettings.getSettings();
  console.log(`  settings ${settings.institutionName} (timezone=${settings.timezone})`);
  return settings;
}

async function main() {
  console.log(`[seed] environment: ${env.nodeEnv}`);
  await connectDatabase();

  if (env.nodeEnv === 'production' && !process.env.ADMIN_PASSWORD) {
    throw new Error(
      'Refusing to seed in production without ADMIN_PASSWORD. Set ADMIN_EMAIL and ADMIN_PASSWORD first.'
    );
  }

  console.log('[seed] institution settings');
  await ensureSettings();

  console.log('[seed] administrator account');
  const admin = await upsertUser({ ...ADMIN, role: 'admin' });
  console.log(`[seed] admin login -> email: ${admin.email}  username: ${admin.username}`);

  if (process.env.SEED_DEMO_DATA === 'true') {
    console.log('[seed] DEMO/TEST accounts (development only, marked with @demo.local)');
    await upsertUser({
      name: 'Demo Student One',
      email: 'student1@demo.local',
      username: 'student1',
      password: DEMO_PASSWORD,
      role: 'student',
      studentId: 'S1001',
      course: 'B.Tech CSE',
      year: '3',
      section: 'A',
      department: 'Computer Science',
    });
    await upsertUser({
      name: 'Demo Student Two',
      email: 'student2@demo.local',
      username: 'student2',
      password: DEMO_PASSWORD,
      role: 'student',
      studentId: 'S1002',
      course: 'B.Tech ECE',
      year: '2',
      section: 'B',
      department: 'Electronics',
    });
    await upsertUser({
      name: 'Demo Teacher One',
      email: 'teacher1@demo.local',
      username: 'teacher1',
      password: DEMO_PASSWORD,
      role: 'teacher',
      teacherId: 'T2001',
      designation: 'Associate Professor',
      department: 'Computer Science',
    });
    console.log(`[seed] DEMO password for all demo accounts: ${DEMO_PASSWORD}`);
  } else {
    console.log('[seed] demo data skipped (set SEED_DEMO_DATA=true to include test accounts)');
  }

  console.log('[seed] done');
}

main()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('[seed] failed:', error.message);
    await disconnectDatabase();
    process.exit(1);
  });
