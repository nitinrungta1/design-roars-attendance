import { Outlet, createRootRoute, HeadContent, Scripts, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { ORG_JSON_LD } from "@/lib/seo";
import { AuthProvider } from "@/lib/auth";
import { CurrencyProvider } from "@/lib/currency";
import { TrackingProvider } from "@/components/tracking-provider";
import { CopyGuard } from "@/components/copy-guard";

import appCss from "../styles.css?url";

// Server-side: read the incoming request's Host header so we can route the
// help.oqlio.com subdomain to the Help Centre during SSR (the previous
// browser-only check ran too late and shipped the marketing home instead).
const getRequestHostFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getRequestHost } = await import("@tanstack/react-start/server");
  try {
    return getRequestHost() ?? null;
  } catch {
    return null;
  }
});

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient-brand">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  beforeLoad: async ({ location }) => {
    // help.oqlio.com → serve Help Centre at "/" by redirecting to "/help".
    // Runs on the server (SSR) via getRequestHostFn and on the client via window.
    if (location.pathname !== "/") return;

    let host: string | null = null;
    if (typeof window === "undefined") {
      host = await getRequestHostFn();
    } else {
      host = window.location.host;
    }
    if (!host) return;

    const h = host.toLowerCase();
    if (h === "help.oqlio.com" || h.startsWith("help.")) {
      throw redirect({ to: "/help", replace: true });
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#4F46E5" },
      { title: "Oqlio — Workforce software people love. Punchly attendance & time tracking." },
      {
        name: "description",
        content:
          "Oqlio builds workforce software people love. Meet Punchly — the smartest attendance, time-tracking, and shift management platform for modern teams.",
      },
      { name: "author", content: "Oqlio" },
      { property: "og:site_name", content: "Oqlio" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@oqlio" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Geist:wght@400;500;600;700;800&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(ORG_JSON_LD),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  // Fresh QueryClient per request (SSR-safe; never module-level singleton).
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, refetchOnWindowFocus: false },
        },
      })
  );
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
          </AuthProvider>
        </QueryClientProvider>
        <Toaster position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <TrackingProvider />
      <CopyGuard />
      <Outlet />
    </>
  );
}
