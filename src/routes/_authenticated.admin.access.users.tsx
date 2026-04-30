import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/access/users")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/users" });
  },
});
