import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({
    message: 'Environment variable test',
    env: {
      R2_ENDPOINT: process.env.R2_ENDPOINT ? 'Set' : 'Missing',
      R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID ? 'Set' : 'Missing',
      R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY ? 'Set' : 'Missing',
      R2_BUCKET_NAME: process.env.R2_BUCKET_NAME ? 'Set' : 'Missing',
      R2_PUBLIC_URL: process.env.R2_PUBLIC_URL ? 'Set' : 'Missing',
    },
    nodeVersion: process.version,
  });
}
