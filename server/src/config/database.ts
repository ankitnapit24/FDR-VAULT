import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';

let mongod: MongoMemoryServer | null = null;
let listenersRegistered = false;

function registerListeners(): void {
  if (listenersRegistered) return;
  listenersRegistered = true;

  mongoose.connection.on('disconnected', () => {
    console.warn('[DB Event] MongoDB connection lost.');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[DB Event] MongoDB reconnected successfully.');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[DB Event] MongoDB connection error:', err);
  });
}

export async function connectDB(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }

  registerListeners();

  try {
    mongoose.set('strictQuery', false);
    
    // Enterprise MongoDB connection parameters
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 50,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
    });

    console.log(`[DB] Connected to primary MongoDB at: ${env.MONGODB_URI.replace(/:([^:@]{3,})@/, ':****@')}`);
    return mongoose;
  } catch (err: any) {
    if (env.NODE_ENV === 'production') {
      console.error(`[DB Critical] Production MongoDB Atlas connection failed: ${err.message}.`);
      console.error('Verify your MONGODB_URI connection string and IP whitelist in MongoDB Atlas.');
      throw err;
    }

    console.warn(`[DB] Primary MongoDB connection failed (${err.message}). Starting embedded MongoDB Memory Server...`);
    
    try {
      if (!mongod) {
        mongod = await MongoMemoryServer.create();
      }
      const memoryUri = mongod.getUri();
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(memoryUri);
      }
      console.log(`[DB] Successfully connected to Embedded MongoDB Memory Server at: ${memoryUri}`);
      return mongoose;
    } catch (fallbackErr: any) {
      console.error('[DB] Failed to connect to fallback MongoMemoryServer:', fallbackErr);
      throw fallbackErr;
    }
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    if (mongod) {
      await mongod.stop();
    }
    console.log('[DB] Disconnected from database.');
  } catch (err) {
    console.error('[DB] Error during database disconnect:', err);
  }
}
