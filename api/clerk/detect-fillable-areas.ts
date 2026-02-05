import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const RAILWAY_SERVICE_URL = process.env.RAILWAY_SERVICE_URL || 'https://anomalyint-production.up.railway.app';

  try {
    const {
      pdfUrl,
      cannyLow,
      cannyHigh,
      houghThreshold,
      minLineLength,
      maxLineGap,
      minWidth
    } = req.body;

    if (!pdfUrl) {
      return res.status(400).json({ error: 'Missing pdfUrl parameter' });
    }

    // Proxy request to Railway Python service with optional detection parameters
    console.log(`[detect-fillable-areas] Calling Railway service: ${RAILWAY_SERVICE_URL}/detect-fillable-areas`);
    console.log(`[detect-fillable-areas] PDF URL: ${pdfUrl}`);
    console.log(`[detect-fillable-areas] Detection params:`, { cannyLow, cannyHigh, houghThreshold, minLineLength, maxLineGap, minWidth });

    let response;
    try {
      response = await fetch(`${RAILWAY_SERVICE_URL}/detect-fillable-areas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfUrl,
          ...(cannyLow !== undefined && { cannyLow }),
          ...(cannyHigh !== undefined && { cannyHigh }),
          ...(houghThreshold !== undefined && { houghThreshold }),
          ...(minLineLength !== undefined && { minLineLength }),
          ...(maxLineGap !== undefined && { maxLineGap }),
          ...(minWidth !== undefined && { minWidth }),
        }),
      });
    } catch (fetchError) {
      console.error('[detect-fillable-areas] Fetch error:', fetchError);
      throw new Error(`Failed to connect to Railway service: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    console.log(`[detect-fillable-areas] Railway response status: ${response.status}`);

    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[detect-fillable-areas] Railway error response: ${responseText}`);

      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { detail: responseText || 'Unknown error' };
      }

      throw new Error(errorData.detail || errorData.message || 'Railway service error');
    }

    const data = await response.json();
    console.log(`[detect-fillable-areas] Success - detected ${data.fieldsDetected} fields`);

    return res.status(200).json(data);
  } catch (error) {
    console.error('[detect-fillable-areas] Error:', error);
    console.error('[detect-fillable-areas] Error type:', typeof error);
    console.error('[detect-fillable-areas] Error details:', JSON.stringify(error, null, 2));

    let errorMessage = 'Unknown error';
    let errorDetails;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      errorMessage = JSON.stringify(error);
    }

    return res.status(500).json({
      error: 'Fillable area detection failed',
      message: errorMessage,
      details: errorDetails,
      rawError: String(error),
    });
  }
}
