import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  component: () => {
    if (typeof window !== "undefined") {
      const search = window.location.search;
      window.location.replace(`https://app.oqlio.com/signup${search}`);
    }
    return null;
  },
});
