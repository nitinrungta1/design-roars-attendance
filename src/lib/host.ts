/**
 * Host detection helpers — same TanStack Start app serves both
 * oqlio.com (marketing + product) and help.oqlio.com (Help Centre).
 */
export const HELP_HOST = "help.oqlio.com";
export const HELP_HOST_URL = `https://${HELP_HOST}`;

export function isHelpHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.toLowerCase().split(":")[0];
  return h === HELP_HOST || h.startsWith("help.");
}

/** Read host on the server (request headers) or in the browser. */
export function readHost(headers?: Headers): string | null {
  if (headers) return headers.get("host");
  if (typeof window !== "undefined") return window.location.host;
  return null;
}
