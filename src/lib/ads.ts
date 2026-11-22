/**
 * Google AdSense configuration.
 *
 * Ads are off unless `VITE_ADSENSE_CLIENT` is set at build time (e.g. "ca-pub-1234567890123456").
 * The publisher ID is public (it appears in page source and ads.txt), so it is safe to set as a
 * GitHub Actions repository variable rather than a secret.
 *
 * - Client only: the AdSense script loads, so Auto ads (configured in the AdSense dashboard) work.
 * - Client + slot IDs: the fixed `AdSlot` placements render manual responsive display units.
 */
const env = import.meta.env;

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

const rawClient = clean(env.VITE_ADSENSE_CLIENT);

export const ADSENSE_CLIENT = /^ca-pub-\d{10,20}$/.test(rawClient) ? rawClient : "";

export const ADSENSE_SLOTS = {
  header: clean(env.VITE_ADSENSE_SLOT_HEADER),
  belowResult: clean(env.VITE_ADSENSE_SLOT_BELOW_RESULT),
} as const;

export type AdPlacement = keyof typeof ADSENSE_SLOTS;

export const ADS_ENABLED = ADSENSE_CLIENT !== "";

export const ADSENSE_SCRIPT_SRC = ADS_ENABLED
  ? `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`
  : "";
