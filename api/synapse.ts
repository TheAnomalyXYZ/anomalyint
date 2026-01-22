import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Extract the path after /api/synapse
  const fullPath = req.url || '';
  const apiPath = fullPath.replace('/api/synapse', '');

  // Construct the target URL
  const targetUrl = `https://admin-launcher-api-synapse-dev.dolong-4e5.workers.dev${apiPath}`;

  console.log('[Proxy] Method:', req.method);
  console.log('[Proxy] Full URL:', req.url);
  console.log('[Proxy] API Path:', apiPath);
  console.log('[Proxy] Target URL:', targetUrl);

  try {
    const apiKey = process.env.SYNAPSE_API_KEY;

    if (!apiKey) {
      console.error('[Proxy] API key not configured');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('[Proxy] Making request with API key');

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    console.log('[Proxy] Response status:', response.status);
    console.log('[Proxy] Response headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('[Proxy] Response data keys:', Object.keys(data));

    res.status(response.status).json(data);
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ error: 'Failed to proxy request', message: error instanceof Error ? error.message : 'Unknown error' });
  }
}
