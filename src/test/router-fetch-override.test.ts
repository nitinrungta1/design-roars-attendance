import { describe, it, expect, beforeEach, vi } from "vitest";

// We re-import router.tsx for its side-effect of installing the global fetch wrapper.
// Order matters: set up localStorage and a stub fetch BEFORE importing.

const TOKEN_KEY = "sb-cehphyqfvvpeqyyxcnnz-auth-token";

describe("router fetch override (server fn auth header)", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it("attaches Authorization bearer header on /_serverFn/ calls", async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: "tok-123" }));
    const captured: { url: string | URL | Request; init?: RequestInit }[] = [];
    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      captured.push({ url, init });
      return new Response("ok");
    }) as any;

    await import("@/router");

    await fetch("/_serverFn/listUsers", { method: "POST", headers: { "x-tsr-serverFn": "true" } });

    expect(captured).toHaveLength(1);
    const headers = new Headers(captured[0].init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok-123");
    // Critical: must not wipe the original headers (the bug we fixed).
    expect(headers.get("x-tsr-serverFn")).toBe("true");
  });

  it("does not modify non-serverFn requests", async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: "tok-123" }));
    const captured: { init?: RequestInit }[] = [];
    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      captured.push({ init });
      return new Response("ok");
    }) as any;

    await import("@/router");

    await fetch("https://example.com/api/foo", { headers: { "x-tsr-serverFn": "true" } });
    const headers = new Headers(captured[0].init?.headers);
    expect(headers.get("Authorization")).toBeNull();
    expect(headers.get("x-tsr-serverFn")).toBe("true");
  });

  it("no-ops when no token in storage", async () => {
    const captured: { init?: RequestInit }[] = [];
    globalThis.fetch = vi.fn(async (url: any, init?: any) => {
      captured.push({ init });
      return new Response("ok");
    }) as any;

    await import("@/router");

    await fetch("/_serverFn/listUsers", { method: "POST" });
    const headers = new Headers(captured[0].init?.headers);
    expect(headers.get("Authorization")).toBeNull();
  });
});
