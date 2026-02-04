import express from 'express';
import formidable from 'formidable';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = 3002;

// Configure S3 client for Cloudflare R2
const S3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

app.post('/api/clerk/upload', async (req, res) => {
  // Enable CORS for local development
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
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

    // Construct public URL
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

  } catch (error) {
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
});

// Handle OPTIONS for CORS preflight
app.options('/api/clerk/upload', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Dev API server running on http://localhost:${PORT}`);
  console.log('Handling /api/clerk/upload for local development');
});
