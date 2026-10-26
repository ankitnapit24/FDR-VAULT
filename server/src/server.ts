import { app } from './app.js';
import { connectDB, disconnectDB } from './config/database.js';
import { env } from './config/env.js';
import { initializeCronJobs } from './services/cronJobs.js';
import { User } from './models/User.js';
import { seedDatabase } from './utils/seedData.js';

async function bootstrap() {
  try {
    await connectDB();

    // Auto-seed if database is freshly initialized and auto-seed is enabled
    const count = await User.countDocuments();
    if (count === 0 && env.AUTO_SEED) {
      console.log('[Bootstrap] No existing user records found and AUTO_SEED is enabled. Seeding initial demonstration data...');
      await seedDatabase();
    } else if (count === 0) {
      console.log('[Bootstrap] Database is empty. Use "npm run seed" or set AUTO_SEED=true to seed initial accounts.');
    }

    initializeCronJobs();

    const server = app.listen(env.PORT, () => {
      console.log(`=======================================================`);
      console.log(` FDRFlow — AICTE Security Deposit & FDR Management Portal`);
      console.log(` Server running on http://localhost:${env.PORT}`);
      console.log(` Environment: ${env.NODE_ENV}`);
      console.log(` Storage Driver: ${env.STORAGE_DRIVER}`);
      console.log(` Problem Statement ID: 26265`);
      console.log(`=======================================================`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`[Server] ${signal} signal received. Closing HTTP server & database pool...`);
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });

      // Force close after 10s timeout
      setTimeout(() => {
        console.error('[Server] Forced shutdown due to timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
