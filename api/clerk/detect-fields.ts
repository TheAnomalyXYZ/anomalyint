import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RAILWAY_SERVICE_URL = process.env.RAILWAY_SERVICE_URL || 'https://anomalyint-production.up.railway.app';

  try {
    const { pdfUrl } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({ error: 'Missing pdfUrl parameter' });
    }

    // Proxy request to Railway Python service
    const response = await fetch(`${RAILWAY_SERVICE_URL}/detect-fields`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfUrl }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || 'Railway service error');
    }

    const data = await response.json();

    return res.status(200).json(data);
  } catch (error) {
    console.error('Detect fields error:', error);
    return res.status(500).json({
      error: 'Form field detection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
