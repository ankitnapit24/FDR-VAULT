import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env.js';

let s3Client: S3Client | null = null;

if (env.STORAGE_DRIVER === 's3' && env.S3_BUCKET && env.S3_ACCESS_KEY_ID && env.S3_SECRET_ACCESS_KEY) {
  s3Client = new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
  });
  console.log(`[Storage] Initialized S3 Cloud Object Storage client for bucket: ${env.S3_BUCKET}`);
} else {
  console.log('[Storage] Operating in Local Filesystem storage mode.');
}

export interface StoredFileResult {
  storageKey: string;
  storageDriver: 'local' | 's3';
  fileSize: number;
  contentType: string;
}

export async function uploadToStorage(
  filePath: string,
  storageKey: string,
  contentType: string
): Promise<StoredFileResult> {
  const fileStat = fs.statSync(filePath);

  if (s3Client && env.S3_BUCKET) {
    const fileStream = fs.createReadStream(filePath);
    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      Body: fileStream,
      ContentType: contentType,
      ContentLength: fileStat.size,
    });

    await s3Client.send(command);

    // Clean up temporary local upload file once synced to S3
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // Non-critical cleanup
    }

    return {
      storageKey,
      storageDriver: 's3',
      fileSize: fileStat.size,
      contentType,
    };
  }

  // Local storage mode: ensure destination folder exists
  const destDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const destPath = path.join(destDir, storageKey);
  if (filePath !== destPath) {
    fs.copyFileSync(filePath, destPath);
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      // Non-critical
    }
  }

  return {
    storageKey,
    storageDriver: 'local',
    fileSize: fileStat.size,
    contentType,
  };
}

export async function getDocumentDownloadUrlOrPath(storageKey: string): Promise<{
  type: 'local_path' | 'presigned_url';
  target: string;
}> {
  if (s3Client && env.S3_BUCKET) {
    const command = new GetObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
    });
    // Generate secure temporary presigned URL valid for 15 minutes
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });
    return {
      type: 'presigned_url',
      target: presignedUrl,
    };
  }

  const localPath = path.resolve(process.cwd(), env.UPLOAD_DIR, storageKey);
  return {
    type: 'local_path',
    target: localPath,
  };
}

export async function deleteFromStorage(storageKey: string): Promise<void> {
  if (s3Client && env.S3_BUCKET) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: storageKey,
        })
      );
    } catch (err) {
      console.error(`[Storage] Failed to delete S3 object ${storageKey}:`, err);
    }
    return;
  }

  const localPath = path.resolve(process.cwd(), env.UPLOAD_DIR, storageKey);
  if (fs.existsSync(localPath)) {
    try {
      fs.unlinkSync(localPath);
    } catch (err) {
      console.error(`[Storage] Failed to delete local file ${localPath}:`, err);
    }
  }
}
