import { checkRateLimit } from './_lib/rateLimit.js';

const ALLOWED_ORIGINS = new Set(['https://akus.com.au', 'https://www.akus.com.au']);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const limit = await checkRateLimit(req, 'checker-lead', 5, 600);
  if (!limit.ok) return res.status(limit.status).json({ error: limit.error });

  const { email, url, score } = req.body || {};
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_KEY) return res.status(200).json({ success: true }); // fail open — nothing to save without config, but don't break the UI

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/checker_leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ email, checked_url: url || null, score: Number.isFinite(score) ? score : null }),
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('checker-lead save error:', err);
    return res.status(200).json({ success: true }); // don't fail the user's flow over a lead-capture write
  }
}
