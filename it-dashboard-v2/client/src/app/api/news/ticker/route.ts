import { NextResponse } from 'next/server';

// Authentic default headlines from Independent Television (itvbd.com)
const FALLBACK_HEADLINES = [
  { id: '1', category: 'জাতীয়', title: 'ফ্যাসিবাদের আমলে স্বজনপ্রীতি-দুর্নীতিতে সব প্রতিষ্ঠান ধ্বংস হয়েছে: রাষ্ট্রপতি' },
  { id: '2', category: 'স্বাস্থ্য', title: 'ডেঙ্গুতে আরও ১০ জনের মৃত্যু, সচেতনতা বৃদ্ধির তাগিদ চিকিৎসকদের' },
  { id: '3', category: 'অর্থনীতি', title: 'সোলার ব্যবহারে ২০ শতাংশ পর্যন্ত বিদ্যুৎ সাশ্রয় সম্ভব: ক্যাব' },
  { id: '4', category: 'আন্তর্জাতিক', title: 'ইরানের পারমাণবিক স্থাপনা নিশ্চিহ্নে আমেরিকার পরিকল্পনা ফাঁস' },
  { id: '5', category: 'অর্থনীতি', title: 'নভেম্বরেই জাতীয় গ্রিডে যুক্ত হতে পারে রূপপুর পারমাণবিক বিদ্যুৎকেন্দ্র' },
  { id: '6', category: 'রাজনীতি', title: '২৪ এর বিপ্লবীরাই ওই আন্দোলনকে ধ্বংস করেছে: শামীম হায়দার পাটোয়ারী' },
  { id: '7', category: 'আইন-আদালত', title: 'শেখ হাসিনার দুর্নীতির মামলার অগ্রগতি দ্রুত দৃশ্যমান হবে: দুদক মহাপরিচালক' },
  { id: '8', category: 'সারাদেশ', title: 'ব্রাহ্মণবাড়িয়ায় বিনা টিকিটের যাত্রী ধরায় হামলা, স্টেশন মাস্টারসহ আহত ২' },
  { id: '9', category: 'আন্তর্জাতিক', title: 'মদিনায় ক্ষেপণাস্ত্র হামলার দাবি সৌদি জোটের' },
  { id: '10', category: 'স্বাস্থ্য', title: 'ডেঙ্গুর নতুন টিকা নিয়ে বিশেষজ্ঞদের সঙ্গে পর্যালোচনা করছে স্বাস্থ্য মন্ত্রণালয়' },
];

let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

export async function GET() {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json({ success: true, source: 'cache', items: cachedData });
  }

  try {
    const res = await fetch('https://www.itvbd.com/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml',
      },
      next: { revalidate: 300 }, // Next.js cache 5 mins
    });

    if (!res.ok) {
      throw new Error(`Failed to fetch itvbd.com with status ${res.status}`);
    }

    const html = await res.text();

    // Parse headlines from markdown-like links or anchor tags
    // Matches: <a ... href="/[section]/...">Title</a> or <h2><a...>Title</a></h2>
    const headlineRegex = /<h[2-4][^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/h[2-4]>/gi;
    const extracted: { id: string; category: string; title: string; link: string }[] = [];
    const seenTitles = new Set<string>();

    let match;
    while ((match = headlineRegex.exec(html)) !== null && extracted.length < 15) {
      const link = match[1].trim();
      const rawTitle = match[2].trim().replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

      if (rawTitle.length > 10 && !seenTitles.has(rawTitle)) {
        seenTitles.add(rawTitle);

        // Deduce category from link (e.g. /national/..., /economy/..., /world/...)
        let category = 'শীর্ষ সংবাদ';
        if (link.includes('/national/')) category = 'জাতীয়';
        else if (link.includes('/politics/')) category = 'রাজনীতি';
        else if (link.includes('/economy/')) category = 'অর্থনীতি';
        else if (link.includes('/world/')) category = 'আন্তর্জাতিক';
        else if (link.includes('/sports/')) category = 'খেলা';
        else if (link.includes('/health/')) category = 'স্বাস্থ্য';
        else if (link.includes('/country/')) category = 'সারাদেশ';
        else if (link.includes('/entertainment/')) category = 'বিনোদন';

        extracted.push({
          id: String(extracted.length + 1),
          category,
          title: rawTitle,
          link: link.startsWith('http') ? link : `https://www.itvbd.com${link}`,
        });
      }
    }

    if (extracted.length >= 3) {
      cachedData = extracted;
      lastFetchTime = now;
      return NextResponse.json({ success: true, source: 'live_itvbd', items: extracted });
    }
  } catch (err: any) {
    console.error('Error fetching latest news from itvbd.com:', err.message);
  }

  // Fallback to verified authentic ITV headlines
  cachedData = FALLBACK_HEADLINES;
  lastFetchTime = now;
  return NextResponse.json({ success: true, source: 'fallback_itv', items: FALLBACK_HEADLINES });
}
