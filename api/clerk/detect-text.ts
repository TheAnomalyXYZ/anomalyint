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
    console.log(`[detect-text] Calling Railway service: ${RAILWAY_SERVICE_URL}/detect-text`);
    console.log(`[detect-text] PDF URL: ${pdfUrl}`);

    const response = await fetch(`${RAILWAY_SERVICE_URL}/detect-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfUrl }),
    });

    console.log(`[detect-text] Railway response status: ${response.status}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[detect-text] Railway error response: ${responseText}`);

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { detail: responseText || 'Unknown error' };
      }

      throw new Error(errorData.detail || errorData.message || 'Railway service error');
    }

    const data = await response.json();
    console.log(`[detect-text] Success - detected ${data.textElementsDetected} text elements`);

    return res.status(200).json(data);
  } catch (error) {
    console.error('[detect-text] Error:', error);
    return res.status(500).json({
      error: 'Text detection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}
