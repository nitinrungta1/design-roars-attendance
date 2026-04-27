import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatCurrencyRange,
  getCurrencyParts,
  CURRENCY_META,
  LOCALE_BY_CURRENCY,
  CURRENCY_LIST,
} from "@/lib/currency";
import { SUPPORTED_CURRENCIES } from "@/lib/fx.functions";

// Strip Unicode bidi/space marks so test assertions stay readable across
// Node ICU builds (Intl emits NBSP/RLM around Arabic & EU symbols).
const normalize = (s: string) =>
  s.replace(/[\u00a0\u202f\u200e\u200f]/g, " ").trim();

describe("formatCurrency", () => {
  it("formats USD with $ prefix and 2 decimals", () => {
    const out = normalize(formatCurrency(99, "USD"));
    expect(out).toBe("$99.00");
  });

  it("formats INR with ₹ symbol and zero decimals (Indian grouping)", () => {
    const out = normalize(formatCurrency(100000, "INR"));
    // Indian locale groups as 1,00,000 — also lets ₹ or "INR" symbol be valid
    expect(out).toMatch(/^(₹|INR\s?)1,00,000$/);
  });

  it("formats EUR with German grouping and trailing symbol", () => {
    const out = normalize(formatCurrency(1380, "EUR"));
    // de-DE: "1.380,00 €"
    expect(out).toMatch(/1\.380,00\s?€/);
  });

  it("formats JPY with no decimals", () => {
    const out = normalize(formatCurrency(14949, "JPY"));
    expect(out).toMatch(/^[¥￥]14,949$/);
  });

  it("formats KWD with 3 decimals", () => {
    const out = normalize(formatCurrency(3.1, "KWD"));
    // ar-KW renders Arabic-Indic digits (٣٫١٠٠) with the dinar sign.
    // Assert the structure: 3 fractional digits + KWD symbol present.
    expect(out).toMatch(/[\d٠-٩]+[.,٫][\d٠-٩]{3}/);
    expect(out).toMatch(/د\.ك/);
  });

  it("withSymbol=false strips the currency symbol", () => {
    const out = normalize(formatCurrency(99, "USD", { withSymbol: false }));
    expect(out).toBe("99.00");
    expect(out).not.toContain("$");
  });

  it("compact notation produces short forms", () => {
    const out = normalize(formatCurrency(12000, "USD", { compact: true }));
    // Either "$12K" or "$12 K" depending on ICU build
    expect(out.replace(/\s/g, "")).toMatch(/^\$12K$/);
  });

  it("respects custom decimals override", () => {
    const out = normalize(formatCurrency(99.5, "USD", { decimals: 0 }));
    expect(out).toMatch(/^\$(99|100)$/);
  });

  it("never throws for any supported currency", () => {
    for (const c of SUPPORTED_CURRENCIES) {
      expect(() => formatCurrency(123.45, c)).not.toThrow();
      expect(formatCurrency(123.45, c)).toBeTruthy();
    }
  });
});

describe("formatCurrencyRange", () => {
  it("formats a USD range", () => {
    const out = normalize(formatCurrencyRange(10, 50, "USD"));
    // Either $10.00–$50.00 (formatRange) or $10.00 – $50.00 fallback
    expect(out).toMatch(/\$10\.00.+\$50\.00/);
  });

  it("formats an INR range with Indian grouping", () => {
    const out = normalize(formatCurrencyRange(10000, 100000, "INR"));
    expect(out).toContain("10,000");
    expect(out).toContain("1,00,000");
  });
});

describe("getCurrencyParts", () => {
  it("splits USD 99 into symbol + integer + fraction", () => {
    const parts = getCurrencyParts(99, "USD");
    expect(parts.symbol).toBe("$");
    expect(parts.integer).toBe("99");
    expect(parts.decimal).toBe(".");
    expect(parts.fraction).toBe("00");
    expect(parts.currency).toBe("USD");
  });

  it("splits INR 100000 with Indian grouping and no fraction", () => {
    const parts = getCurrencyParts(100000, "INR");
    expect(parts.integer).toBe("1,00,000");
    expect(parts.fraction).toBe("");
  });

  it("works for every supported currency without throwing", () => {
    for (const c of SUPPORTED_CURRENCIES) {
      expect(() => getCurrencyParts(1234, c)).not.toThrow();
    }
  });
});

describe("currency metadata", () => {
  it("CURRENCY_META has an entry for every supported currency", () => {
    for (const c of SUPPORTED_CURRENCIES) {
      expect(CURRENCY_META[c]).toBeDefined();
      expect(CURRENCY_META[c].code).toBe(c);
    }
  });

  it("LOCALE_BY_CURRENCY has a BCP-47 locale for every currency", () => {
    for (const c of SUPPORTED_CURRENCIES) {
      const locale = LOCALE_BY_CURRENCY[c];
      expect(locale).toMatch(/^[a-z]{2,3}-[A-Z]{2}$/);
    }
  });

  it("CURRENCY_LIST is in the same order as SUPPORTED_CURRENCIES", () => {
    expect(CURRENCY_LIST.map((c) => c.code)).toEqual([...SUPPORTED_CURRENCIES]);
  });

  it("INR/JPY/KRW/VND/IDR are zero-decimal currencies", () => {
    expect(CURRENCY_META.INR.decimals).toBe(0);
    expect(CURRENCY_META.JPY.decimals).toBe(0);
    expect(CURRENCY_META.KRW.decimals).toBe(0);
    expect(CURRENCY_META.VND.decimals).toBe(0);
    expect(CURRENCY_META.IDR.decimals).toBe(0);
  });

  it("KWD/BHD/OMR are three-decimal currencies (Gulf dinar standard)", () => {
    expect(CURRENCY_META.KWD.decimals).toBe(3);
    expect(CURRENCY_META.BHD.decimals).toBe(3);
    expect(CURRENCY_META.OMR.decimals).toBe(3);
  });
});
