import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  SUPPORTED_CURRENCIES,
  getFxRates,
  detectCurrencyFromIp,
  type Currency,
  type FxRates,
} from "@/lib/fx.functions";

const STORAGE_KEY = "oqlio.currency";

interface CurrencyMeta {
  code: Currency;
  symbol: string;
  name: string;
  flag: string;
  // How to round prices nicely in this currency
  decimals: number;
}

export const CURRENCY_META: Record<Currency, CurrencyMeta> = {
  USD: { code: "USD", symbol: "$",   name: "US Dollar",         flag: "🇺🇸", decimals: 2 },
  EUR: { code: "EUR", symbol: "€",   name: "Euro",              flag: "🇪🇺", decimals: 2 },
  GBP: { code: "GBP", symbol: "£",   name: "British Pound",     flag: "🇬🇧", decimals: 2 },
  INR: { code: "INR", symbol: "₹",   name: "Indian Rupee",      flag: "🇮🇳", decimals: 0 },
  AUD: { code: "AUD", symbol: "A$",  name: "Australian Dollar", flag: "🇦🇺", decimals: 2 },
  CAD: { code: "CAD", symbol: "C$",  name: "Canadian Dollar",   flag: "🇨🇦", decimals: 2 },
  SGD: { code: "SGD", symbol: "S$",  name: "Singapore Dollar",  flag: "🇸🇬", decimals: 2 },
  AED: { code: "AED", symbol: "د.إ", name: "UAE Dirham",        flag: "🇦🇪", decimals: 2 },
  JPY: { code: "JPY", symbol: "¥",   name: "Japanese Yen",      flag: "🇯🇵", decimals: 0 },
  CNY: { code: "CNY", symbol: "¥",   name: "Chinese Yuan",      flag: "🇨🇳", decimals: 2 },
  CHF: { code: "CHF", symbol: "CHF", name: "Swiss Franc",       flag: "🇨🇭", decimals: 2 },
  SEK: { code: "SEK", symbol: "kr",  name: "Swedish Krona",     flag: "🇸🇪", decimals: 0 },
  NOK: { code: "NOK", symbol: "kr",  name: "Norwegian Krone",   flag: "🇳🇴", decimals: 0 },
  DKK: { code: "DKK", symbol: "kr",  name: "Danish Krone",      flag: "🇩🇰", decimals: 0 },
  NZD: { code: "NZD", symbol: "NZ$", name: "NZ Dollar",         flag: "🇳🇿", decimals: 2 },
  ZAR: { code: "ZAR", symbol: "R",   name: "South African Rand",flag: "🇿🇦", decimals: 0 },
  BRL: { code: "BRL", symbol: "R$",  name: "Brazilian Real",    flag: "🇧🇷", decimals: 2 },
  MXN: { code: "MXN", symbol: "MX$", name: "Mexican Peso",      flag: "🇲🇽", decimals: 0 },
  HKD: { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar",  flag: "🇭🇰", decimals: 2 },
  KRW: { code: "KRW", symbol: "₩",   name: "South Korean Won",  flag: "🇰🇷", decimals: 0 },
  IDR: { code: "IDR", symbol: "Rp",  name: "Indonesian Rupiah", flag: "🇮🇩", decimals: 0 },
  MYR: { code: "MYR", symbol: "RM",  name: "Malaysian Ringgit", flag: "🇲🇾", decimals: 2 },
  PHP: { code: "PHP", symbol: "₱",   name: "Philippine Peso",   flag: "🇵🇭", decimals: 0 },
  THB: { code: "THB", symbol: "฿",   name: "Thai Baht",         flag: "🇹🇭", decimals: 0 },
  VND: { code: "VND", symbol: "₫",   name: "Vietnamese Dong",   flag: "🇻🇳", decimals: 0 },
  TRY: { code: "TRY", symbol: "₺",   name: "Turkish Lira",      flag: "🇹🇷", decimals: 0 },
  PLN: { code: "PLN", symbol: "zł",  name: "Polish Zloty",      flag: "🇵🇱", decimals: 2 },
  CZK: { code: "CZK", symbol: "Kč",  name: "Czech Koruna",      flag: "🇨🇿", decimals: 0 },
  HUF: { code: "HUF", symbol: "Ft",  name: "Hungarian Forint",  flag: "🇭🇺", decimals: 0 },
  ILS: { code: "ILS", symbol: "₪",   name: "Israeli Shekel",    flag: "🇮🇱", decimals: 2 },
  SAR: { code: "SAR", symbol: "﷼",   name: "Saudi Riyal",       flag: "🇸🇦", decimals: 2 },
  QAR: { code: "QAR", symbol: "﷼",   name: "Qatari Riyal",      flag: "🇶🇦", decimals: 2 },
  KWD: { code: "KWD", symbol: "د.ك", name: "Kuwaiti Dinar",     flag: "🇰🇼", decimals: 3 },
  BHD: { code: "BHD", symbol: ".د.ب",name: "Bahraini Dinar",    flag: "🇧🇭", decimals: 3 },
  OMR: { code: "OMR", symbol: "﷼",   name: "Omani Rial",        flag: "🇴🇲", decimals: 3 },
  EGP: { code: "EGP", symbol: "E£",  name: "Egyptian Pound",    flag: "🇪🇬", decimals: 2 },
  NGN: { code: "NGN", symbol: "₦",   name: "Nigerian Naira",    flag: "🇳🇬", decimals: 0 },
  KES: { code: "KES", symbol: "KSh", name: "Kenyan Shilling",   flag: "🇰🇪", decimals: 0 },
  PKR: { code: "PKR", symbol: "₨",   name: "Pakistani Rupee",   flag: "🇵🇰", decimals: 0 },
  BDT: { code: "BDT", symbol: "৳",   name: "Bangladeshi Taka",  flag: "🇧🇩", decimals: 0 },
  LKR: { code: "LKR", symbol: "Rs",  name: "Sri Lankan Rupee",  flag: "🇱🇰", decimals: 0 },
  NPR: { code: "NPR", symbol: "रू",  name: "Nepalese Rupee",    flag: "🇳🇵", decimals: 0 },
  RUB: { code: "RUB", symbol: "₽",   name: "Russian Ruble",     flag: "🇷🇺", decimals: 0 },
  UAH: { code: "UAH", symbol: "₴",   name: "Ukrainian Hryvnia", flag: "🇺🇦", decimals: 0 },
  ARS: { code: "ARS", symbol: "AR$", name: "Argentine Peso",    flag: "🇦🇷", decimals: 0 },
  CLP: { code: "CLP", symbol: "CL$", name: "Chilean Peso",      flag: "🇨🇱", decimals: 0 },
  COP: { code: "COP", symbol: "CO$", name: "Colombian Peso",    flag: "🇨🇴", decimals: 0 },
  PEN: { code: "PEN", symbol: "S/.", name: "Peruvian Sol",      flag: "🇵🇪", decimals: 2 },
  TWD: { code: "TWD", symbol: "NT$", name: "Taiwan Dollar",     flag: "🇹🇼", decimals: 0 },
};

export const CURRENCY_LIST: CurrencyMeta[] = SUPPORTED_CURRENCIES.map(
  (c) => CURRENCY_META[c]
);

interface CurrencyContextValue {
  currency: Currency;
  meta: CurrencyMeta;
  setCurrency: (c: Currency) => void;
  rates: FxRates | undefined;
  isLoading: boolean;
  /** Convert a USD amount to the active currency. */
  convert: (usdAmount: number) => number;
  /** Format a USD price as a localized string. */
  format: (usdAmount: number, opts?: { withSymbol?: boolean }) => string;
  /** Has the user explicitly chosen a currency? */
  isUserSelected: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function isSupported(c: string | null | undefined): c is Currency {
  return !!c && (SUPPORTED_CURRENCIES as readonly string[]).includes(c);
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [isUserSelected, setIsUserSelected] = useState(false);

  // 1. Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isSupported(saved)) {
        setCurrencyState(saved);
        setIsUserSelected(true);
      }
    } catch {
      // ignore
    }
  }, []);

  // 2. Fetch FX rates (refresh every 30 min)
  const { data: rates, isLoading } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: () => getFxRates(),
    staleTime: 30 * 60 * 1000,
    refetchInterval: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // 3. If no user selection, detect via IP once
  const { data: detected } = useQuery({
    queryKey: ["fx-detect"],
    queryFn: () => detectCurrencyFromIp(),
    enabled: !isUserSelected,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (!isUserSelected && detected && isSupported(detected.currency)) {
      setCurrencyState(detected.currency);
    }
  }, [detected, isUserSelected]);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    setIsUserSelected(true);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // ignore
    }
  }, []);

  const convert = useCallback(
    (usdAmount: number) => {
      if (!rates) return usdAmount;
      const rate = rates.rates[currency] ?? 1;
      return usdAmount * rate;
    },
    [rates, currency]
  );

  const format = useCallback(
    (usdAmount: number, opts?: { withSymbol?: boolean }) => {
      const meta = CURRENCY_META[currency];
      const value = convert(usdAmount);
      // Pretty rounding for display (e.g. 165.6 → 166 for INR, 2.04 → 2 for low decimals)
      const rounded = (() => {
        if (meta.decimals === 0) return Math.round(value);
        const factor = 10 ** meta.decimals;
        return Math.round(value * factor) / factor;
      })();
      const formatted = new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: meta.decimals,
      }).format(rounded);
      if (opts?.withSymbol === false) return formatted;
      return `${meta.symbol}${formatted}`;
    },
    [convert, currency]
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      meta: CURRENCY_META[currency],
      setCurrency,
      rates,
      isLoading,
      convert,
      format,
      isUserSelected,
    }),
    [currency, setCurrency, rates, isLoading, convert, format, isUserSelected]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
