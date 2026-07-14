// Best-effort SSRF guard for a public "type any URL" tool — this fetches
// whatever the caller submits, so it has to refuse to fetch internal/private
// targets. Not DNS-rebinding-proof (would need to resolve the hostname and
// fetch by IP), but proportionate for a marketing-site lead-gen tool that
// isn't touching anything sensitive — matches the threat model, not
// over-built for it.
const PRIVATE_HOST_RE = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|::1|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|192\.168\.\d+\.\d+|169\.254\.\d+\.\d+)$/i;

export function parseSafeUrl(input) {
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
  } catch {
    return { ok: false, error: 'That doesn\'t look like a valid website address.' };
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: 'Only http/https website addresses are supported.' };
  }
  if (PRIVATE_HOST_RE.test(url.hostname)) {
    return { ok: false, error: 'That address can\'t be checked.' };
  }
  return { ok: true, url };
}
