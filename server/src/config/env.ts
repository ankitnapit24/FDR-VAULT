import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/fdrflow',
  JWT_SECRET: process.env.JWT_SECRET || 'fdrflow_secure_jwt_secret_aicte_key_2026_replace_in_prod',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  REMINDER_DAYS_BEFORE: (process.env.REMINDER_DAYS_BEFORE || '30,15,7')
    .split(',')
    .map((d: string) => parseInt(d.trim(), 10))
    .filter((n: number) => !isNaN(n)),
  OVERDUE_DAYS_THRESHOLD: parseInt(process.env.OVERDUE_DAYS_THRESHOLD || '14', 10),
  CRON_SCHEDULE: process.env.CRON_SCHEDULE || '0 8 * * *',
  AUTO_SEED: process.env.AUTO_SEED === 'true' || (process.env.NODE_ENV !== 'production' && process.env.AUTO_SEED !== 'false'),
  
  // Cloud Object Storage (S3 / Cloudflare R2 / MinIO)
  STORAGE_DRIVER: (process.env.STORAGE_DRIVER || 'local') as 'local' | 's3',
  S3_ENDPOINT: process.env.S3_ENDPOINT || '',
  S3_REGION: process.env.S3_REGION || 'ap-south-1',
  S3_BUCKET: process.env.S3_BUCKET || '',
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
  S3_FORCE_PATH_STYLE: process.env.S3_FORCE_PATH_STYLE === 'true',
};
