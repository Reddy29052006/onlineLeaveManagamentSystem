import mongoose from 'mongoose';
import { env } from './env.js';

const DB_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export function getDatabaseStatus() {
  return DB_STATES[mongoose.connection.readyState] || 'unknown';
}

export async function connectDatabase() {
  mongoose.connection.on('error', (error) => {
    console.error('[database] connection error:', error.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[database] disconnected');
  });

  await mongoose.connect(env.mongodbUri, {
    dbName: env.mongodbDbName,
    serverSelectionTimeoutMS: 10000,
  });

  console.log(`[database] connected to "${mongoose.connection.name}"`);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
