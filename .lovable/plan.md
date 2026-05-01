## Two edits to `src/router.tsx`

### Edit 1 — Replace the existing fetch override block (top of file)

Replace the current block (lines 4–29 — the `if (typeof window !== 'undefined') { ... }` that uses `keys.find(...)` to locate the auth key) with the simpler hardcoded version:

```ts
if (typeof window !== 'undefined') {
  const _orig = globalThis.fetch.bind(globalThis);
  globalThis.fetch = async function(url: RequestInfo | URL, options?: RequestInit) {
    if (typeof url === 'string' && url.includes('/_serverFn/')) {
      try {
        const stored = localStorage.getItem('sb-cehphyqfvvpeqyyxcnnz-auth-token');
        if (stored) {
          const parsed = JSON.parse(stored);
          const token = parsed?.access_token;
          if (token) {
            options = options ?? {};
            options.headers = {
              ...(options.headers as Record<string, string> ?? {}),
              Authorization: `Bearer ${token}`,
            };
          }
        }
      } catch {}
    }
    return _orig(url, options);
  };
}
```

### Edit 2 — Fix the broken `<a>` tag in `DefaultErrorComponent` (lines 68–74)

Restore the missing opening `<a` tag. Change:

```tsx
            Try again
          </button>
          
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
```

To:

```tsx
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
```

## Out of scope

- `getRouter` is not modified.
- No other files are touched.

## Verification

After the edits, the dev server should compile without JSX errors and Publish should succeed. I'll tail `/tmp/dev-server-logs/dev-server.log` to confirm a clean build.