import { writeFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
  'video/x-msvideo',
  'video/quicktime',
  'image/jpeg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.mp4', '.avi', '.mov', '.jpg', '.jpeg', '.png'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export interface UploadResult {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export class UploadError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'UploadError';
  }
}

export function validateFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    const ext = extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new UploadError(
        'INVALID_FILE_TYPE',
        `Invalid file type "${file.type || ext}". Allowed: PDF, DOC, DOCX, MP4, AVI, MOV, JPG, PNG`
      );
    }
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError(
      'FILE_TOO_LARGE',
      `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
    );
  }

  if (file.size === 0) {
    throw new UploadError('EMPTY_FILE', 'Cannot upload an empty file');
  }
}

export async function uploadFile(file: File): Promise<UploadResult> {
  validateFile(file);

  const s3Endpoint = process.env.S3_ENDPOINT;
  if (s3Endpoint) {
    return uploadToS3(file);
  }

  return uploadToLocal(file);
}

async function uploadToLocal(file: File): Promise<UploadResult> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = extname(file.name).toLowerCase() || '.bin';
  const fileName = `${randomUUID()}${ext}`;
  const uploadDir = join(process.cwd(), 'public', 'uploads');
  const filePath = join(uploadDir, fileName);

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);

  return {
    url: `/uploads/${fileName}`,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}

async function uploadToS3(file: File): Promise<UploadResult> {
  let s3Client: any;
  let putCmd: any;
  try {
    // @ts-ignore - optional S3 dependency
    const mod: any = await import('@aws-sdk/client-s3');
    s3Client = mod.S3Client;
    putCmd = mod.PutObjectCommand;
  } catch {
    throw new UploadError('S3_NOT_CONFIGURED', 'S3 client is not installed. Add @aws-sdk/client-s3 or use local storage.');
  }

  const endpoint = process.env.S3_ENDPOINT!;
  const region = process.env.S3_REGION || 'auto';
  const bucket = process.env.S3_BUCKET || 'kaushiki-uploads';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID!;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY!;
  const publicUrlBase = process.env.S3_PUBLIC_URL || endpoint;

  const client = new s3Client({
    endpoint,
    region,
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true,
  });

  const ext = extname(file.name).toLowerCase() || '.bin';
  const key = `resources/${randomUUID()}${ext}`;

  const bytes = await file.arrayBuffer();

  await client.send(
    new putCmd({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(bytes),
      ContentType: file.type,
    })
  );

  return {
    url: `${publicUrlBase}/${bucket}/${key}`,
    fileName: file.name,
    mimeType: file.type,
    size: file.size,
  };
}
