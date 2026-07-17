import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Single source of truth for object storage. Supports both Railway Buckets and
 * MinIO (local dev):
 *   Railway injects AWS_ENDPOINT_URL / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 *                   / AWS_DEFAULT_REGION / BUCKET
 *   MinIO uses      MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY / MINIO_BUCKET
 */
const isRailway = !!process.env.AWS_ENDPOINT_URL

export const s3Client = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL || process.env.MINIO_ENDPOINT,
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.MINIO_ACCESS_KEY || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.MINIO_SECRET_KEY || '',
  },
  forcePathStyle: !isRailway, // Railway uses virtual-hosted style, MinIO uses path style
})

export const BUCKET = process.env.BUCKET || process.env.MINIO_BUCKET || 'videos'

/** Mint a short-lived read URL for a stored object. */
export function presignReadUrl(key: string, expiresIn: number): Promise<string> {
  return getSignedUrl(s3Client, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn })
}
