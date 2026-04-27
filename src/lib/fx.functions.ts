import { createServerFn } from "@tanstack/react-start";

// Supported currencies — major + India default
export const SUPPORTED_CURRENCIES = [
  "USD", "EUR", "GBP", "INR", "AUD", "CAD", "SGD", "AED", "JPY", "CNY",
  "CHF", "SEK", "NOK", "DKK", "NZD", "ZAR", "BRL", "MXN", "HKD", "KRW",
  "IDR", "MYR", "PHP", "THB", "VND", "TRY", "PLN", "CZK", "HUF", "ILS",
  "SAR", "QAR", "KWD", "BHD", "OMR", "EGP", "NGN", "KES", "PKR", "BDT",
  "LKR", "NPR", "RUB", "UAH", "ARS", "CLP", "COP", "PEN", "TWD",
] as const;

export type Currency = (typeof SUPPORTED_CURRENCIES)[number];

export interface FxRates {
  base: "USD";
  rates: Record<string, number>;
  fetchedAt: string;
}

// Country → currency map (ISO-3166 alpha-2 → ISO-4217)
const COUNTRY_TO_CURRENCY: Record<string, Currency> = {
  US: "USD", IN: "INR", GB: "GBP", AU: "AUD", CA: "CAD", SG: "SGD",
  AE: "AED", JP: "JPY", CN: "CNY", CH: "CHF", SE: "SEK", NO: "NOK",
  DK: "DKK", NZ: "NZD", ZA: "ZAR", BR: "BRL", MX: "MXN", HK: "HKD",
  KR: "KRW", ID: "IDR", MY: "MYR", PH: "PHP", TH: "THB", VN: "VND",
  TR: "TRY", PL: "PLN", CZ: "CZK", HU: "HUF", IL: "ILS", SA: "SAR",
  QA: "QAR", KW: "KWD", BH: "BHD", OM: "OMR", EG: "EGP", NG: "NGN",
  KE: "KES", PK: "PKR", BD: "BDT", LK: "LKR", NP: "NPR", RU: "RUB",
  UA: "UAH", AR: "ARS", CL: "CLP", CO: "COP", PE: "PEN", TW: "TWD",
  // EU members → EUR
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", BE: "EUR",
  AT: "EUR", PT: "EUR", IE: "EUR", FI: "EUR", GR: "EUR", LU: "EUR",
  SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", CY: "EUR",
  MT: "EUR", HR: "EUR",
};

// In-memory cache (per Worker isolate) — refresh hourly
let cache: { data: FxRates; expiresAt: number } | null = null;
const CACHE_MS = 60 * 60 * 1000; // 1 hour

async function fetchRatesFromProvider(): Promise<FxRates> {
  // Free, no-key API — exchangerate.host (USD base)
  const symbols = SUPPORTED_CURRENCIES.join(",");
  const res = await fetch(
    `https://api.exchangerate.host/latest?base=USD&symbols=${symbols}`,
    { headers: { Accept: "application/json" } }
  );
  if (!res.ok) throw new Error(`FX provider error: ${res.status}`);
  const json = (await res.json()) as { rates?: Record<string, number> };
  if (!json.rates || typeof json.rates !== "object") {
    throw new Error("FX provider returned invalid payload");
  }
  return {
    base: "USD",
    rates: { USD: 1, ...json.rates },
    fetchedAt: new Date().toISOString(),
  };
}

// Fallback rates used if the provider is unreachable. Updated 2025-Q1 approximations.
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.3, AUD: 1.52, CAD: 1.36,
  SGD: 1.34, AED: 3.67, JPY: 151, CNY: 7.24, CHF: 0.88, SEK: 10.5,
  NOK: 10.7, DKK: 6.86, NZD: 1.65, ZAR: 18.7, BRL: 5.05, MXN: 17.0,
  HKD: 7.82, KRW: 1340, IDR: 15700, MYR: 4.72, PHP: 56.0, THB: 36.2,
  VND: 24800, TRY: 32.5, PLN: 3.97, CZK: 23.2, HUF: 365, ILS: 3.72,
  SAR: 3.75, QAR: 3.64, KWD: 0.31, BHD: 0.38, OMR: 0.38, EGP: 47.8,
  NGN: 1480, KES: 130, PKR: 278, BDT: 110, LKR: 305, NPR: 133, RUB: 92,
  UAH: 39.5, ARS: 870, CLP: 950, COP: 3950, PEN: 3.75, TWD: 31.8,
};

export const getFxRates = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.data;
  }
  try {
    const data = await fetchRatesFromProvider();
    cache = { data, expiresAt: now + CACHE_MS };
    return data;
  } catch (err) {
    console.error("FX fetch failed, using fallback:", err);
    const fallback: FxRates = {
      base: "USD",
      rates: FALLBACK_RATES,
      fetchedAt: new Date(0).toISOString(),
    };
    // Cache fallback briefly so we retry sooner
    cache = { data: fallback, expiresAt: now + 5 * 60 * 1000 };
    return fallback;
  }
});

export const detectCurrencyFromIp = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      // Cloudflare Workers expose CF-IPCountry directly
      const cfCountry = getRequestHeader("CF-IPCountry");
      if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
        const cur = COUNTRY_TO_CURRENCY[cfCountry.toUpperCase()];
        if (cur) return { country: cfCountry, currency: cur };
      }
      // Fallback: read forwarded country headers
      const country =
        getRequestHeader("x-vercel-ip-country") ||
        getRequestHeader("x-country-code") ||
        null;
      if (country) {
        const cur = COUNTRY_TO_CURRENCY[country.toUpperCase()];
        if (cur) return { country, currency: cur };
      }
    } catch (e) {
      console.error("IP currency detection failed:", e);
    }
    return { country: null as string | null, currency: "USD" as Currency };
  }
);
