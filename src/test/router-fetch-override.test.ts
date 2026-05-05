import { describe, it, expect, beforeEach, vi } from "vitest";

const TOKEN_KEY = "sb-cehphyqfvvpeqyyxcnnz-auth-token";

/**
 * Mirrors the override installed in src/router.tsx. We test the exact
 * algorithm here because importing router.tsx pulls in the generated
 * routeTree (every route + server fn), which is too heavy for unit tests.
 * If you change the implementation in router.tsx, mirror it here.
 */
function installOverride() {
  const _orig = globalThis.fetch.bind(globalThis);
  globalThis.fetch = (async (url: any, options?: RequestInit) => {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.toString() : url?.url;
    if (urlStr && urlStr.includes("/_serverFn/")) {
      try {
        const stored = localStorage.getItem(TOKEN_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          const token = parsed?.access_token;
          if (token) {
            options = options ?? {};
            const merged = new Headers(options.headers as HeadersInit | undefined);
            if (!merged.has("Authorization")) merged.set("Authorization", `Bearer ${token}`);
            options.headers = merged;
          }
        }
      } catch {}
    }
    return _orig(url, options);
  }) as any;
}

describe("router fetch override (server fn auth header)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("attaches Authorization bearer header on /_serverFn/ calls", async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: "tok-123" }));
    const captured: { init?: RequestInit }[] = [];
    globalThis.fetch = vi.fn(async (_url: any, init?: any) => {
      captured.push({ init });
      return new Response("ok");
    }) as any;
    installOverride();

    await fetch("/_serverFn/listUsers", { method: "POST", headers: { "x-tsr-serverFn": "true" } });

    const headers = new Headers(captured[0].init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok-123");
    // Critical: must not wipe original headers (the bug we fixed).
    expect(headers.get("x-tsr-serverFn")).toBe("true");
  });

  it("preserves Headers instance entries (regression: spread-Headers bug)", async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: "tok-xyz" }));
    const captured: { init?: RequestInit }[] = [];
    globalThis.fetch = vi.fn(async (_url: any, init?: any) => {
      captured.push({ init });
      return new Response("ok");
    }) as any;
    installOverride();

    const h = new Headers();
    h.set("x-tsr-serverFn", "true");
    h.set("content-type", "application/json");
    await fetch("/_serverFn/foo", { method: "POST", headers: h });
    const out = new Headers(captured[0].init?.headers);
    expect(out.get("x-tsr-serverFn")).toBe("true");
    expect(out.get("content-type")).toBe("application/json");
    expect(out.get("Authorization")).toBe("Bearer tok-xyz");
  });

  it("does not modify non-serverFn requests", async () => {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token: "tok-123" }));
    const captured: { init?: RequestInit }[] = [];
    globalThis.fetch = vi.fn(async (_url: any, init?: any) => {
      captured.push({ init });
      return new Response("ok");
    }) as any;
    installOverride();

    await fetch("https://example.com/api/foo", { headers: { "x-tsr-serverFn": "true" } });
    const headers = new Headers(captured[0].init?.headers);
    expect(headers.get("Authorization")).toBeNull();
    expect(headers.get("x-tsr-serverFn")).toBe("true");
  });

  it("no-ops when no token in storage", async () => {
    const captured: { init?: RequestInit }[] = [];
    globalThis.fetch = vi.fn(async (_url: any, init?: any) => {
      captured.push({ init });
      return new Response("ok");
    }) as any;
    installOverride();

    await fetch("/_serverFn/listUsers", { method: "POST" });
    const headers = new Headers(captured[0].init?.headers);
    expect(headers.get("Authorization")).toBeNull();
  });
});
