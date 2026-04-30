import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/punchly")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/workforce" });
  },
});
