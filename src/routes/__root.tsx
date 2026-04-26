import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";

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
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#4F46E5" },
      { title: "Oqlio— Smart Attendance & Workforce Management Software" },
      {
        name: "description",
        content:
          "Punchly is the smartest attendance management software for modern teams. Track attendance, shifts, timesheets, overtime & GPS check-ins from anywhere.",
      },
      { name: "author", content: "Punchly" },
      { property: "og:site_name", content: "Punchly" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@punchlyhq" },
      { property: "og:title", content: "Oqlio— Smart Attendance & Workforce Management Software" },
      { name: "twitter:title", content: "Oqlio— Smart Attendance & Workforce Management Software" },
      { name: "description", content: "Streamline all your HR processes and deliver exceptional employee experiences with Oqlio" },
      { property: "og:description", content: "Streamline all your HR processes and deliver exceptional employee experiences with Oqlio" },
      { name: "twitter:description", content: "Streamline all your HR processes and deliver exceptional employee experiences with Oqlio" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2120bd8b-d2f8-4744-80a7-e680dc0bdf4c/id-preview-edf12e30--cbd0bc63-458a-4252-8da1-03aae28365f3.lovable.app-1777231332180.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/2120bd8b-d2f8-4744-80a7-e680dc0bdf4c/id-preview-edf12e30--cbd0bc63-458a-4252-8da1-03aae28365f3.lovable.app-1777231332180.png" },
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
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Toaster position="top-center" richColors />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
