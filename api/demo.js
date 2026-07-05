export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { biz, suburb, bizType } = req.body;
    if (!biz || !suburb) return res.status(400).json({ error: 'Business name and suburb required' });

    const VERCEL_TOKEN = process.env.VERCEL_API_TOKEN;
    const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
    const bizStr = `${bizType||''} ${biz||''}`.toLowerCase();

    // ── Business type detection ────────────────────────────────────────────
    const isButcher    = /butcher|meat|deli|smallgoods/.test(bizStr);
    const isBakery     = /baker|bakery|bread|pastry|cake|patisserie/.test(bizStr);
    const isCafe       = /café|cafe|coffee|espresso|brunch|breakfast/.test(bizStr);
    const isRestaurant = /restaurant|dining|bistro|eatery|diner/.test(bizStr);
    const isTakeaway   = /takeaway|pizza|burger|kebab|chinese|thai|indian|sushi|noodle/.test(bizStr);
    const isBar        = /bar|pub|brewery|cocktail|wine|taproom/.test(bizStr);
    const isHairSalon  = /hair|hairdress|barber|barbers/.test(bizStr);
    const isBeautySpa  = /beauty|spa|massage|facial|nail|lash|brow|wax/.test(bizStr);
    const isPlumber    = /plumb|pipe|drain|hot water/.test(bizStr);
    const isElec       = /electri|wiring|power|solar/.test(bizStr);
    const isBuilder    = /build|construct|renovation|carpent|cabinet/.test(bizStr);
    const isLandscaper = /landscap|garden|lawn|mow|turf/.test(bizStr);
    const isGym        = /gym|fitness|crossfit|personal train/.test(bizStr);
    const isYoga       = /yoga|pilates|meditation|wellness/.test(bizStr);
    const isPhysio     = /physio|chiro|osteo|rehab/.test(bizStr);
    const isDentist    = /dentist|dental|teeth|orthodont/.test(bizStr);
    const isPet        = /pet|dog|cat|groom|vet/.test(bizStr);
    const isRetail     = /shop|store|retail|boutique|gift|jewel/.test(bizStr);
    const isFlorist    = /florist|flower|bouquet/.test(bizStr);
    const isAuto       = /mechanic|auto|car|tyre|smash/.test(bizStr);
    const isCleaning   = /clean|housekeep|domestic/.test(bizStr);

    // ── Palette & theme per business type ─────────────────────────────────
    const theme = isButcher ? {
      primary:'#7C1F1F', accent:'#C5382A', light:'#FDF2F0', dark:'#3D0F0F',
      bg:'#FFFAF9', text:'#1A0A0A', muted:'#8B5E5E', font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(60,15,15,0.88) 0%,rgba(197,56,42,0.3) 100%)',
      name:'butcher', cta:'Visit the Shop', services_title:'Our Cuts'
    } : isBakery ? {
      primary:'#78350F', accent:'#D97706', light:'#FFFBEB', dark:'#1C0A00',
      bg:'#FFFDF5', text:'#1C0A00', muted:'#92400E', font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(28,10,0,0.85) 0%,rgba(217,119,6,0.25) 100%)',
      name:'bakery', cta:'Visit Us Today', services_title:'Fresh From the Oven'
    } : isCafe ? {
      primary:'#292524', accent:'#A16207', light:'#FFFBEB', dark:'#1C1917',
      bg:'#FAFAF9', text:'#1C1917', muted:'#78716C', font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(28,25,23,0.87) 0%,rgba(161,98,7,0.2) 100%)',
      name:'cafe', cta:'Come In for a Coffee', services_title:'On the Menu'
    } : isRestaurant ? {
      primary:'#1E1B4B', accent:'#7C3AED', light:'#EDE9FE', dark:'#0D0B2A',
      bg:'#FAFAFA', text:'#0D0B2A', muted:'#6D6A8A', font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(13,11,42,0.9) 0%,rgba(124,58,237,0.25) 100%)',
      name:'restaurant', cta:'Book a Table', services_title:'Our Menu'
    } : isTakeaway ? {
      primary:'#DC2626', accent:'#EF4444', light:'#FEF2F2', dark:'#450A0A',
      bg:'#FFFAFA', text:'#1A0000', muted:'#7F1D1D', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(69,10,10,0.88) 0%,rgba(220,38,38,0.3) 100%)',
      name:'takeaway', cta:'Order Now', services_title:"What's Hot"
    } : isBar ? {
      primary:'#0C0A09', accent:'#D4AF37', light:'#FFFDF0', dark:'#000000',
      bg:'#0C0A09', text:'#F5F0E8', muted:'#A89B7A', font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(0,0,0,0.92) 0%,rgba(212,175,55,0.2) 100%)',
      name:'bar', cta:'Come For a Drink', services_title:'What We Pour'
    } : isHairSalon ? {
      primary:'#1E293B', accent:'#0EA5E9', light:'#F0F9FF', dark:'#0C1A3D',
      bg:'#F8FAFC', text:'#0F172A', muted:'#475569', font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(12,26,61,0.85) 0%,rgba(14,165,233,0.2) 100%)',
      name:'hairsalon', cta:'Book an Appointment', services_title:'Our Services'
    } : isBeautySpa ? {
      primary:'#831843', accent:'#EC4899', light:'#FDF2F8', dark:'#500724',
      bg:'#FFF5F9', text:'#1A0010', muted:'#9D174D', font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(80,7,36,0.85) 0%,rgba(236,72,153,0.2) 100%)',
      name:'beauty', cta:'Book Now', services_title:'Our Treatments'
    } : isPlumber ? {
      primary:'#1E3A5F', accent:'#0EA5E9', light:'#EFF6FF', dark:'#0A1628',
      bg:'#F8FAFF', text:'#0F172A', muted:'#3B5A8A', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(10,22,40,0.88) 0%,rgba(14,165,233,0.2) 100%)',
      name:'plumber', cta:'Get a Free Quote', services_title:'Our Services'
    } : isElec ? {
      primary:'#1C1917', accent:'#FBBF24', light:'#FFFBEB', dark:'#0C0A09',
      bg:'#FAFAF9', text:'#1C1917', muted:'#6B6560', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(12,10,9,0.9) 0%,rgba(251,191,36,0.2) 100%)',
      name:'electrician', cta:'Get a Free Quote', services_title:'Our Services'
    } : isBuilder ? {
      primary:'#292524', accent:'#D97706', light:'#FFFBEB', dark:'#1C1917',
      bg:'#FAFAF9', text:'#1C1917', muted:'#78716C', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(28,25,23,0.88) 0%,rgba(217,119,6,0.2) 100%)',
      name:'builder', cta:'Get a Free Quote', services_title:'What We Build'
    } : isLandscaper ? {
      primary:'#14532D', accent:'#22C55E', light:'#F0FDF4', dark:'#052E16',
      bg:'#F7FFF9', text:'#052E16', muted:'#166534', font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(5,46,22,0.85) 0%,rgba(34,197,94,0.2) 100%)',
      name:'landscaper', cta:'Get a Free Quote', services_title:'Our Services'
    } : isGym ? {
      primary:'#111827', accent:'#EF4444', light:'#FEF2F2', dark:'#030712',
      bg:'#F9FAFB', text:'#030712', muted:'#4B5563', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(3,7,18,0.9) 0%,rgba(239,68,68,0.25) 100%)',
      name:'gym', cta:'Start Training', services_title:'Our Programs'
    } : isYoga ? {
      primary:'#4A1D96', accent:'#8B5CF6', light:'#F5F3FF', dark:'#1E0A47',
      bg:'#FBF9FF', text:'#1E0A47', muted:'#6D28D9', font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(30,10,71,0.85) 0%,rgba(139,92,246,0.2) 100%)',
      name:'yoga', cta:'Book a Class', services_title:'Our Classes'
    } : isPhysio ? {
      primary:'#0F766E', accent:'#14B8A6', light:'#F0FDFA', dark:'#042F2E',
      bg:'#F7FFFD', text:'#042F2E', muted:'#0D5C56', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(4,47,46,0.85) 0%,rgba(20,184,166,0.2) 100%)',
      name:'physio', cta:'Book an Appointment', services_title:'Our Services'
    } : isDentist ? {
      primary:'#1E40AF', accent:'#3B82F6', light:'#EFF6FF', dark:'#0A1628',
      bg:'#F8FBFF', text:'#0F172A', muted:'#2563EB', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(10,22,40,0.85) 0%,rgba(59,130,246,0.2) 100%)',
      name:'dentist', cta:'Book an Appointment', services_title:'Our Services'
    } : isPet ? {
      primary:'#92400E', accent:'#F59E0B', light:'#FFFBEB', dark:'#1C0A00',
      bg:'#FFFDF5', text:'#1C0A00', muted:'#B45309', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(28,10,0,0.85) 0%,rgba(245,158,11,0.2) 100%)',
      name:'pet', cta:'Book a Grooming', services_title:'Our Services'
    } : isRetail ? {
      primary:'#0F172A', accent:'#6366F1', light:'#EEF2FF', dark:'#020617',
      bg:'#F8F8FF', text:'#0F172A', muted:'#4F46E5', font:'Playfair Display',
      heroOverlay:'linear-gradient(135deg,rgba(2,6,23,0.85) 0%,rgba(99,102,241,0.2) 100%)',
      name:'retail', cta:'Shop Now', services_title:'What We Offer'
    } : isFlorist ? {
      primary:'#701A75', accent:'#D946EF', light:'#FDF4FF', dark:'#3B0764',
      bg:'#FFF8FF', text:'#1A0028', muted:'#86198F', font:'Cormorant Garamond',
      heroOverlay:'linear-gradient(135deg,rgba(59,7,100,0.85) 0%,rgba(217,70,239,0.2) 100%)',
      name:'florist', cta:'Order Flowers', services_title:'Our Arrangements'
    } : isAuto ? {
      primary:'#111827', accent:'#F59E0B', light:'#FFFBEB', dark:'#030712',
      bg:'#0F172A', text:'#F8FAFC', muted:'#94A3B8', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(3,7,18,0.92) 0%,rgba(245,158,11,0.2) 100%)',
      name:'auto', cta:'Book a Service', services_title:'Our Services'
    } : isCleaning ? {
      primary:'#0369A1', accent:'#38BDF8', light:'#F0F9FF', dark:'#0C2A40',
      bg:'#F5FAFE', text:'#0C2A40', muted:'#0EA5E9', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(12,42,64,0.85) 0%,rgba(56,189,248,0.2) 100%)',
      name:'cleaning', cta:'Get a Quote', services_title:'Our Services'
    } : {
      primary:'#1E293B', accent:'#38BDF8', light:'#F0F9FF', dark:'#020617',
      bg:'#F8FAFC', text:'#0F172A', muted:'#475569', font:'Inter',
      heroOverlay:'linear-gradient(135deg,rgba(2,6,23,0.85) 0%,rgba(56,189,248,0.2) 100%)',
      name:'default', cta:'Get in Touch', services_title:'Our Services'
    };

    // ── Image library ──────────────────────────────────────────────────────
    const images = {
      butcher:     ['https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=1920&q=85','https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1920&q=85','https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1920&q=85','https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=800&q=85','https://images.unsplash.com/photo-1558030006-450675393462?w=800&q=85','https://images.unsplash.com/photo-1624973405849-c54e50c68879?w=800&q=85'],
      bakery:      ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&q=85','https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1920&q=85','https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1920&q=85','https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=800&q=85','https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=800&q=85','https://images.unsplash.com/photo-1612203985729-70726954388c?w=800&q=85'],
      cafe:        ['https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1920&q=85','https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=85','https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1920&q=85','https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&q=85','https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=85','https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=800&q=85'],
      restaurant:  ['https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1920&q=85','https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=85','https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1920&q=85','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=85','https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=85','https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=85'],
      takeaway:    ['https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1920&q=85','https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=1920&q=85','https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1920&q=85','https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&q=85','https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&q=85','https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=800&q=85'],
      bar:         ['https://images.unsplash.com/photo-1538488881038-e252a119ace7?w=1920&q=85','https://images.unsplash.com/photo-1525268323446-0505b6fe7778?w=1920&q=85','https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1920&q=85','https://images.unsplash.com/photo-1575444758702-4a6b9222336e?w=800&q=85','https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800&q=85','https://images.unsplash.com/photo-1560512823-829485b8bf24?w=800&q=85'],
      hairsalon:   ['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1920&q=85','https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1920&q=85','https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1920&q=85','https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=800&q=85','https://images.unsplash.com/photo-1500840216050-6ffa99d75160?w=800&q=85','https://images.unsplash.com/photo-1596178060810-72f53ce9a65c?w=800&q=85'],
      beauty:      ['https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1920&q=85','https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=1920&q=85','https://images.unsplash.com/photo-1576426863848-c21f53c60b19?w=1920&q=85','https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=800&q=85','https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=85','https://images.unsplash.com/photo-1552693673-1bf958298935?w=800&q=85'],
      plumber:     ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85','https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=85','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=85','https://images.unsplash.com/photo-1524749292158-7540c2494485?w=800&q=85','https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=85','https://images.unsplash.com/photo-1613323593608-abc90fec84ff?w=800&q=85'],
      electrician: ['https://images.unsplash.com/photo-1555963153-11ff60182d08?w=1920&q=85','https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1920&q=85','https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1920&q=85','https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=85','https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=800&q=85','https://images.unsplash.com/photo-1565808229224-264b24e56344?w=800&q=85'],
      builder:     ['https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1920&q=85','https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=1920&q=85','https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1920&q=85','https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=800&q=85','https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=85','https://images.unsplash.com/photo-1605152276897-4f618f831968?w=800&q=85'],
      landscaper:  ['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1920&q=85','https://images.unsplash.com/photo-1558904541-efa843a96f01?w=1920&q=85','https://images.unsplash.com/photo-1585320806297-9794b3e4aaae?w=1920&q=85','https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=800&q=85','https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=85','https://images.unsplash.com/photo-1563299796-17596ed6b017?w=800&q=85'],
      gym:         ['https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&q=85','https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1920&q=85','https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1920&q=85','https://images.unsplash.com/photo-1581009137042-c552e485697a?w=800&q=85','https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&q=85','https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800&q=85'],
      yoga:        ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1920&q=85','https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1920&q=85','https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1920&q=85','https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&q=85','https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&q=85','https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=85'],
      physio:      ['https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1920&q=85','https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1920&q=85','https://images.unsplash.com/photo-1585011664466-b7bbe92f34ef?w=1920&q=85','https://images.unsplash.com/photo-1587725874306-a3ca0d3e68b7?w=800&q=85','https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&q=85','https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=800&q=85'],
      dentist:     ['https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1920&q=85','https://images.unsplash.com/photo-1588776814546-1ffbb172d936?w=1920&q=85','https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1920&q=85','https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&q=85','https://images.unsplash.com/photo-1603847734787-9e8a3f3e9d60?w=800&q=85','https://images.unsplash.com/photo-1571772996211-2f02c9727629?w=800&q=85'],
      pet:         ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1920&q=85','https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1920&q=85','https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1920&q=85','https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=800&q=85','https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=800&q=85','https://images.unsplash.com/photo-1615751072497-5f5169febe17?w=800&q=85'],
      retail:      ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=85','https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=1920&q=85','https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=1920&q=85','https://images.unsplash.com/photo-1481437156560-3205f6a55735?w=800&q=85','https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=85','https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=800&q=85'],
      florist:     ['https://images.unsplash.com/photo-1487530811015-780f5d205f7c?w=1920&q=85','https://images.unsplash.com/photo-1490750967868-88df5691cc84?w=1920&q=85','https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?w=1920&q=85','https://images.unsplash.com/photo-1469259943454-aa100abba749?w=800&q=85','https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&q=85','https://images.unsplash.com/photo-1426122402199-be02db90eb90?w=800&q=85'],
      auto:        ['https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=1920&q=85','https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=85','https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1920&q=85','https://images.unsplash.com/photo-1493238792000-8113da705763?w=800&q=85','https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&q=85','https://images.unsplash.com/photo-1635274605638-d44babc08a4f?w=800&q=85'],
      cleaning:    ['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1920&q=85','https://images.unsplash.com/photo-1527515545081-5db817172677?w=1920&q=85','https://images.unsplash.com/photo-1563453392212-326f5e854473?w=1920&q=85','https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&q=85','https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=85','https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&q=85'],
      default:     ['https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=85','https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=85','https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1920&q=85','https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=85','https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=85','https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=85'],
    };

    const lib = images[theme.name] || images.default;
    const seed = biz.split('').reduce((a,c)=>a+c.charCodeAt(0),0);
    const hero = lib[seed % Math.min(3,lib.length)];
    const gallery = lib.slice(3);
    const isLight = theme.name !== 'bar' && theme.name !== 'auto';

    // ── Generate AI content ────────────────────────────────────────────────
    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':ANTHROPIC_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({
        model:'claude-sonnet-4-6', max_tokens:3000,
        system:`You are a premium website copywriter for Australian local businesses. Write vivid, specific, emotionally resonant copy. Never generic. Always specific to this exact business. Return ONLY valid JSON.`,
        messages:[{role:'user',content:`Write premium website copy for ${biz} in ${suburb}. Type: ${bizType||theme.name}.

Return JSON:
{
  "headline": "8-12 word hero headline. Powerful. Specific. Makes you feel something. Mention ${suburb} naturally.",
  "subline": "2 vivid sentences. Sensory. Specific to this business type. What it feels like to be their customer.",
  "about": "3 sentences. Personal story. Why they do this. What makes them love their work.",
  "services": [
    {"name":"specific service name","desc":"2 vivid sentences why someone needs this and what they get","icon":"single emoji","price":"realistic price like $65 or $120-180"},
    {"name":"...","desc":"...","icon":"...","price":"..."},
    {"name":"...","desc":"...","icon":"...","price":"..."}
  ],
  "why1_title":"First reason customers choose them","why1_desc":"One sentence expanding on this",
  "why2_title":"Second reason","why2_desc":"One sentence",
  "why3_title":"Third reason","why3_desc":"One sentence",
  "testimonial":"2 sentence review from a happy local customer. Specific detail about their experience.",
  "testimonial_name":"Australian name, ${suburb}",
  "cta":"Warm, specific call to action sentence",
  "tagline":"4-6 word footer tagline"
}`}]
      })
    });
    const aiData = await aiRes.json();
    if (aiData.error) throw new Error(aiData.error.message);
    const c = JSON.parse(aiData.content[0].text.replace(/```json|```/g,'').trim());

    // ── Build the premium HTML ─────────────────────────────────────────────
    const slug = biz.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,30);
    const initial = biz[0].toUpperCase();
    const darkBg = !isLight;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${biz} — ${suburb}</title>
<meta name="description" content="${c.subline}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='${encodeURIComponent(theme.accent)}'/><text y='72' x='50' text-anchor='middle' font-size='60' font-family='Georgia' font-weight='900' fill='white'>${initial}</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=${theme.font.replace(' ','+')}:ital,wght@0,300;0,400;0,600;0,700;0,900;1,400;1,700&family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --primary:${theme.primary};
  --accent:${theme.accent};
  --light:${theme.light};
  --dark:${theme.dark};
  --bg:${darkBg ? theme.dark : theme.bg};
  --text:${darkBg ? '#F8F9FA' : theme.text};
  --muted:${darkBg ? 'rgba(248,249,250,0.55)' : theme.muted};
  --serif:'${theme.font}',Georgia,serif;
  --sans:'Inter',system-ui,sans-serif;
}
html{scroll-behavior:smooth;font-size:16px}
body{font-family:var(--sans);background:var(--bg);color:var(--text);line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{display:block;max-width:100%}
a{text-decoration:none;color:inherit}

/* ── ANIMATIONS ── */
@keyframes fadeUp{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)}}
@keyframes zoomHero{0%{transform:scale(1.1)}100%{transform:scale(1.0)}}
@keyframes slideRight{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
@keyframes slideLeft{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
.fade-up{opacity:0;transform:translateY(40px);transition:opacity 0.8s cubic-bezier(.16,1,.3,1),transform 0.8s cubic-bezier(.16,1,.3,1)}
.fade-up.visible{opacity:1;transform:translateY(0)}
.delay-1{transition-delay:.1s}.delay-2{transition-delay:.2s}.delay-3{transition-delay:.3s}.delay-4{transition-delay:.4s}

/* ── NAV ── */
#nav{position:fixed;top:0;left:0;right:0;z-index:100;transition:all 0.4s}
#nav.solid{background:rgba(${darkBg?'12,10,9':'255,255,255'},0.96);backdrop-filter:blur(24px);border-bottom:1px solid rgba(${darkBg?'255,255,255':'0,0,0'},0.08)}
.nav-wrap{max-width:1280px;margin:0 auto;padding:0 32px;height:76px;display:flex;align-items:center;justify-content:space-between}
.nav-logo{font-family:var(--serif);font-size:1.5rem;font-weight:700;color:#fff;letter-spacing:-0.02em;transition:color 0.3s}
#nav.solid .nav-logo{color:var(--primary)}
.nav-links{display:flex;align-items:center;gap:36px}
.nav-links a{font-size:0.82rem;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.8);transition:color 0.2s}
#nav.solid .nav-links a{color:var(--primary)}
.nav-links a:hover{color:var(--accent)}
.nav-book{background:var(--accent);color:${darkBg?'#fff':'#fff'} !important;padding:11px 26px;border-radius:99px;font-size:0.8rem !important;letter-spacing:0.04em !important;transition:all 0.2s !important;box-shadow:0 4px 16px ${theme.accent}44}
.nav-book:hover{transform:translateY(-2px);box-shadow:0 8px 24px ${theme.accent}55 !important}

/* ── HERO ── */
.hero{position:relative;min-height:100vh;display:flex;align-items:flex-end;overflow:hidden;background:#000}
.hero-img{position:absolute;inset:0;background:url('${hero}') center/cover no-repeat;animation:zoomHero 16s ease-in-out forwards}
.hero-overlay{position:absolute;inset:0;background:${theme.heroOverlay}}
.hero-wrap{position:relative;z-index:1;max-width:1280px;margin:0 auto;padding:0 48px 100px;width:100%}
.hero-eyebrow{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:99px;padding:6px 16px;font-size:0.72rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.85);margin-bottom:28px;animation:fadeUp 1s ease}
.hero-dot{width:6px;height:6px;border-radius:50%;background:var(--accent)}
.hero h1{font-family:var(--serif);font-size:clamp(3.5rem,7vw,7rem);font-weight:${theme.font==='Inter'?'800':'900'};line-height:1.0;letter-spacing:-0.03em;color:#fff;margin-bottom:28px;animation:fadeUp 1s ease 0.15s both;max-width:820px}
.hero h1 em{color:var(--accent);font-style:italic}
.hero-sub{font-size:clamp(1rem,1.8vw,1.25rem);color:rgba(255,255,255,0.75);line-height:1.85;max-width:520px;margin-bottom:48px;animation:fadeUp 1s ease 0.25s both;font-weight:300}
.hero-actions{display:flex;gap:16px;flex-wrap:wrap;animation:fadeUp 1s ease 0.35s both}
.btn-hero{display:inline-flex;align-items:center;gap:10px;padding:18px 42px;border-radius:99px;font-weight:700;font-size:0.95rem;letter-spacing:-0.01em;transition:all 0.3s}
.btn-accent{background:var(--accent);color:#fff;box-shadow:0 8px 32px ${theme.accent}50}
.btn-accent:hover{transform:translateY(-3px);box-shadow:0 16px 48px ${theme.accent}65;color:#fff}
.btn-ghost{background:rgba(255,255,255,0.1);color:#fff;border:1.5px solid rgba(255,255,255,0.3);backdrop-filter:blur(8px)}
.btn-ghost:hover{background:rgba(255,255,255,0.2);color:#fff}
.hero-data{display:flex;gap:56px;margin-top:72px;padding-top:48px;border-top:1px solid rgba(255,255,255,0.1);flex-wrap:wrap;animation:fadeUp 1s ease 0.45s both}
.hero-stat span:first-child{display:block;font-family:var(--serif);font-size:3rem;font-weight:700;color:#fff;line-height:1;letter-spacing:-0.04em}
.hero-stat span:last-child{display:block;font-size:0.7rem;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.1em;margin-top:6px}

/* ── TRUST STRIP ── */
.trust-strip{background:var(--accent);padding:16px 32px}
.trust-inner{max-width:1280px;margin:0 auto;display:flex;justify-content:center;align-items:center;gap:48px;flex-wrap:wrap}
.trust-item{display:flex;align-items:center;gap:8px;font-size:0.8rem;font-weight:700;color:${theme.accent==="#D4AF37"?"#000":"#fff"};letter-spacing:0.02em}
.trust-icon{font-size:1.1rem}

/* ── SECTION BASE ── */
.section{padding:112px 32px}
.container{max-width:1280px;margin:0 auto}
.section-label{font-size:0.7rem;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);margin-bottom:14px}
.section-title{font-family:var(--serif);font-size:clamp(2.2rem,4.5vw,4rem);font-weight:${theme.font==='Inter'?'800':'700'};letter-spacing:-0.03em;line-height:1.1;color:var(--text);margin-bottom:20px}
.section-title em{color:var(--accent);font-style:italic}
.section-body{font-size:1.05rem;color:var(--muted);line-height:1.9;max-width:600px;font-weight:300}

/* ── SERVICES ── */
.services-section{background:${darkBg?'rgba(255,255,255,0.03)':theme.bg}}
.services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:72px;border-radius:24px;overflow:hidden}
.svc{background:${darkBg?'rgba(255,255,255,0.04)':theme.light};padding:48px 40px;transition:all 0.4s;position:relative;overflow:hidden}
.svc::after{content:'';position:absolute;inset:0;background:var(--accent);opacity:0;transition:opacity 0.4s}
.svc:hover::after{opacity:0.04}
.svc:hover{transform:translateY(-4px)}
.svc-icon{font-size:2.8rem;margin-bottom:24px;display:block}
.svc-name{font-family:var(--serif);font-size:1.4rem;font-weight:700;color:var(--text);margin-bottom:12px;letter-spacing:-0.02em;line-height:1.2}
.svc-desc{font-size:0.9rem;color:var(--muted);line-height:1.8;margin-bottom:20px;font-weight:300}
.svc-price{font-size:0.8rem;font-weight:800;color:var(--accent);letter-spacing:0.06em;text-transform:uppercase}
.svc:nth-child(2){background:var(--primary)}
.svc:nth-child(2) .svc-name,.svc:nth-child(2) .svc-price{color:#fff}
.svc:nth-child(2) .svc-desc{color:rgba(255,255,255,0.65)}
.svc:nth-child(2) .svc-price{color:var(--accent)}

/* ── FEATURE SPLIT ── */
.feature{background:${darkBg?theme.dark:theme.bg}}
.feature-grid{display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:680px;border-radius:32px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,0.15)}
.feature-img{position:relative;overflow:hidden}
.feature-img img{width:100%;height:100%;object-fit:cover;transition:transform 8s ease}
.feature-img:hover img{transform:scale(1.05)}
.feature-copy{background:var(--primary);padding:80px 64px;display:flex;flex-direction:column;justify-content:center}
.feature-copy .section-label{color:var(--accent)}
.feature-copy .section-title{color:#fff}
.feature-copy .section-body{color:rgba(255,255,255,0.65);max-width:100%;margin-bottom:40px}
.why-list{display:flex;flex-direction:column;gap:28px;margin-top:40px}
.why-item{display:flex;gap:18px;align-items:flex-start}
.why-num{width:40px;height:40px;border-radius:12px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:1rem;font-weight:700;color:var(--accent);flex-shrink:0}
.why-text h4{font-size:0.95rem;font-weight:700;color:#fff;margin-bottom:4px;letter-spacing:-0.01em}
.why-text p{font-size:0.85rem;color:rgba(255,255,255,0.55);line-height:1.7;font-weight:300}

/* ── GALLERY ── */
.gallery-section{padding:0;background:${darkBg?'#000':theme.primary};overflow:hidden}
.gallery-mosaic{display:grid;grid-template-columns:2fr 1fr 1fr;grid-template-rows:320px 320px;gap:3px}
.gallery-mosaic img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.6s cubic-bezier(.16,1,.3,1),filter 0.6s}
.gallery-mosaic img:hover{transform:scale(1.04);filter:brightness(1.1)}
.gallery-mosaic img:first-child{grid-row:span 2}

/* ── REVIEWS ── */
.reviews-section{background:${darkBg?theme.dark:theme.primary};padding:112px 32px}
.reviews-inner{max-width:1280px;margin:0 auto}
.review-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:64px}
.review-card{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);border-radius:24px;padding:40px;transition:all 0.3s}
.review-card:hover{background:rgba(255,255,255,0.09);transform:translateY(-4px)}
.review-stars{font-size:0.9rem;color:#FBBF24;margin-bottom:20px;letter-spacing:2px}
.review-quote{font-family:var(--serif);font-size:1.15rem;color:#fff;line-height:1.7;font-style:italic;margin-bottom:28px;font-weight:400}
.review-sep{width:32px;height:2px;background:var(--accent);margin-bottom:20px;border-radius:2px}
.review-author-name{font-size:0.85rem;font-weight:700;color:#fff}
.review-author-loc{font-size:0.75rem;color:rgba(255,255,255,0.4);margin-top:3px}

/* ── CTA BANNER ── */
.cta-banner{background:${theme.accent};padding:96px 32px;text-align:center}
.cta-banner h2{font-family:var(--serif);font-size:clamp(2.5rem,5vw,5rem);font-weight:700;letter-spacing:-0.04em;line-height:1.05;color:${['#D4AF37','#FBBF24','#F59E0B','#22C55E','#EC4899','#D946EF'].includes(theme.accent)?'#fff':'#fff'};margin-bottom:20px}
.cta-banner p{font-size:1.1rem;color:rgba(255,255,255,0.8);margin-bottom:48px;line-height:1.7}
.btn-dark{display:inline-flex;align-items:center;gap:10px;background:var(--primary);color:#fff;padding:20px 48px;border-radius:99px;font-weight:800;font-size:1rem;letter-spacing:-0.02em;transition:all 0.3s;box-shadow:0 8px 32px rgba(0,0,0,0.25)}
.btn-dark:hover{transform:translateY(-3px);box-shadow:0 16px 48px rgba(0,0,0,0.3);color:#fff}

/* ── CONTACT ── */
.contact-section{background:${darkBg?theme.dark:theme.bg};padding:112px 32px}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start}
.contact-list{display:flex;flex-direction:column;gap:20px;margin-top:48px}
.contact-row{display:flex;gap:16px;align-items:center}
.contact-icon{width:52px;height:52px;border-radius:16px;background:${darkBg?'rgba(255,255,255,0.06)':theme.light};border:1px solid ${darkBg?'rgba(255,255,255,0.1)':theme.accent+'22'};display:flex;align-items:center;justify-content:center;font-size:1.3rem;flex-shrink:0}
.contact-label{font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:3px}
.contact-val{font-size:1rem;font-weight:700;color:var(--text)}
.map-wrap{border-radius:24px;overflow:hidden;height:380px;background:${darkBg?'rgba(255,255,255,0.04)':theme.light};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;border:1px solid ${darkBg?'rgba(255,255,255,0.08)':theme.accent+'22'}}
.map-pin{font-size:3.5rem}
.map-name{font-family:var(--serif);font-size:1.1rem;font-weight:700;color:var(--text)}
.map-link{font-size:0.85rem;font-weight:700;color:var(--accent);display:inline-flex;align-items:center;gap:6px}

/* ── FOOTER ── */
footer{background:${darkBg?'#000':'#0F172A'};padding:56px 32px 32px}
.footer-wrap{max-width:1280px;margin:0 auto}
.footer-top{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:40px;border-bottom:1px solid rgba(255,255,255,0.07);flex-wrap:wrap;gap:28px}
.footer-brand-name{font-family:var(--serif);font-size:1.6rem;font-weight:700;color:#fff;letter-spacing:-0.02em}
.footer-tagline{font-size:0.82rem;color:rgba(255,255,255,0.35);margin-top:6px;font-style:italic}
.footer-nav{display:flex;gap:32px}
.footer-nav a{font-size:0.82rem;color:rgba(255,255,255,0.45);font-weight:500;transition:color 0.2s}
.footer-nav a:hover{color:var(--accent)}
.footer-bottom{display:flex;justify-content:space-between;padding-top:28px;flex-wrap:wrap;gap:12px}
.footer-copy{font-size:0.75rem;color:rgba(255,255,255,0.2)}
.footer-akus a{font-size:0.72rem;color:rgba(255,255,255,0.3);font-weight:600}
.footer-akus a:hover{color:var(--accent)}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .services-grid,.review-grid{grid-template-columns:1fr}
  .feature-grid,.contact-grid{grid-template-columns:1fr}
  .gallery-mosaic{grid-template-columns:1fr 1fr;grid-template-rows:auto}
  .gallery-mosaic img:first-child{grid-row:span 1}
  .hero-data{gap:28px}
  nav .nav-links{display:none}
  .hero-wrap{padding:0 24px 80px}
}
@media(max-width:600px){
  .section{padding:72px 20px}
  .hero h1{font-size:3rem}
  .hero-data{display:none}
  .services-grid{gap:12px}
  .svc{padding:32px 28px}
  .trust-inner{gap:24px}
}
</style>
</head>
<body>

<nav id="nav">
  <div class="nav-wrap">
    <div class="nav-logo">${biz}</div>
    <div class="nav-links">
      <a href="#services">${theme.services_title}</a>
      <a href="#about">Our Story</a>
      <a href="#reviews">Reviews</a>
      <a href="#contact" class="nav-book">${theme.cta}</a>
    </div>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-img"></div>
  <div class="hero-overlay"></div>
  <div class="hero-wrap">
    <div class="hero-eyebrow"><span class="hero-dot"></span> ${suburb}, Australia</div>
    <h1>${c.headline}</h1>
    <p class="hero-sub">${c.subline}</p>
    <div class="hero-actions">
      <a href="#contact" class="btn-hero btn-accent">${theme.cta} →</a>
      <a href="#services" class="btn-hero btn-ghost">See ${theme.services_title}</a>
    </div>
    <div class="hero-data">
      <div class="hero-stat"><span>5.0 ★</span><span>Google Rating</span></div>
      <div class="hero-stat"><span>100%</span><span>Local & Independent</span></div>
      <div class="hero-stat"><span>${suburb}</span><span>Proudly Serving</span></div>
    </div>
  </div>
</section>

<!-- TRUST STRIP -->
<div class="trust-strip">
  <div class="trust-inner">
    <div class="trust-item"><span class="trust-icon">✓</span> Locally owned & operated</div>
    <div class="trust-item"><span class="trust-icon">✓</span> Proudly serving ${suburb}</div>
    <div class="trust-item"><span class="trust-icon">✓</span> 5-star rated on Google</div>
    <div class="trust-item"><span class="trust-icon">✓</span> No lock-in contracts</div>
  </div>
</div>

<!-- SERVICES -->
<section class="section services-section" id="services">
  <div class="container">
    <div class="fade-up">
      <div class="section-label">${theme.services_title}</div>
      <h2 class="section-title">What we <em>do best</em></h2>
    </div>
    <div class="services-grid">
      ${(c.services||[]).map(s=>`
      <div class="svc fade-up">
        <span class="svc-icon">${s.icon}</span>
        <h3 class="svc-name">${s.name}</h3>
        <p class="svc-desc">${s.desc}</p>
        <div class="svc-price">From ${s.price}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- GALLERY MOSAIC -->
<div class="gallery-section">
  <div class="gallery-mosaic">
    ${[hero,...gallery].slice(0,5).map(url=>`<img src="${url}" alt="${biz}" loading="lazy">`).join('')}
  </div>
</div>

<!-- FEATURE SPLIT — About + Why Us -->
<section class="section feature" id="about">
  <div class="container">
    <div class="feature-grid">
      <div class="feature-img">
        <img src="${gallery[0]||hero}" alt="${biz} team" loading="lazy">
      </div>
      <div class="feature-copy">
        <div class="section-label">Our Story</div>
        <h2 class="section-title" style="color:#fff;font-size:clamp(1.8rem,3vw,3rem)">About <em>${biz}</em></h2>
        <p class="section-body">${c.about}</p>
        <div class="why-list">
          <div class="why-item fade-up">
            <div class="why-num">1</div>
            <div class="why-text"><h4>${c.why1_title}</h4><p>${c.why1_desc}</p></div>
          </div>
          <div class="why-item fade-up delay-1">
            <div class="why-num">2</div>
            <div class="why-text"><h4>${c.why2_title}</h4><p>${c.why2_desc}</p></div>
          </div>
          <div class="why-item fade-up delay-2">
            <div class="why-num">3</div>
            <div class="why-text"><h4>${c.why3_title}</h4><p>${c.why3_desc}</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- REVIEWS -->
<section class="reviews-section" id="reviews">
  <div class="reviews-inner">
    <div class="fade-up" style="text-align:center;margin-bottom:0">
      <div class="section-label" style="color:var(--accent)">Customer Reviews</div>
      <h2 class="section-title" style="color:#fff;text-align:center">What ${suburb} locals say</h2>
    </div>
    <div class="review-grid">
      ${[
        {q:`"${c.testimonial}"`,n:c.testimonial_name,l:suburb},
        {q:`"Absolutely the best in ${suburb}. I've recommended ${biz} to everyone I know — they never disappoint."`,n:'James T.',l:suburb},
        {q:`"Professional, warm, and genuinely passionate about what they do. ${biz} is a true gem in our community."`,n:'Michelle K.',l:suburb},
      ].map(r=>`
      <div class="review-card fade-up">
        <div class="review-stars">★★★★★</div>
        <p class="review-quote">${r.q}</p>
        <div class="review-sep"></div>
        <div class="review-author-name">${r.n}</div>
        <div class="review-author-loc">📍 ${r.l}</div>
      </div>`).join('')}
    </div>
  </div>
</section>

<!-- CTA BANNER -->
<section class="cta-banner">
  <div class="fade-up">
    <h2>${c.cta}</h2>
    <p>We'd love to have you. Get in touch today — we're always happy to chat.</p>
    <a href="#contact" class="btn-dark">${theme.cta} →</a>
  </div>
</section>

<!-- CONTACT -->
<section class="contact-section" id="contact">
  <div class="container">
    <div class="contact-grid">
      <div class="fade-up">
        <div class="section-label">Find Us</div>
        <h2 class="section-title">Get in <em>touch</em></h2>
        <p class="section-body">We're based in ${suburb} and love hearing from locals. Drop us a line anytime.</p>
        <div class="contact-list">
          <div class="contact-row">
            <div class="contact-icon">📍</div>
            <div><div class="contact-label">Location</div><div class="contact-val">${suburb}, Australia</div></div>
          </div>
          <div class="contact-row">
            <div class="contact-icon">📞</div>
            <div><div class="contact-label">Phone</div><div class="contact-val">Contact us for details</div></div>
          </div>
          <div class="contact-row">
            <div class="contact-icon">🕐</div>
            <div><div class="contact-label">Hours</div><div class="contact-val">Contact us for hours</div></div>
          </div>
        </div>
      </div>
      <div class="map-wrap fade-up delay-2">
        <div class="map-pin">📍</div>
        <div class="map-name">${biz}</div>
        <p style="font-size:0.85rem;color:var(--muted);text-align:center;padding:0 24px">Located in the heart of ${suburb}</p>
        <a href="https://maps.google.com/?q=${encodeURIComponent(biz+' '+suburb+' Australia')}" target="_blank" class="map-link">Open in Google Maps ↗</a>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-wrap">
    <div class="footer-top">
      <div>
        <div class="footer-brand-name">${biz}</div>
        <div class="footer-tagline">${c.tagline||`Proudly serving ${suburb} and surrounds`}</div>
      </div>
      <nav class="footer-nav">
        <a href="#services">${theme.services_title}</a>
        <a href="#about">About</a>
        <a href="#reviews">Reviews</a>
        <a href="#contact">Contact</a>
      </nav>
    </div>
    <div class="footer-bottom">
      <div class="footer-copy">© ${new Date().getFullYear()} ${biz} · ${suburb}, Australia · All rights reserved</div>
      <div class="footer-akus"><a href="https://akus.com.au" target="_blank">Website by ⚡ Akus</a></div>
    </div>
  </div>
</footer>

<script>
const nav = document.getElementById('nav');
window.addEventListener('scroll',()=>{nav.classList.toggle('solid',window.scrollY>60)},{passive:true});
const fades = document.querySelectorAll('.fade-up');
const obs = new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');obs.unobserve(e.target);}});
},{threshold:0.06,rootMargin:'0px 0px -40px 0px'});
fades.forEach(el=>obs.observe(el));
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click',e=>{
    const t=document.querySelector(a.getAttribute('href'));
    if(t){e.preventDefault();const y=t.getBoundingClientRect().top+window.scrollY-76;window.scrollTo({top:y,behavior:'smooth'});}
  });
});
</script>
</body>
</html>`;

    // ── Deploy to Vercel ───────────────────────────────────────────────────
    const deployRes = await fetch('https://api.vercel.com/v13/deployments',{
      method:'POST',
      headers:{'Authorization':`Bearer ${VERCEL_TOKEN}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        name:`akus-demo-${slug}`,
        files:[{file:'index.html',data:Buffer.from(html).toString('base64'),encoding:'base64'}],
        projectSettings:{framework:null},
        target:'production',
      })
    });
    const deployData = await deployRes.json();
    if(deployData.error) throw new Error(deployData.error.message);

    const projectName = `akus-demo-${slug}`;
    const liveUrl = `https://${deployData.alias?.[0]||deployData.url}`;

    // Disable deployment protection on the new project so it's publicly accessible
    try {
      await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
        method: 'PATCH',
        headers: {'Authorization':`Bearer ${VERCEL_TOKEN}`,'Content-Type':'application/json'},
        body: JSON.stringify({ ssoProtection: null, vercelAuthentication: null })
      });
    } catch(e) {
      console.log('Could not disable protection:', e.message);
    }

    return res.status(200).json({success:true,url:liveUrl,html});

  } catch(err){
    console.error('Demo error:',err);
    return res.status(500).json({error:err.message});
  }
}
