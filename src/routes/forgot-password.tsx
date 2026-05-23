import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/forgot-password")({
  component: () => {
    if (typeof window !== "undefined" && !window.location.hostname.includes("legacy")) {
      window.location.replace("https://app.oqlio.com/forgot-password");
    }
    return null;
  },
});
