import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import formidable from 'formidable';
import { readFileSync } from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
};

function safeName(name: string | null | undefined): string {
  return (name || 'image').replace(/[^a-zA-Z0-9.-]/g, '_');
}

function safePrefix(prefix: string | null | undefined): string {
  if (!prefix) return 'uploads';
  return prefix
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9/_-]/g, '_')
    .slice(0, 200) || 'uploads';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } = process.env;
  if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    return res.status(500).json({ error: 'R2 credentials not configured' });
  }

  const S3 = new S3Client({
    region: 'auto',
    endpoint: R2_ENDPOINT,
    credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
  });

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => !!mimetype && ALLOWED_MIME.has(mimetype),
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req as any, (err, fields, files) => (err ? reject(err) : resolve([fields, files])));
    });

    const fileArr = files.file;
    if (!fileArr || (Array.isArray(fileArr) && fileArr.length === 0)) {
      return res.status(400).json({ error: 'No image uploaded under "file" field' });
    }
    const file = Array.isArray(fileArr) ? fileArr[0] : fileArr;

    const mimetype = file.mimetype || '';
    if (!ALLOWED_MIME.has(mimetype)) {
      return res.status(400).json({ error: `Unsupported mime type: ${mimetype}` });
    }

    const prefixRaw = fields.prefix;
    const prefix = safePrefix(Array.isArray(prefixRaw) ? prefixRaw[0] : prefixRaw);

    const ext = EXT_BY_MIME[mimetype] || 'bin';
    const timestamp = Date.now();
    const original = safeName(file.originalFilename).replace(/\.[a-z0-9]+$/i, '');
    const key = `${prefix}/${timestamp}-${original}.${ext}`;

    await S3.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: readFileSync(file.filepath),
      ContentType: mimetype,
      Metadata: {
        originalName: file.originalFilename || '',
        uploadedAt: new Date().toISOString(),
      },
    }));

    const publicUrl = R2_PUBLIC_URL ? `${R2_PUBLIC_URL.replace(/\/+$/, '')}/${key}` : undefined;

    return res.status(200).json({
      success: true,
      url: publicUrl,
      key,
      bucket: R2_BUCKET_NAME,
      contentType: mimetype,
      size: file.size,
      originalName: file.originalFilename,
    });
  } catch (err: any) {
    console.error('upload-image error:', err);
    if (err?.message?.includes('mimetype') || err?.message?.includes('options.filter')) {
      return res.status(400).json({ error: 'Invalid file type — images only (png, jpg, webp, gif, svg)' });
    }
    if (err?.code === 'LIMIT_FILE_SIZE' || err?.message?.includes('maxFileSize')) {
      return res.status(413).json({ error: 'File too large (max 10MB)' });
    }
    return res.status(500).json({ error: 'Upload failed', message: err?.message ?? 'Unknown error' });
  }
}
