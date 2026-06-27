import Constants from 'expo-constants';

// KLIPY GIF API — lifetime-free alternative to GIPHY/Tenor.
// Get a key at https://klipy.com/developers and set EXPO_PUBLIC_KLIPY_API_KEY.
// Read directly from process.env (Expo inlines EXPO_PUBLIC_* into app code,
// including values from .env.local) with a fallback to app.config extra.
// Without a key, the picker falls back to the small static set below.
const API_KEY =
  process.env.EXPO_PUBLIC_KLIPY_API_KEY ||
  Constants.expoConfig?.extra?.klipyApiKey ||
  null;
const BASE = 'https://api.klipy.com/api/v1';

// Static placeholder GIFs shown when no API key is configured.
export const GIF_FALLBACK = [
  'https://media.giphy.com/media/3oz8xLd9DJq2l2VFtu/giphy.gif',
  'https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif',
  'https://media.giphy.com/media/26gswgxiuwleotzra/giphy.gif',
  'https://media.giphy.com/media/JltOMwYmi0VrO/giphy.gif',
  'https://media.giphy.com/media/3o6Mb6jZdX5gwiS6Qg/giphy.gif',
  'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif',
  'https://media.giphy.com/media/SDogLD4FOZMM8/giphy.gif',
  'https://media.giphy.com/media/l3q2wJsC4ikq2QqeY/giphy.gif',
  'https://media.giphy.com/media/3og0IFrHkIglEOg8Ba/giphy.gif',
];

// KLIPY nests the URL as item.file.<size>.<format>.{url,width,height}, where
// size is sm/md/hd and format is gif/webp/jpg/mp4. Prefer a small animated
// gif, and capture its dimensions so callers can size it without cropping.
function pickMedia(item) {
  const file = item?.file ?? item?.files ?? item?.media;
  if (typeof file === 'string' && /^https?:/.test(file)) return { url: file };
  if (!file || typeof file !== 'object' || Array.isArray(file)) return null;

  const sizes = ['sm', 'md', 'hd'];
  const formats = ['gif', 'webp', 'jpg'];
  for (const size of sizes) {
    const block = file[size];
    if (block && typeof block === 'object') {
      for (const fmt of formats) {
        const entry = block[fmt];
        if (typeof entry === 'string' && /^https?:/.test(entry)) return { url: entry };
        if (entry?.url) return { url: entry.url, w: entry.width, h: entry.height };
      }
    }
  }
  // Last-resort deep scan (URL only).
  for (const k in file) {
    const v = file[k];
    if (typeof v === 'string' && /^https?:/.test(v)) return { url: v };
    if (v?.url) return { url: v.url };
    if (v && typeof v === 'object') {
      for (const k2 in v) {
        const vv = v[k2];
        if (typeof vv === 'string' && /^https?:/.test(vv)) return { url: vv };
        if (vv?.url) return { url: vv.url };
      }
    }
  }
  return null;
}

// KLIPY marks ad items with `type: "ad"` (regular GIFs are `type: "gif"`).
// Field names below are inferred from KLIPY's docs; adjust if their payload
// uses different keys once real ad items start arriving.
function isAdItem(item) {
  return (
    item?.type === 'ad' ||
    item?.is_ad === true ||
    item?.sponsored === true ||
    (item?.ad != null && typeof item.ad === 'object')
  );
}

function adMeta(item) {
  const ad = item?.ad && typeof item.ad === 'object' ? item.ad : item;
  return {
    clickUrl:
      ad?.click_url || ad?.clickUrl || ad?.landing_url || ad?.landingUrl || ad?.url || ad?.link || item?.click_url,
    impressionUrl:
      ad?.impression_url || ad?.impressionUrl || ad?.tracking_url || ad?.trackingUrl || ad?.beacon || item?.impression_url,
  };
}

function shapeItem(item) {
  const media = pickMedia(item);
  if (!media?.url) return null;
  const aspect = media.w && media.h ? media.w / media.h : undefined;
  if (!isAdItem(item)) return { url: media.url, isAd: false, aspect };
  const { clickUrl, impressionUrl } = adMeta(item);
  return { url: media.url, isAd: true, clickUrl, impressionUrl, aspect };
}

const fallbackItems = () => GIF_FALLBACK.map((url) => ({ url, isAd: false }));

// ── TEMP: mock ad for local testing ──────────────────────────────────────
// KLIPY only serves real ads after production access is approved, so this
// injects a fake ad item to test the badge + tap-to-open behavior now.
// Set MOCK_AD_DEBUG to false (or delete) once KLIPY serves real ads.
const MOCK_AD_DEBUG = false;
const MOCK_AD = {
  url: 'https://media.giphy.com/media/3o7TKMt1VVNkHV2PaE/giphy.gif',
  isAd: true,
  clickUrl: 'https://klipy.com',
  impressionUrl: 'https://www.example.com/impression-beacon',
};
const withMockAd = (items) => (MOCK_AD_DEBUG ? [MOCK_AD, ...items] : items);
// ─────────────────────────────────────────────────────────────────────────

/**
 * Returns an array of items: { url, isAd, clickUrl?, impressionUrl? }.
 * Trending when no query, search results otherwise. `options.customerId`
 * (unique user id) and the ad-size params are sent so KLIPY can serve +
 * personalize ads for monetization. Falls back to GIF_FALLBACK on error.
 */
export async function searchGifs(query, { customerId, adMaxWidth, adMaxHeight } = {}) {
  if (!API_KEY) return withMockAd(fallbackItems());

  const q = (query || '').trim();
  const path = q ? 'search' : 'trending';
  const params = new URLSearchParams({
    per_page: '30',
    rating: 'g',
    page: '1',
    // Ad slot size — required by KLIPY to serve ads.
    'ad-min-width': '50',
    'ad-max-width': String(adMaxWidth || 400),
    'ad-min-height': '50',
    'ad-max-height': String(adMaxHeight || 250),
  });
  if (q) params.set('q', q);
  if (customerId) params.set('customer_id', customerId);

  try {
    const res = await fetch(`${BASE}/${API_KEY}/gifs/${path}?${params.toString()}`);
    if (!res.ok) throw new Error(`KLIPY ${res.status}`);
    const json = await res.json();
    const items = json?.data?.data || json?.data || [];
    const mapped = items.map(shapeItem).filter(Boolean);
    const result = mapped.length ? mapped : fallbackItems();
    return withMockAd(result);
  } catch (err) {
    console.error('KLIPY search failed, using fallback:', err);
    return withMockAd(fallbackItems());
  }
}

