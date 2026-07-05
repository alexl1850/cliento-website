export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { biz, suburb, bizType } = req.body;
    if (!biz || !suburb) return res.status(400).json({ error: 'Business name and suburb are required' });

    const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
    const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

    // ── Detect business type ───────────────────────────────────────────────
    const bizStr = `${bizType || ''} ${biz || ''}`.toLowerCase();
    const isButcher   = /butcher|meat|deli/.test(bizStr);
    const isBakery    = /baker|bakery|bread|pastry|cake/.test(bizStr);
    const isCafe      = /café|cafe|coffee|espresso|brunch/.test(bizStr);
    const isRestaurant= /restaurant|dining|bistro|eatery/.test(bizStr);
    const isTakeaway  = /takeaway|pizza|burger|fish|kebab|chinese|thai|indian|sushi/.test(bizStr);
    const isBar       = /bar|pub|brewery|cocktail|wine/.test(bizStr);
    const isHairSalon = /hair|hairdress|barber|cut|style/.test(bizStr);
    const isBeautySpa = /beauty|spa|massage|facial|nail|lash|brow/.test(bizStr);
    const isPlumber   = /plumb|pipe|drain/.test(bizStr);
    const isElectrician=/electri|wiring|power/.test(bizStr);
    const isBuilder   = /build|construct|renovation|carpent/.test(bizStr);
    const isLandscaper= /landscap|garden|lawn|mow/.test(bizStr);
    const isGym       = /gym|fitness|crossfit|personal train/.test(bizStr);
    const isYoga      = /yoga|pilates|meditation|wellness/.test(bizStr);
    const isPhysio    = /physio|chiro|osteo|rehab/.test(bizStr);
    const isDentist   = /dentist|dental|teeth/.test(bizStr);
    const isPet       = /pet|dog|cat|groom|vet/.test(bizStr);
    const isRetail    = /shop|store|retail|boutique|gift/.test(bizStr);
    const isFlorist   = /florist|flower|bouquet/.test(bizStr);
    const isAutomatic = /mechanic|auto|car|tyre/.test(bizStr);
    const isCleaning  = /clean|housekeep/.test(bizStr);

    // ── Image library ──────────────────────────────────────────────────────
    const imageLibrary = {
      cafe:       ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1920&q=80','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80','https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1920&q=80','https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80','https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=80','https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80','https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&q=80','https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80'],
      restaurant: ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=80','https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=80','https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1920&q=80','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80','https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80','https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80','https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&q=80'],
      bakery:     ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&q=80','https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1920&q=80','https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1920&q=80','https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1920&q=80','https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=800&q=80','https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=80','https://images.unsplash.com/photo-1612203985729-70726954388c?w=800&q=80','https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?w=800&q=80'],
      takeaway:   ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&q=80','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1920&q=80','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=80','https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1920&q=80','https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&q=80','https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=80','https://images.unsplash.com/photo-1527515545081-5db817172677?w=800&q=80','https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=80'],
      bar:        ['https://images.unsplash.com/photo-1538488881038-e252a119ace7?w=1920&q=80','https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=1920&q=80','https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1920&q=80','https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1920&q=80','https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800&q=80','https://images.unsplash.com/photo-1545489709-a7adbff82d8f?w=800&q=80','https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=80','https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&q=80'],
      butcher:    ['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1920&q=80','https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1920&q=80','https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1920&q=80','https://images.unsplash.com/photo-1615937657715-bc7b4b7962c1?w=1920&q=80','https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=800&q=80','https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=80','https://images.unsplash.com/photo-1624973405849-c54e50c68879?w=800&q=80','https://images.unsplash.com/photo-1542528180-1c2803fa048c?w=800&q=80'],
      hairsalon:  ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=80','https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=80','https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1920&q=80','https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1920&q=80','https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&q=80','https://images.unsplash.com/photo-1500840216050-6ffa99d75160?w=800&q=80','https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?w=800&q=80','https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=80'],
      beautyspa:  ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1920&q=80','https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1920&q=80','https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=1920&q=80','https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1920&q=80','https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&q=80','https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=800&q=80','https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80','https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=80'],
      plumber:    ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=80','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80','https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1920&q=80','https://images.unsplash.com/photo-1524749292158-7540c2494485?w=800&q=80','https://images.unsplash.com/photo-1565008576549-57569a49371d?w=800&q=80','https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80','https://images.unsplash.com/photo-1613323593608-abc90fec84ff?w=800&q=80'],
      electrician:['https://images.unsplash.com/photo-1555963153-11ff60182d08?w=1920&q=80','https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1920&q=80','https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1920&q=80','https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1920&q=80','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80','https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=80','https://images.unsplash.com/photo-1565808229224-264b24e56344?w=800&q=80','https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=800&q=80'],
      builder:    ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=80','https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1920&q=80','https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=80','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1920&q=80','https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=80','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80','https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800&q=80','https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80'],
      landscaper: ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=80','https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=80','https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=1920&q=80','https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=1920&q=80','https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=80','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80','https://images.unsplash.com/photo-1563299796-17596ed6b017?w=800&q=80','https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=800&q=80'],
      gym:        ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=80','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=80','https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1920&q=80','https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=80','https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&q=80','https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=80','https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=80','https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=800&q=80'],
      yoga:       ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=80','https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&q=80','https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1920&q=80','https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1920&q=80','https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&q=80','https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&q=80','https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80','https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80'],
      physio:     ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1920&q=80','https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&q=80','https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=1920&q=80','https://images.unsplash.com/photo-1585011664466-b7bbe92f34ef?w=1920&q=80','https://images.unsplash.com/photo-1587725874306-a3ca0d3e68b7?w=800&q=80','https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=80','https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=80','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80'],
      dentist:    ['https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1920&q=80','https://images.unsplash.com/photo-1588776814546-1ffbb172d936?w=1920&q=80','https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1920&q=80','https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1920&q=80','https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=80','https://images.unsplash.com/photo-1603847734787-9e8a3f3e9d60?w=800&q=80','https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=800&q=80','https://images.unsplash.com/photo-1588776813970-ecbfd79d16c1?w=800&q=80'],
      pet:        ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1920&q=80','https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1920&q=80','https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1920&q=80','https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1920&q=80','https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&q=80','https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=80','https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=800&q=80','https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=800&q=80'],
      retail:     ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80','https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1920&q=80','https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1920&q=80','https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1920&q=80','https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=800&q=80','https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80','https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&q=80','https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?w=800&q=80'],
      florist:    ['https://images.unsplash.com/photo-1487530811015-780f5d205f7c?w=1920&q=80','https://images.unsplash.com/photo-1490750967868-88df5691cc84?w=1920&q=80','https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=1920&q=80','https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=1920&q=80','https://images.unsplash.com/photo-1469259943454-aa100abba749?w=800&q=80','https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&q=80','https://images.unsplash.com/photo-1426122402199-be02db90eb90?w=800&q=80','https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=800&q=80'],
      auto:       ['https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=1920&q=80','https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80','https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1920&q=80','https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=1920&q=80','https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=80','https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&q=80','https://images.unsplash.com/photo-1635274605638-d44babc08a4f?w=800&q=80','https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80'],
      cleaning:   ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=80','https://images.unsplash.com/photo-1527515545081-5db817172677?w=1920&q=80','https://images.unsplash.com/photo-1563453392212-326f5e854473?w=1920&q=80','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1920&q=80','https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=80','https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&q=80','https://images.unsplash.com/photo-1594113526902-a6e6e3e89b2e?w=800&q=80','https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800&q=80'],
      default:    ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80','https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1920&q=80','https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=1920&q=80','https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80','https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80','https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80','https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800&q=80'],
    };

    const lib = isButcher ? imageLibrary.butcher : isBakery ? imageLibrary.bakery : isCafe ? imageLibrary.cafe : isRestaurant ? imageLibrary.restaurant : isTakeaway ? imageLibrary.takeaway : isBar ? imageLibrary.bar : isHairSalon ? imageLibrary.hairsalon : isBeautySpa ? imageLibrary.beautyspa : isPlumber ? imageLibrary.plumber : isElectrician ? imageLibrary.electrician : isBuilder ? imageLibrary.builder : isLandscaper ? imageLibrary.landscaper : isGym ? imageLibrary.gym : isYoga ? imageLibrary.yoga : isPhysio ? imageLibrary.physio : isDentist ? imageLibrary.dentist : isPet ? imageLibrary.pet : isRetail ? imageLibrary.retail : isFlorist ? imageLibrary.florist : isAutomatic ? imageLibrary.auto : isCleaning ? imageLibrary.cleaning : imageLibrary.default;

    const nameSeed = biz.split('').reduce((a,c) => a + c.charCodeAt(0), 0);
    const heroImageUrl = lib[nameSeed % 4];
    const galleryImages = lib.slice(4);

    // ── Generate AI content ────────────────────────────────────────────────
    const contentRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 3000,
        system: `You are a website copywriter for Australian local businesses. Write vivid, specific copy. Return ONLY valid JSON.`,
        messages: [{
          role: 'user',
          content: `Write website copy for ${biz} in ${suburb}, Australia. Business type: ${bizType}.

Return this JSON:
{
  "tagline": "6-8 word tagline",
  "hero_headline": "Under 10 words, compelling, location-specific",
  "hero_sub": "2 vivid sentences about this business in ${suburb}",
  "about_story": "3 sentences about the business, warm and personal",
  "services": [
    {"name": "service 1", "desc": "2 sentences", "icon": "emoji"},
    {"name": "service 2", "desc": "2 sentences", "icon": "emoji"},
    {"name": "service 3", "desc": "2 sentences", "icon": "emoji"}
  ],
  "trust_signals": ["signal 1", "signal 2", "signal 3", "signal 4"],
  "cta_headline": "Call to action headline",
  "years_badge": "X years serving ${suburb}",
  "review_count": "47",
  "testimonial": "2 sentence customer testimonial",
  "testimonial_name": "Australian name, ${suburb}"
}`
        }]
      })
    });

    const contentData = await contentRes.json();
    if (contentData.error) throw new Error(contentData.error.message);
    const raw = contentData.content[0].text.replace(/```json|```/g, '').trim();
    const c = JSON.parse(raw);

    // ── Build HTML ─────────────────────────────────────────────────────────
    const p = { primary:'#1E293B', accent:'#38BDF8', dark:'#020617', light:'#E2E8F0', bg:'#F8FAFC' };
    const slug = biz.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'').slice(0,30);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${biz} — ${suburb}</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%231E293B'/><text y='72' x='50' text-anchor='middle' font-size='60' font-family='system-ui' font-weight='900' fill='white'>${biz[0].toUpperCase()}</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:'Inter',system-ui,sans-serif;background:#fff;color:#111827;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{text-decoration:none;color:inherit}
img{max-width:100%;height:auto;display:block}
@keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes heroZoom{from{transform:scale(1.08)}to{transform:scale(1.0)}}
.reveal{opacity:0;transform:translateY(30px);transition:opacity 0.7s ease,transform 0.7s ease}
.reveal.visible{opacity:1;transform:translateY(0)}
nav{position:fixed;top:0;left:0;right:0;z-index:1000;background:linear-gradient(to bottom,rgba(0,0,0,0.5),transparent);transition:all 0.3s}
nav.scrolled{background:rgba(255,255,255,0.97);backdrop-filter:blur(20px);box-shadow:0 1px 0 rgba(0,0,0,0.08)}
.nav-inner{max-width:1200px;margin:0 auto;padding:0 24px;height:72px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-family:'Playfair Display',serif;font-size:1.4rem;font-weight:900;color:#fff;transition:color 0.3s}
nav.scrolled .nav-logo{color:${p.primary}}
.nav-links{display:flex;align-items:center;gap:28px}
.nav-links a{font-size:0.88rem;font-weight:600;color:rgba(255,255,255,0.9);transition:color 0.2s}
nav.scrolled .nav-links a{color:#374151}
.nav-cta{background:${p.accent};color:#111 !important;padding:10px 22px;border-radius:99px;font-weight:700 !important}
.hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden;background:#111}
.hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;background-repeat:no-repeat;animation:heroZoom 14s ease-in-out infinite alternate}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(135deg,rgba(0,0,0,0.78) 0%,rgba(0,0,0,0.4) 60%,rgba(0,0,0,0.2) 100%)}
.hero-content{position:relative;z-index:1;max-width:1200px;margin:0 auto;padding:120px 24px 80px;width:100%}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);border-radius:99px;padding:8px 18px;font-size:0.75rem;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.9);margin-bottom:24px;animation:fadeUp 0.8s ease}
.hero h1{font-family:'Playfair Display',serif;font-size:clamp(2.8rem,6vw,5.5rem);font-weight:900;line-height:1.05;color:#fff;letter-spacing:-0.02em;margin-bottom:24px;animation:fadeUp 0.9s ease 0.1s both;max-width:700px}
.hero h1 em{color:${p.accent};font-style:italic}
.hero-sub{font-size:clamp(1rem,2vw,1.2rem);color:rgba(255,255,255,0.82);max-width:540px;line-height:1.8;margin-bottom:40px;animation:fadeUp 0.9s ease 0.2s both}
.hero-btns{display:flex;gap:16px;flex-wrap:wrap;animation:fadeUp 0.9s ease 0.3s both}
.btn-primary{display:inline-flex;align-items:center;gap:10px;background:${p.accent};color:#111;padding:18px 36px;border-radius:99px;font-weight:800;font-size:1rem;transition:all 0.25s;box-shadow:0 8px 32px ${p.accent}55}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 16px 40px ${p.accent}66;color:#111}
.btn-secondary{display:inline-flex;align-items:center;gap:8px;background:rgba(255,255,255,0.12);color:#fff;padding:17px 32px;border-radius:99px;font-weight:700;border:2px solid rgba(255,255,255,0.3);transition:all 0.2s}
.btn-secondary:hover{background:rgba(255,255,255,0.22);color:#fff}
.hero-stats{display:flex;gap:40px;margin-top:60px;flex-wrap:wrap;animation:fadeUp 0.9s ease 0.4s both}
.stat-num{font-family:'Playfair Display',serif;font-size:2.2rem;font-weight:900;color:#fff;line-height:1}
.stat-label{font-size:0.72rem;color:rgba(255,255,255,0.5);margin-top:4px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em}
.trust{background:#fff;border-bottom:1px solid #F3F4F6;padding:18px 24px}
.trust-inner{max-width:1200px;margin:0 auto;display:flex;justify-content:center;gap:40px;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:8px;font-size:0.85rem;font-weight:600;color:#374151}
section{padding:88px 24px}
.s-inner{max-width:1200px;margin:0 auto}
.eyebrow{font-size:0.72rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:${p.accent};margin-bottom:12px}
.section-h2{font-family:'Playfair Display',serif;font-size:clamp(2rem,4vw,3rem);font-weight:900;letter-spacing:-0.03em;line-height:1.15;color:#111827;margin-bottom:16px}
.section-h2 em{color:${p.primary};font-style:italic}
.section-sub{font-size:1rem;color:#6B7280;max-width:560px;line-height:1.8}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:48px}
.svc-card{border-radius:20px;padding:32px;transition:all 0.3s}
.svc-card:nth-child(2){background:linear-gradient(135deg,${p.primary},${p.dark});color:#fff}
.svc-card:not(:nth-child(2)){background:#F9FAFB;border:1px solid #F3F4F6}
.svc-card:hover{transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,0.1)}
.svc-icon{font-size:2rem;margin-bottom:16px}
.svc-card h3{font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;margin-bottom:10px}
.svc-card:not(:nth-child(2)) h3{color:#111827}
.svc-card:nth-child(2) h3{color:#fff}
.svc-card p{font-size:0.88rem;line-height:1.75}
.svc-card:not(:nth-child(2)) p{color:#6B7280}
.svc-card:nth-child(2) p{color:rgba(255,255,255,0.75)}
.gallery{background:#111;padding:0}
.gallery-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:3px}
.gallery-grid img{width:100%;height:260px;object-fit:cover;display:block;transition:transform 0.4s,filter 0.4s;filter:brightness(0.9)}
.gallery-grid img:hover{filter:brightness(1.1);z-index:1;position:relative}
.gallery-grid img:first-child{grid-column:span 2;height:380px}
.about-grid{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
.about-img{border-radius:24px;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,0.15)}
.about-img img{width:100%;height:480px;object-fit:cover}
.why-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-top:48px}
.why-card{background:#F9FAFB;border:1px solid #F3F4F6;border-radius:20px;padding:28px;transition:all 0.3s}
.why-card:hover{background:${p.light};border-color:${p.primary}25;transform:translateY(-4px)}
.why-icon{font-size:1.8rem;margin-bottom:14px}
.why-card h4{font-family:'Playfair Display',serif;font-size:1rem;font-weight:700;color:#111827;margin-bottom:6px}
.why-card p{font-size:0.85rem;color:#6B7280;line-height:1.7}
.reviews-section{background:${p.dark};padding:88px 24px}
.reviews-inner{max-width:1200px;margin:0 auto;text-align:center}
.reviews-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:48px;text-align:left}
.review-card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:28px}
.review-stars{font-size:0.9rem;color:#FBBF24;margin-bottom:14px}
.review-text{font-size:0.9rem;color:rgba(255,255,255,0.75);line-height:1.8;font-style:italic;margin-bottom:18px}
.review-author{display:flex;align-items:center;gap:10px}
.review-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,${p.accent},${p.primary});display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;font-size:0.85rem;flex-shrink:0}
.review-name{font-size:0.85rem;font-weight:700;color:#fff}
.review-loc{font-size:0.72rem;color:rgba(255,255,255,0.4)}
.cta-section{background:linear-gradient(135deg,${p.primary},${p.dark});padding:112px 24px;text-align:center}
.cta-inner{max-width:680px;margin:0 auto}
.cta-section h2{font-family:'Playfair Display',serif;font-size:clamp(2.2rem,5vw,3.8rem);font-weight:900;color:#fff;letter-spacing:-0.04em;line-height:1.1;margin-bottom:18px}
.cta-section p{font-size:1rem;color:rgba(255,255,255,0.7);margin-bottom:36px;line-height:1.75}
.btn-white{display:inline-flex;align-items:center;gap:10px;background:#fff;color:${p.primary};padding:18px 40px;border-radius:99px;font-weight:900;font-size:1rem;transition:all 0.25s}
.btn-white:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,0.25);color:${p.primary}}
.contact-section{background:#fff;padding:88px 24px}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:start}
.contact-item{display:flex;gap:14px;align-items:flex-start;margin-bottom:24px}
.contact-icon{width:46px;height:46px;border-radius:14px;background:${p.light};display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
.contact-label{font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#9CA3AF;margin-bottom:3px}
.contact-value{font-size:0.95rem;font-weight:700;color:#111827}
.map-placeholder{border-radius:20px;height:320px;background:linear-gradient(135deg,${p.light},${p.bg});display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}
footer{background:#111827;padding:48px 24px 28px}
.footer-inner{max-width:1200px;margin:0 auto}
.footer-top{display:flex;justify-content:space-between;align-items:center;padding-bottom:32px;border-bottom:1px solid rgba(255,255,255,0.08);flex-wrap:wrap;gap:20px}
.footer-logo{font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:900;color:#fff}
.footer-tagline{font-size:0.82rem;color:rgba(255,255,255,0.4);margin-top:4px}
.footer-bottom{display:flex;justify-content:space-between;padding-top:24px;flex-wrap:wrap;gap:10px}
.footer-bottom p{font-size:0.75rem;color:rgba(255,255,255,0.25)}
.powered a{color:rgba(255,255,255,0.35);font-weight:600;font-size:0.72rem}
@media(max-width:768px){
  .about-grid,.contact-grid{grid-template-columns:1fr}
  .why-grid{grid-template-columns:1fr}
  .gallery-grid{grid-template-columns:1fr 1fr}
  .gallery-grid img:first-child{grid-column:span 2}
  nav .nav-links{display:none}
}
</style>
</head>
<body>
<nav id="mainNav">
  <div class="nav-inner">
    <div class="nav-logo">${biz}</div>
    <div class="nav-links">
      <a href="#services">Services</a>
      <a href="#about">About</a>
      <a href="#reviews">Reviews</a>
      <a href="#contact" class="nav-cta">Contact Us</a>
    </div>
  </div>
</nav>

<section class="hero">
  <div class="hero-bg" style="background-image:url('${heroImageUrl}')"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-badge">📍 ${suburb}, Australia</div>
    <h1>${c.hero_headline}</h1>
    <p class="hero-sub">${c.hero_sub}</p>
    <div class="hero-btns">
      <a href="#contact" class="btn-primary">📞 Get in Touch</a>
      <a href="#services" class="btn-secondary">Our Services ↓</a>
    </div>
    <div class="hero-stats">
      <div><div class="stat-num">⭐ ${c.review_count}+</div><div class="stat-label">Happy customers</div></div>
      <div><div class="stat-num">${c.years_badge?.match(/\d+/)?.[0] || '5'}+</div><div class="stat-label">Years in ${suburb}</div></div>
      <div><div class="stat-num">100%</div><div class="stat-label">Local & independent</div></div>
    </div>
  </div>
</section>

<div class="trust">
  <div class="trust-inner">
    ${(c.trust_signals||[]).map(s=>`<div class="trust-item reveal"><span>✓</span> ${s}</div>`).join('')}
  </div>
</div>

<section id="services" style="background:#fff">
  <div class="s-inner">
    <div class="reveal">
      <div class="eyebrow">What We Offer</div>
      <h2 class="section-h2">How we help <em>you</em></h2>
    </div>
    <div class="services-grid">
      ${(c.services||[]).map(s=>`
      <div class="svc-card reveal">
        <div class="svc-icon">${s.icon}</div>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="gallery">
  <div class="gallery-grid">
    ${galleryImages.slice(0,5).map(url=>`<img src="${url}" alt="${biz}" loading="lazy">`).join('')}
  </div>
</section>

<section id="about" style="background:${p.bg}">
  <div class="s-inner">
    <div class="about-grid">
      <div class="about-img reveal">
        <img src="${galleryImages[0]||heroImageUrl}" alt="${biz}" loading="lazy">
      </div>
      <div class="reveal">
        <div class="eyebrow">Our Story</div>
        <h2 class="section-h2">About <em>${biz}</em></h2>
        <p style="color:#374151;line-height:1.9;margin-top:16px">${c.about_story}</p>
        <a href="#contact" style="display:inline-flex;align-items:center;gap:8px;margin-top:28px;background:${p.primary};color:#fff;padding:14px 28px;border-radius:12px;font-weight:800;font-size:0.9rem">Get in Touch →</a>
      </div>
    </div>
  </div>
</section>

<section id="reviews" class="reviews-section">
  <div class="reviews-inner">
    <div class="reveal">
      <div style="font-size:1.4rem;color:#FBBF24;margin-bottom:6px">⭐⭐⭐⭐⭐</div>
      <h2 style="font-family:'Playfair Display',serif;font-size:clamp(1.8rem,3vw,2.8rem);font-weight:900;color:#fff;letter-spacing:-0.03em;margin-bottom:8px">What our customers say</h2>
      <p style="color:rgba(255,255,255,0.4);font-size:0.88rem">Rated 5 stars by ${c.review_count}+ customers in ${suburb}</p>
    </div>
    <div class="reviews-grid">
      ${[
        {text:c.testimonial||`Outstanding service every time.`,name:c.testimonial_name||'Sarah M.',loc:suburb},
        {text:`Best in ${suburb} by far. Wouldn't go anywhere else. Highly recommend to everyone!`,name:'James T.',loc:suburb},
        {text:`Professional, friendly and always delivers. ${biz} is the real deal.`,name:'Michelle K.',loc:suburb},
      ].map(r=>`
      <div class="review-card reveal">
        <div class="review-stars">⭐⭐⭐⭐⭐</div>
        <p class="review-text">"${r.text}"</p>
        <div class="review-author">
          <div class="review-avatar">${r.name[0]}</div>
          <div><div class="review-name">${r.name}</div><div class="review-loc">📍 ${r.loc}</div></div>
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>

<section class="cta-section">
  <div class="cta-inner reveal">
    <div class="eyebrow" style="color:rgba(255,255,255,0.5);margin-bottom:14px">${suburb}, Australia</div>
    <h2>${c.cta_headline||`Ready to experience ${biz}?`}</h2>
    <p>We'd love to hear from you. Get in touch today and let's get started.</p>
    <a href="#contact" class="btn-white">📞 Contact Us →</a>
  </div>
</section>

<section id="contact" class="contact-section">
  <div class="s-inner">
    <div class="contact-grid">
      <div class="reveal">
        <div class="eyebrow">Get in Touch</div>
        <h2 class="section-h2">We'd love to <em>hear from you</em></h2>
        <div style="margin-top:32px">
          <div class="contact-item"><div class="contact-icon">📍</div><div><div class="contact-label">Location</div><div class="contact-value">${suburb}, Australia</div></div></div>
          <div class="contact-item"><div class="contact-icon">📞</div><div><div class="contact-label">Phone</div><div class="contact-value">Contact us for details</div></div></div>
          <div class="contact-item"><div class="contact-icon">🕐</div><div><div class="contact-label">Hours</div><div class="contact-value">Contact us for hours</div></div></div>
        </div>
      </div>
      <div class="map-placeholder reveal">
        <div style="font-size:3rem">📍</div>
        <p style="font-size:0.88rem;color:#6B7280;font-weight:600">Located in ${suburb}</p>
        <a href="https://maps.google.com/?q=${encodeURIComponent(biz+' '+suburb)}" target="_blank" style="color:${p.primary};font-weight:700;font-size:0.85rem">Open in Google Maps →</a>
      </div>
    </div>
  </div>
</section>

<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div>
        <div class="footer-logo">${biz}</div>
        <div class="footer-tagline">${c.tagline||`Proudly serving ${suburb} and surrounds`}</div>
      </div>
      <div style="display:flex;gap:24px">
        <a href="#services" style="font-size:0.85rem;color:rgba(255,255,255,0.5)">Services</a>
        <a href="#about" style="font-size:0.85rem;color:rgba(255,255,255,0.5)">About</a>
        <a href="#contact" style="font-size:0.85rem;color:rgba(255,255,255,0.5)">Contact</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} ${biz} · ${suburb}, Australia</p>
      <div class="powered"><a href="https://akus.com.au" target="_blank">Website by ⚡ Akus</a></div>
    </div>
  </div>
</footer>

<script>
const nav = document.getElementById('mainNav');
window.addEventListener('scroll',()=>{nav.classList.toggle('scrolled',window.scrollY>60)},{passive:true});
const revEls = document.querySelectorAll('.reveal');
const obs = new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});},{threshold:0.08});
revEls.forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}});});
</script>
</body>
</html>`;

    // ── Deploy to Vercel ───────────────────────────────────────────────────
    const deployRes = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `akus-demo-${slug}`,
        files: [{ file: 'index.html', data: Buffer.from(html).toString('base64'), encoding: 'base64' }],
        projectSettings: { framework: null },
        target: 'production',
      })
    });

    const deployData = await deployRes.json();
    if (deployData.error) throw new Error(deployData.error.message);
    const liveUrl = `https://${deployData.alias?.[0] || deployData.url}`;

    return res.status(200).json({ success: true, url: liveUrl, html });

  } catch(err) {
    console.error('Demo error:', err);
    return res.status(500).json({ error: err.message });
  }
}
