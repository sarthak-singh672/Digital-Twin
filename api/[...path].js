export default async function handler(req, res) {
  const backendOrigin = (process.env.DIGITAL_TWIN_BACKEND_ORIGIN || '').replace(/\/$/, '');

  if (!backendOrigin) {
    res.status(500).json({
      detail: 'Vercel proxy misconfigured: set DIGITAL_TWIN_BACKEND_ORIGIN'
    });
    return;
  }

  const incomingUrl = new URL(req.url, `http://${req.headers.host}`);
  const targetUrl = new URL(incomingUrl.pathname, backendOrigin);
  targetUrl.search = incomingUrl.search;

  const safeHeaderNames = ['authorization', 'content-type', 'accept', 'user-agent'];
  const headers = {};
  for (const name of safeHeaderNames) {
    const value = req.headers[name];
    if (value) headers[name] = value;
  }

  let body;
  if (!['GET', 'HEAD'].includes(req.method)) {
    if (Buffer.isBuffer(req.body) || typeof req.body === 'string') {
      body = req.body;
    } else if (req.body !== undefined && req.body !== null) {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        body = new URLSearchParams(req.body).toString();
      } else {
        body = JSON.stringify(req.body);
      }
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body
    });

    for (const [key, value] of response.headers.entries()) {
      const lowerKey = key.toLowerCase();
      if (!['content-length', 'transfer-encoding', 'content-encoding'].includes(lowerKey)) {
        res.setHeader(key, value);
      }
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.status(response.status).send(buffer);
  } catch (error) {
    const requestId = req.headers['x-vercel-id'] || `req-${Date.now()}`;
    console.error('[vercel-api-proxy] upstream request failed', {
      requestId,
      method: req.method,
      path: incomingUrl.pathname,
      error: error?.message || String(error)
    });
    res.status(502).json({ detail: 'Upstream API unreachable', request_id: requestId });
  }
}
