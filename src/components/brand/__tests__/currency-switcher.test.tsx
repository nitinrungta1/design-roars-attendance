/** UI smoke tests for the CurrencySwitcher popover. */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/lib/fx.functions", async () => {
  const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "INR", "JPY"] as const;
  return {
    SUPPORTED_CURRENCIES,
    getFxRates: vi.fn(async () => ({
      base: "USD",
      rates: { USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.3, JPY: 151 },
      fetchedAt: new Date().toISOString(),
    })),
    detectCurrencyFromIp: vi.fn(async () => ({
      country: null,
      currency: "USD",
    })),
  };
});

import { CurrencyProvider } from "@/lib/currency";
import { CurrencySwitcher } from "@/components/brand/currency-switcher";

function wrap(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <CurrencyProvider>{ui}</CurrencyProvider>
    </QueryClientProvider>
  );
}

describe("CurrencySwitcher", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the active currency code in the trigger", () => {
    wrap(<CurrencySwitcher />);
    expect(screen.getByRole("button", { name: /Currency:/i })).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("opens the popover and lists currencies", async () => {
    const user = userEvent.setup();
    wrap(<CurrencySwitcher />);
    await user.click(screen.getByRole("button", { name: /Currency:/i }));
    const list = await screen.findByPlaceholderText(/search currency/i);
    expect(list).toBeInTheDocument();
    // At least one of our mocked currencies is rendered as an option
    expect(await screen.findByText("Euro")).toBeInTheDocument();
    expect(screen.getByText("Indian Rupee")).toBeInTheDocument();
  });

  it("filters by code, name, or symbol", async () => {
    const user = userEvent.setup();
    wrap(<CurrencySwitcher />);
    await user.click(screen.getByRole("button", { name: /Currency:/i }));
    const search = await screen.findByPlaceholderText(/search currency/i);

    await user.type(search, "rupee");
    expect(screen.getByText("Indian Rupee")).toBeInTheDocument();
    expect(screen.queryByText("Euro")).not.toBeInTheDocument();
  });

  it("selecting a currency updates the trigger label", async () => {
    const user = userEvent.setup();
    wrap(<CurrencySwitcher />);
    await user.click(screen.getByRole("button", { name: /Currency:/i }));
    const inrRow = (await screen.findByText("Indian Rupee")).closest("button");
    expect(inrRow).not.toBeNull();
    await user.click(inrRow!);
    // Trigger now reads INR
    const trigger = await screen.findByRole("button", { name: /Currency: Indian Rupee/i });
    expect(within(trigger).getByText("INR")).toBeInTheDocument();
    // Persisted
    expect(localStorage.getItem("oqlio.currency")).toBe("INR");
  });
});
