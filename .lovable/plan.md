## Goal

1. **Fix the active SSR runtime error** — `CurrencyProvider` calls `useQuery` during SSR but `QueryClientProvider` lives only in `RootComponent` (client tree). Move providers into the shell so SSR works.
2. **Upgrade currency formatting to true i18n** using `Intl.NumberFormat` with `style: "currency"` + locale-per-currency. This automatically handles symbol placement, grouping (e.g. `1,00,000` for INR, `1.000,00` for EUR), RTL marks for AED/SAR, JPY/KRW/VND no-decimal rules, and proper minor-unit rounding from CLDR.
3. **Add a real test suite** (Vitest + JSDOM + Testing Library) covering FX conversion, locale formatting per region, IP-based detection fallbacks, persistence, and the switcher UI.

---

## Batch 1 — SSR provider fix (root cause of current runtime error)

**File:** `src/routes/__root.tsx`

- Move `QueryClientProvider`, `AuthProvider`, `CurrencyProvider` into `RootShell` so they wrap children during SSR (currently only `RootComponent` has them, but the shell renders first and `CurrencyProvider` is invoked before the QueryClient exists).
- Keep the `useState(() => new QueryClient(...))` pattern so each request gets its own client (no cross-tenant leakage).
- `RootComponent` becomes a thin `<Outlet />` only.

---

## Batch 2 — i18n-grade formatting in `src/lib/currency.tsx`

**Add** a `LOCALE_BY_CURRENCY` map (e.g. `INR → en-IN`, `EUR → de-DE`, `JPY → ja-JP`, `AED → ar-AE`, `BRL → pt-BR`, `CHF → de-CH`, `KRW → ko-KR`, `RUB → ru-RU`, etc. — all 49 currencies covered with sensible defaults).

**Rewrite `format()`** to use:
```ts
new Intl.NumberFormat(locale, {
  style: "currency",
  currency,
  currencyDisplay: opts?.compact ? "narrowSymbol" : "symbol",
  minimumFractionDigits: meta.decimals,
  maximumFractionDigits: meta.decimals,
}).format(convert(usdAmount));
```

**Add helpers:**
- `formatCompact(usd)` → uses `notation: "compact"` for `$1.2K`, `₹1.2L` style.
- `formatRange(min, max)` → `Intl.NumberFormat.formatRange` for pricing tiers.
- `parts(usd)` → returns `{ symbol, integer, fraction, currency }` for custom layouts (large hero pricing).
- Keep the existing `withSymbol: false` option mapped onto `currencyDisplay: "code"` stripped, for cases where the symbol is rendered separately.

**Edge handling:**
- Fall back gracefully when `Intl` lacks a currency (wrap in try/catch → return manual `${symbol}${number}`).
- Respect server-detected locale: if `detectCurrencyFromIp` returns a country, store it and prefer the country-matching locale over the heuristic map.

---

## Batch 3 — Wire compact + range formatting into the marketing surface

- `src/routes/pricing.tsx` — switch hero numerals to `parts()` so the symbol can sit visually separated from the integer block (existing design intent).
- `src/components/home/sections.tsx` — pricing teaser uses `formatCompact` for the "from $X/user" line.
- `src/components/brand/currency-switcher.tsx` — show preview formatted price (e.g. `₹4,999`) next to each option using the live rate.

---

## Batch 4 — Test infrastructure

**Add dev deps:**
```
bun add -d vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom happy-dom @vitejs/plugin-react
```

**Files:**
- `vitest.config.ts` — JSDOM env, alias `@/` → `src/`, setup file.
- `src/test/setup.ts` — `@testing-library/jest-dom`, `localStorage` polyfill clean-up between tests, mock `fetch` for FX provider.
- `package.json` — add `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:ui": "vitest --ui"`.

---

## Batch 5 — Currency test suite

**`src/lib/__tests__/currency.format.test.ts`** — pure formatting, no React:
- `format(99)` in **USD** → `"$99.00"`.
- `format(99)` in **INR** with rate 83.3 → `"₹8,247"` (zero decimals, Indian grouping).
- `format(1500)` in **EUR** with rate 0.92 → `"1.380,00 €"` (German grouping, trailing symbol).
- `format(99)` in **JPY** rate 151 → `"¥14,949"` (no decimals).
- `format(10)` in **KWD** rate 0.31 → `"3.100 د.ك"` (3 decimals).
- `formatCompact(12000)` USD → `"$12K"`, INR → `"₹10L"` (Indian numbering compact).
- `formatRange(10, 50)` USD → `"$10.00 – $50.00"`.
- Fallback: when `Intl.NumberFormat` throws for an unknown currency, manual symbol path returns `"${symbol}${value}"`.

**`src/lib/__tests__/currency.convert.test.ts`** — math:
- `convert` with no rates returns the USD amount unchanged.
- Conversion uses the active currency's rate.
- Rounding rules per `decimals` (KWD 3, INR 0, JPY 0, USD 2).

**`src/lib/__tests__/fx.functions.test.ts`** — server fn (mocked `fetch`):
- Successful provider response is cached for ~1 hour (second call doesn't refetch).
- Provider failure returns `FALLBACK_RATES` and short cache window (5 min).
- `detectCurrencyFromIp` returns `INR` for `CF-IPCountry: IN`, `EUR` for `DE`, `USD` default for missing/`XX`/`T1`.
- EU-member mapping (`FR`, `IT`, `ES`, `NL`, …) all resolve to `EUR`.

**`src/lib/__tests__/currency.provider.test.tsx`** — React hook (Testing Library + QueryClient wrapper):
- Hydrates from `localStorage` on mount.
- Falls back to IP detection when no saved value.
- `setCurrency()` persists to `localStorage` and flips `isUserSelected = true`.
- IP detection does NOT override an explicit user selection.
- `format()` reactivity — switching currency re-renders new formatted string.

**`src/components/brand/__tests__/currency-switcher.test.tsx`** — UI:
- Renders active flag + code.
- Search filters by code/name/symbol.
- Selecting an option calls `setCurrency` and closes popover.
- Active row shows the check icon.

---

## Out of scope (explicit)

- No translation of UI copy (separate i18n batch). This focuses solely on **currency** i18n.
- No backend pricing changes — base prices remain USD; conversion happens at render.
- No new server fn for locale detection beyond what `detectCurrencyFromIp` already exposes.

---

## Definition of done

- `bun run test` passes with all suites green.
- Preview page loads with no `No QueryClient set` SSR error.
- Visiting pricing from an Indian IP renders `₹` with Indian digit grouping (e.g. `₹8,250`); from a German IP renders `1.380,00 €`; from US renders `$99.00`.
- Currency switcher reflects the change instantly across home, pricing, and admin billing surfaces.
