import type { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import formidable from 'formidable';
import { readFileSync } from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable default body parser to handle multipart/form-data
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configure S3 client for Cloudflare R2 (inside handler to use runtime env vars)
  const S3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check environment variables
  if (!process.env.R2_ENDPOINT || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY || !process.env.R2_BUCKET_NAME) {
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'Cloudflare R2 credentials not configured'
    });
  }

  try {
    // Parse the multipart form data
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB max
      filter: function ({ mimetype }) {
        // Only allow PDF files
        return mimetype === 'application/pdf';
      }
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req as any, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    const fileArray = files.file;
    if (!fileArray || fileArray.length === 0) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a PDF file'
      });
    }

    const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;
    const fileIdArray = fields.fileId;
    const fileId = Array.isArray(fileIdArray) ? fileIdArray[0] : fileIdArray || crypto.randomUUID();

    // Read file content
    const fileContent = readFileSync(file.filepath);

    // Generate a unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.originalFilename?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'document.pdf';
    const key = `clerk/${fileId}/${timestamp}-${sanitizedFileName}`;

    // Upload to R2
    await S3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: fileContent,
      ContentType: 'application/pdf',
      Metadata: {
        originalName: file.originalFilename || 'document.pdf',
        uploadedAt: new Date().toISOString(),
      },
    }));

    // Construct public URL (if bucket is public) or generate signed URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      url: publicUrl,
      key: key,
      fileId: fileId,
      fileName: file.originalFilename,
      fileSize: file.size,
    });

  } catch (error: any) {
    console.error('Upload error:', error);

    if (error.message?.includes('mimetype')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF files are allowed'
      });
    }

    return res.status(500).json({
      error: 'Upload failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
