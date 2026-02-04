import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RAILWAY_SERVICE_URL = process.env.RAILWAY_SERVICE_URL || 'https://anomalyint-production.up.railway.app';

  try {
    const { pdfUrl, fields } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({ error: 'Missing pdfUrl parameter' });
    }

    if (!fields || !Array.isArray(fields)) {
      return res.status(400).json({ error: 'Missing or invalid fields parameter' });
    }

    // Proxy request to Railway Python service
    console.log(`[annotate-pdf] Calling Railway service: ${RAILWAY_SERVICE_URL}/annotate-pdf`);
    console.log(`[annotate-pdf] PDF URL: ${pdfUrl}`);
    console.log(`[annotate-pdf] Fields count: ${fields.length}`);

    const response = await fetch(`${RAILWAY_SERVICE_URL}/annotate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ pdfUrl, fields }),
    });

    console.log(`[annotate-pdf] Railway response status: ${response.status}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[annotate-pdf] Railway error response: ${responseText}`);

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { detail: responseText || 'Unknown error' };
      }

      throw new Error(errorData.detail || errorData.message || 'Railway service error');
    }

    const data = await response.json();
    console.log(`[annotate-pdf] Success - annotated ${data.fieldsAnnotated} fields`);

    return res.status(200).json(data);
  } catch (error) {
    console.error('[annotate-pdf] Error:', error);
    return res.status(500).json({
      error: 'PDF annotation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}
