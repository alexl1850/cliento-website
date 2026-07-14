// Pure PageSpeed Insights lookup — mirrors cliento-app's api/_lib/pagespeedCheck.js.
// Works without GOOGLE_PAGESPEED_API_KEY set (lower shared quota), same
// tolerant behaviour as the original — kept as a separate copy since these
// are two independent Vercel deployments.
export async function checkPagespeed(url) {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY;
  const params = new URLSearchParams({ url, strategy: 'mobile', category: 'performance' });
  if (apiKey) params.set('key', apiKey);

  const psiRes = await fetch(`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`);
  const psiData = await psiRes.json();
  if (!psiRes.ok) {
    const rawMessage = psiData.error?.message || 'PageSpeed check failed';
    console.error('PageSpeed API error:', rawMessage);
    const isQuota = /quota/i.test(rawMessage);
    throw new Error(isQuota ? 'Speed checks are temporarily unavailable — please try again later.' : 'Could not check that URL — make sure it\'s a valid, live website address.');
  }

  const audits = psiData.lighthouseResult?.audits || {};
  const score = Math.round((psiData.lighthouseResult?.categories?.performance?.score || 0) * 100);
  const metrics = {
    firstContentfulPaint: audits['first-contentful-paint']?.displayValue || null,
    largestContentfulPaint: audits['largest-contentful-paint']?.displayValue || null,
    speedIndex: audits['speed-index']?.displayValue || null,
  };

  return { score, metrics };
}
