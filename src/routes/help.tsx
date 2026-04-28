import { createFileRoute, Outlet } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/help")({
  head: () =>
    seo({
      title: "Help Centre",
      description:
        "Guides, tutorials and troubleshooting for Punchly attendance, time tracking and workforce management. Get answers in seconds.",
      path: "/help",
      kind: "help",
    }),
  component: HelpRouteLayout,
});

function HelpRouteLayout() {
  return <Outlet />;
}
