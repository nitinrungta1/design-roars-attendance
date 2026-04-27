# Remove visible Lovable branding & add copy/inspect deterrent

## What's actually visible

After scanning the codebase, **there is no visible "Made with Lovable" or "Powered by Supabase" text anywhere in the site**. The only Lovable-branded thing on your published site is the floating **"Edit with Lovable" badge** (injected by the platform, not in your code). All other "lovable" / "supabase" references are SDK imports — code identifiers the user never sees.

✅ **Already done in this turn:** badge hidden via publish settings.

## What still to build: Copy / inspect deterrent (light)

A new `CopyGuard` component mounted in `__root.tsx` that, on public pages only, blocks:
- Right-click context menu
- Text selection & drag
- `Ctrl/Cmd + C / X / S / U / P / A`
- `F12`, `Ctrl+Shift+I/J/C` (DevTools shortcuts)
- Copy/cut events at the document level

**Scoped off** (so admin work and forms keep working):
- `/admin/**` — staff need full DevTools & copy
- `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/auth-callback`
- `/contact`, `/demo` — forms need paste

**Form fields always pass through** even on protected pages: any `<input>`, `<textarea>`, `<select>`, or `contentEditable` element keeps normal behavior — so the help search box, ticket form, and KB feedback widget all still work.

## Honest disclosure

I want to be upfront: this is a **deterrent, not real protection**. Anyone with technical skill can:
- Open DevTools via the browser menu (not a shortcut)
- View source via `view-source:` URL prefix
- Disable JS and bypass the entire guard
- Read the SSR HTML directly with `curl`

A web app's HTML/CSS/JS is **fundamentally downloaded by the browser to render** — it cannot be hidden from a determined viewer. What we can do is stop casual copying, which this does well.

## Files

- **Create:** `src/components/copy-guard.tsx` (~80 lines, pure client effect)
- **Edit:** `src/routes/__root.tsx` — import & mount `<CopyGuard />` next to `<TrackingProvider />`

No DB, no backend changes, no UI changes other than blocked interactions.
