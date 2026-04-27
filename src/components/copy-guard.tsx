import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";

/**
 * Lightweight copy/inspect deterrent for public marketing & help pages.
 * Determined users with DevTools can bypass — that is a hard limit of the web.
 */
const DISABLED_PREFIXES = [
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth-callback",
  "/contact",
  "/demo",
];

function isFormField(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function CopyGuard() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const enabled = !DISABLED_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

  useEffect(() => {
    if (!enabled) {
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("-webkit-user-select");
      return;
    }

    document.body.style.userSelect = "none";
    (document.body.style as CSSStyleDeclaration & { webkitUserSelect?: string }).webkitUserSelect =
      "none";

    const stop = (e: Event) => {
      if (isFormField(e.target)) return;
      e.preventDefault();
    };

    const onKey = (e: KeyboardEvent) => {
      if (isFormField(e.target)) return;
      const k = e.key.toLowerCase();
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "s", "u", "p", "a"].includes(k)) {
        e.preventDefault();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(k)) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("contextmenu", stop);
    document.addEventListener("copy", stop);
    document.addEventListener("cut", stop);
    document.addEventListener("dragstart", stop);
    document.addEventListener("selectstart", stop);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("contextmenu", stop);
      document.removeEventListener("copy", stop);
      document.removeEventListener("cut", stop);
      document.removeEventListener("dragstart", stop);
      document.removeEventListener("selectstart", stop);
      document.removeEventListener("keydown", onKey);
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("-webkit-user-select");
    };
  }, [enabled]);

  return null;
}
