import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RAILWAY_SERVICE_URL = process.env.RAILWAY_SERVICE_URL || 'https://anomalyint-production.up.railway.app';

  try {
    const { pdfUrl, suggestedFills, drawingElements } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({ error: 'Missing pdfUrl parameter' });
    }

    if (!suggestedFills && !drawingElements) {
      return res.status(400).json({ error: 'At least one of suggestedFills or drawingElements is required' });
    }

    // Proxy request to Railway Python service
    console.log(`[generate-filled-pdf] Calling Railway service: ${RAILWAY_SERVICE_URL}/generate-filled-pdf`);
    console.log(`[generate-filled-pdf] PDF URL: ${pdfUrl}`);
    console.log(`[generate-filled-pdf] Suggested fills count: ${suggestedFills?.length || 0}`);
    console.log(`[generate-filled-pdf] Drawing elements count: ${drawingElements?.length || 0}`);

    const response = await fetch(`${RAILWAY_SERVICE_URL}/generate-filled-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfUrl,
        suggestedFills: suggestedFills || [],
        drawingElements: drawingElements || [],
      }),
    });

    console.log(`[generate-filled-pdf] Railway response status: ${response.status}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[generate-filled-pdf] Railway error response: ${responseText}`);

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { detail: responseText || 'Unknown error' };
      }

      throw new Error(errorData.detail || errorData.message || 'Railway service error');
    }

    const data = await response.json();
    console.log(`[generate-filled-pdf] Success - generated filled PDF`);

    return res.status(200).json(data);
  } catch (error) {
    console.error('[generate-filled-pdf] Error:', error);
    return res.status(500).json({
      error: 'PDF generation failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
    });
  }
}
