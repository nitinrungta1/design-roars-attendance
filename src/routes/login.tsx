import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: () => {
    if (typeof window !== "undefined" && !window.location.hostname.includes("legacy")) {
      window.location.replace("https://app.oqlio.com/login");
    }
    return null;
  },
});
