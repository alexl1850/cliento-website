import { checkRateLimit } from './_lib/rateLimit.js';
import { parseSafeUrl } from './_lib/urlSafety.js';
import { checkPagespeed } from './_lib/pagespeedCheck.js';

const ALLOWED_ORIGINS = new Set(['https://akus.com.au', 'https://www.akus.com.au']);

function extractOnPageChecks(html, isHttps) {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || '';
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const description = descMatch?.[1]?.trim() || '';
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const hasH1 = /<h1[\s>]/i.test(html);

  return {
    https: { pass: isHttps, label: 'Secure (HTTPS)', detail: isHttps ? 'Site is served over HTTPS.' : 'Site is not using HTTPS — this hurts trust and Google ranking.' },
    title: { pass: title.length > 0 && title.length <= 60, label: 'Page title', detail: title ? `"${title}" (${title.length} characters)` : 'No <title> tag found.' },
    description: { pass: description.length >= 50 && description.length <= 160, label: 'Meta description', detail: description ? `${description.length} characters` : 'No meta description found — Google will write its own snippet instead of yours.' },
    viewport: { pass: hasViewport, label: 'Mobile-friendly tag', detail: hasViewport ? 'Viewport meta tag present.' : 'Missing viewport meta tag — the site may not display correctly on phones.' },
    canonical: { pass: hasCanonical, label: 'Canonical URL', detail: hasCanonical ? 'Canonical link tag present.' : 'No canonical tag — can cause duplicate-content issues.' },
    h1: { pass: hasH1, label: 'Main heading (H1)', detail: hasH1 ? 'Page has a main heading.' : 'No H1 heading found on the page.' },
  };
}

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const limit = await checkRateLimit(req, 'website-checker', 8, 600); // 8 checks / 10 min / IP
  if (!limit.ok) return res.status(limit.status).json({ error: limit.error });

  const { url: rawUrl } = req.body || {};
  if (!rawUrl) return res.status(400).json({ error: 'Enter a website address to check.' });

  const parsed = parseSafeUrl(rawUrl);
  if (!parsed.ok) return res.status(400).json({ error: parsed.error });
  const { url } = parsed;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    let html = '';
    let fetchError = null;
    try {
      const pageRes = await fetch(url.toString(), {
        signal: controller.signal,
        redirect: 'follow',
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AkusWebsiteChecker/1.0)' },
      });
      // Cap how much we read — we only need the <head> for these checks.
      const reader = pageRes.body?.getReader?.();
      if (reader) {
        const chunks = [];
        let received = 0;
        while (received < 200_000) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
        }
        html = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf-8');
        reader.cancel?.();
      } else {
        html = await pageRes.text();
      }
    } catch (e) {
      fetchError = e.name === 'AbortError' ? 'That site took too long to respond.' : 'Could not reach that website — double check the address.';
    } finally {
      clearTimeout(timeout);
    }

    if (fetchError) return res.status(400).json({ error: fetchError });

    const onPage = extractOnPageChecks(html, url.protocol === 'https:');

    let speed = null;
    let speedError = null;
    try {
      speed = await checkPagespeed(url.toString());
    } catch (e) {
      speedError = e.message;
    }

    return res.status(200).json({ url: url.toString(), onPage, speed, speedError });
  } catch (err) {
    console.error('Website checker error:', err);
    return res.status(500).json({ error: 'Something went wrong checking that site — please try again.' });
  }
}
