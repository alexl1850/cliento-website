// IP-based rate limiting for public, unauthenticated endpoints — mirrors
// cliento-app's api/_lib/rateLimit.js exactly (same shared Supabase project,
// same increment_rate_limit RPC / rate_limits table already migrated there).
// Kept as a separate copy rather than a cross-repo import since these are
// two independent Vercel deployments.
export async function checkRateLimit(req, keyPrefix, maxRequests, windowSeconds) {
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor)?.split(',')[0]?.trim()
    || req.headers['x-real-ip']
    || 'unknown';

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/increment_rate_limit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
      body: JSON.stringify({
        p_key: `${keyPrefix}:${ip}`,
        p_window_seconds: windowSeconds,
        p_max: maxRequests,
      }),
    });
    if (!res.ok) return { ok: true }; // fail open — a broken limiter shouldn't take down the feature
    const allowed = await res.json();
    return allowed ? { ok: true } : { ok: false, status: 429, error: "You've hit the limit for this — please try again in a bit." };
  } catch {
    return { ok: true }; // fail open
  }
}
