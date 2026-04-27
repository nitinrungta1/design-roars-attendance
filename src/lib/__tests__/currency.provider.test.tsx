/**
 * Provider tests — exercise the React layer of currency.tsx (hydration from
 * localStorage, IP fallback, FX conversion, persistence). The fx.functions
 * server module is mocked so the tests don't try to reach the network or
 * the TanStack Start server runtime.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// IMPORTANT: vi.mock is hoisted, so the factory cannot reference outer
// variables. We mock with deterministic rates here and then import.
vi.mock("@/lib/fx.functions", async () => {
  const SUPPORTED_CURRENCIES = [
    "USD", "EUR", "GBP", "INR", "JPY", "KWD",
  ] as const;
  return {
    SUPPORTED_CURRENCIES,
    getFxRates: vi.fn(async () => ({
      base: "USD",
      rates: { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.3, JPY: 151, KWD: 0.31 },
      fetchedAt: new Date().toISOString(),
    })),
    detectCurrencyFromIp: vi.fn(async () => ({
      country: "IN",
      currency: "INR",
    })),
  };
});

import { CurrencyProvider, useCurrency } from "@/lib/currency";
import * as fx from "@/lib/fx.functions";

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>
      <CurrencyProvider>{children}</CurrencyProvider>
    </QueryClientProvider>
  );
}

describe("CurrencyProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("starts in USD before any data resolves", () => {
    const { result } = renderHook(() => useCurrency(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.currency).toBe("USD");
    expect(result.current.isUserSelected).toBe(false);
  });

  it("hydrates the saved currency from localStorage", async () => {
    localStorage.setItem("oqlio.currency", "EUR");
    const { result } = renderHook(() => useCurrency(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.currency).toBe("EUR"));
    expect(result.current.isUserSelected).toBe(true);
  });

  it("falls back to IP-detected currency when nothing is saved", async () => {
    const { result } = renderHook(() => useCurrency(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.currency).toBe("INR"));
    // IP-detection ran exactly once (enabled is gated on isUserSelected)
    expect(fx.detectCurrencyFromIp).toHaveBeenCalled();
  });

  it("does NOT call IP detection when user has a saved choice", async () => {
    localStorage.setItem("oqlio.currency", "GBP");
    renderHook(() => useCurrency(), { wrapper: makeWrapper() });
    await waitFor(() => expect(fx.getFxRates).toHaveBeenCalled());
    expect(fx.detectCurrencyFromIp).not.toHaveBeenCalled();
  });

  it("setCurrency persists to localStorage and flips isUserSelected", async () => {
    const { result } = renderHook(() => useCurrency(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.rates).toBeDefined());
    act(() => result.current.setCurrency("JPY"));
    expect(result.current.currency).toBe("JPY");
    expect(result.current.isUserSelected).toBe(true);
    expect(localStorage.getItem("oqlio.currency")).toBe("JPY");
  });

  it("convert() applies the live rate", async () => {
    localStorage.setItem("oqlio.currency", "INR");
    const { result } = renderHook(() => useCurrency(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.rates).toBeDefined());
    expect(result.current.convert(10)).toBeCloseTo(833, 0);
  });

  it("format() reacts to currency change", async () => {
    const { result } = renderHook(() => useCurrency(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.rates).toBeDefined());

    act(() => result.current.setCurrency("USD"));
    const usd = result.current.format(99);
    expect(usd.replace(/[\u00a0\u202f]/g, " ")).toMatch(/\$99\.00/);

    act(() => result.current.setCurrency("INR"));
    const inr = result.current.format(99);
    expect(inr.replace(/[\u00a0\u202f]/g, " ")).toMatch(/8,247|8,250/);
  });

  it("convert() returns the raw amount before rates load", () => {
    const { result } = renderHook(() => useCurrency(), {
      wrapper: makeWrapper(),
    });
    // Before useQuery resolves, rates is undefined — convert is a no-op.
    expect(result.current.convert(42)).toBe(42);
  });
});
