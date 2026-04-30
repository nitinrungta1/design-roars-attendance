import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Save,
  Settings as SettingsIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Palette,
  Globe2,
  
  Sparkles,
  Undo2,
} from "lucide-react";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  getPlatformSettings,
  updatePlatformSettings,
  extractLogoColors,
} from "@/lib/system.functions";
import { LogoUploader } from "@/components/admin/logo-uploader";
import { BrandColorField } from "@/components/admin/brand-color-field";
import { BrandPreview } from "@/components/admin/brand-preview";
import { CurrencySelect } from "@/components/admin/currency-select";
import { TimezoneSelect } from "@/components/admin/timezone-select";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";
import { User as UserIcon, Mail, ShieldCheck } from "lucide-react";
import { PlatformShell } from "@/components/admin/platform-shell";

export const Route = createFileRoute("/_authenticated/admin_/settings")({
  head: () =>
    seo({
      title: "Settings | Admin",
      description: "Global platform configuration.",
      kind: "product",
      path: "/admin/settings",
      noindex: true,
    }),
  component: SettingsPage,
  errorComponent: ({ error, reset }) => (
    <PlatformShell>
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6">
        <h2 className="text-lg font-semibold text-destructive">Settings failed to load</h2>
        <p className="mt-1 text-sm text-muted-foreground">{error?.message ?? String(error)}</p>
        <button
          onClick={() => reset()}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </PlatformShell>
  ),
});

interface FormState {
  brand_name: string;
  product_name: string;
  support_email: string;
  default_currency: string;
  default_timezone: string;
  default_plan_code: string;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  logo_url: string | null;
  date_format: string;
  time_format: "12h" | "24h";
  number_format: string;
  week_start: number;
}

const EMPTY: FormState = {
  brand_name: "",
  product_name: "",
  support_email: "",
  default_currency: "INR",
  default_timezone: "Asia/Kolkata",
  default_plan_code: "",
  primary_color: null,
  secondary_color: null,
  accent_color: null,
  logo_url: null,
  date_format: "DD/MM/YYYY",
  time_format: "24h",
  number_format: "en-IN",
  week_start: 1,
};

function slugify(s: string) {
  return s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "platform-settings"],
    queryFn: () => getPlatformSettings(),
  });

  const [form, setForm] = useState<FormState>(EMPTY);
  const [initial, setInitial] = useState<FormState>(EMPTY);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ primary?: string; secondary?: string; accent?: string } | null>(null);

  // Brand-name validity status (no global uniqueness check — workspace-local).
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "ok" | "taken">("idle");

  useEffect(() => {
    if (data?.settings) {
      const s = data.settings;
      const next: FormState = {
        brand_name: s.brand_name,
        product_name: s.product_name,
        support_email: s.support_email,
        default_currency: s.default_currency,
        default_timezone: s.default_timezone,
        default_plan_code: s.default_plan_code ?? "",
        primary_color: s.primary_color,
        secondary_color: s.secondary_color,
        accent_color: s.accent_color,
        logo_url: s.logo_url,
        date_format: s.date_format,
        time_format: (s.time_format as "12h" | "24h") ?? "24h",
        number_format: s.number_format,
        week_start: s.week_start,
      };
      setForm(next);
      setInitial(next);
    }
  }, [data]);

  const dirty = useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  );

  // Warn on unload when there are unsaved changes
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // Brand name no longer needs to be globally unique — each workspace owns its own name.
  // We just confirm it's a valid non-empty value.
  useEffect(() => {
    if (!form.brand_name.trim()) {
      setNameStatus("idle");
      return;
    }
    setNameStatus(form.brand_name.trim() === initial.brand_name.trim() ? "idle" : "ok");
  }, [form.brand_name, initial.brand_name]);

  const save = useMutation({
    mutationFn: async () => {
      const brand = form.brand_name.trim();
      if (!brand) {
        throw new Error("Company / brand name is required.");
      }
      const product = form.product_name.trim() || brand; // fallback to brand if blank
      const support = form.support_email.trim() || initial.support_email; // keep prior on blank
      return await updatePlatformSettings({
        data: {
          patch: {
            brand_name: brand,
            product_name: product,
            support_email: support,
            default_currency: form.default_currency,
            default_timezone: form.default_timezone,
            default_plan_code: form.default_plan_code || null,
            primary_color: form.primary_color,
            secondary_color: form.secondary_color,
            accent_color: form.accent_color,
            logo_url: form.logo_url,
            date_format: form.date_format,
            time_format: form.time_format,
            number_format: form.number_format,
            week_start: form.week_start,
          },
        },
      });
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Settings saved");
        qc.invalidateQueries({ queryKey: ["admin", "platform-settings"] });
      } else {
        toast.error("Failed to save settings", {
          description: res.error || "The server rejected the update. Please try again.",
        });
      }
    },
    onError: (err: unknown) => {
      // Surface thrown errors (auth/network/validation) that previously failed silently.
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Unknown error while saving settings.";
      console.error("updatePlatformSettings failed:", err);
      toast.error("Couldn't save settings", { description: message });
    },
  });

  const onLogoUploaded = async (url: string) => {
    setAiBusy(true);
    try {
      const res = await extractLogoColors({ data: { logoUrl: url } });
      if (res.ok && (res.primary || res.secondary || res.accent)) {
        setAiSuggestion({ primary: res.primary, secondary: res.secondary, accent: res.accent });
        toast.success("AI palette detected", {
          description: "Tap “Use suggestion” to apply the detected brand colors.",
        });
      }
    } finally {
      setAiBusy(false);
    }
  };

  const applyAi = () => {
    if (!aiSuggestion) return;
    setForm((f) => ({
      ...f,
      primary_color: aiSuggestion.primary ?? f.primary_color,
      secondary_color: aiSuggestion.secondary ?? f.secondary_color,
      accent_color: aiSuggestion.accent ?? f.accent_color,
    }));
    setAiSuggestion(null);
  };

  const reset = () => setForm(initial);
  const blockSave = !form.brand_name.trim() || !dirty || save.isPending;

  return (
    <PlatformShell>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Global branding, defaults, and product configuration."
        breadcrumbs={[{ label: "Home", to: "/home" }, { label: "Settings" }]}
        actions={
          dirty ? (
            <Badge variant="outline" className="border-amber-500/40 text-amber-500">
              Unsaved changes
            </Badge>
          ) : null
        }
      />
      <PageBody className="pb-24">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" /> Loading…
          </div>
        ) : (
          <Tabs defaultValue="profile">
            <TabsList className="mb-4 w-full justify-start overflow-x-auto">
              <TabsTrigger value="profile" className="gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Company Profile
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-1.5">
                <Palette className="h-3.5 w-3.5" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="localization" className="gap-1.5">
                <Globe2 className="h-3.5 w-3.5" />
                Localization
              </TabsTrigger>
            </TabsList>

            {/* COMPANY PROFILE */}
            <TabsContent value="profile" className="space-y-6">
              <Section
                title="Company"
                description="Identifies your workspace across emails, the marketing site, and the admin shell."
                icon={<Building2 className="h-4 w-4" />}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Company / brand name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      value={form.brand_name}
                      onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                      onBlur={(e) => setForm({ ...form, brand_name: e.target.value.trim() })}
                      placeholder="Acme Pvt Ltd"
                      className={cn(
                        "pr-9",
                        nameStatus === "taken" && "border-destructive focus-visible:ring-destructive",
                        nameStatus === "ok" && "border-emerald-500/60",
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                      {nameStatus === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {nameStatus === "ok" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                      {nameStatus === "taken" && <AlertCircle className="h-4 w-4 text-destructive" />}
                    </span>
                  </div>
                  {nameStatus === "taken" ? (
                    <p className="text-[11px] text-destructive">
                      This company name is already in use. Please choose another.
                    </p>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">
                      Slug preview: <code className="rounded bg-muted px-1 py-0.5">{slugify(form.brand_name) || "—"}</code>
                    </p>
                  )}
                </div>

              </Section>

              <CurrentAdminCard />
            </TabsContent>

            {/* BRANDING */}
            <TabsContent value="branding" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
                <div className="space-y-6">
                  <Section
                    title="Logo"
                    description="Drag & drop or upload your logo. We'll scan it for your brand palette."
                    icon={<Sparkles className="h-4 w-4" />}
                  >
                    <LogoUploader
                      value={form.logo_url}
                      onChange={(url) => setForm({ ...form, logo_url: url })}
                      onUploaded={onLogoUploaded}
                    />
                    {(aiBusy || aiSuggestion) && (
                      <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3">
                        <div className="flex items-center gap-2 text-xs">
                          {aiBusy ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              Detecting brand colors with AI…
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3.5 w-3.5 text-primary" />
                              <span>AI suggested palette:</span>
                              {[aiSuggestion?.primary, aiSuggestion?.secondary, aiSuggestion?.accent]
                                .filter(Boolean)
                                .map((c) => (
                                  <span
                                    key={c}
                                    className="inline-block h-4 w-4 rounded border border-border"
                                    style={{ background: c }}
                                  />
                                ))}
                            </>
                          )}
                        </div>
                        {aiSuggestion && (
                          <div className="flex gap-1.5">
                            <Button size="sm" variant="ghost" onClick={() => setAiSuggestion(null)}>
                              Dismiss
                            </Button>
                            <Button size="sm" onClick={applyAi}>
                              Use suggestion
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Section>

                  <Section
                    title="Brand colors"
                    description="Click a swatch to open the picker. Presets, gradients, and hex are all supported."
                    icon={<Palette className="h-4 w-4" />}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <BrandColorField
                        label="Primary"
                        value={form.primary_color}
                        onChange={(c) => setForm({ ...form, primary_color: c })}
                      />
                      <BrandColorField
                        label="Secondary"
                        value={form.secondary_color}
                        onChange={(c) => setForm({ ...form, secondary_color: c })}
                      />
                      <BrandColorField
                        label="Accent"
                        value={form.accent_color}
                        onChange={(c) => setForm({ ...form, accent_color: c })}
                      />
                    </div>
                  </Section>
                </div>

                <div className="lg:sticky lg:top-20 lg:self-start">
                  <BrandPreview
                    primary={form.primary_color}
                    secondary={form.secondary_color}
                    accent={form.accent_color}
                    logoUrl={form.logo_url}
                    brandName={form.brand_name || form.product_name || "Your brand"}
                  />
                </div>
              </div>
            </TabsContent>

            {/* LOCALIZATION */}
            <TabsContent value="localization" className="space-y-6">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Section title="Currency" description="Used as the default for new tenants and invoices.">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Default currency</Label>
                    <CurrencySelect
                      value={form.default_currency}
                      onChange={(v) => setForm({ ...form, default_currency: v })}
                    />
                  </div>
                </Section>

                <Section title="Timezone" description="The default timezone used for reporting and scheduling.">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Default timezone</Label>
                    <TimezoneSelect
                      value={form.default_timezone}
                      onChange={(v) => setForm({ ...form, default_timezone: v })}
                    />
                  </div>
                </Section>

                <Section title="Date & time" description="Display format used across reports and the dashboard.">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date format</Label>
                    <Select value={form.date_format} onValueChange={(v) => setForm({ ...form, date_format: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY · 28/04/2026</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY · 04/28/2026</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD · 2026-04-28</SelectItem>
                        <SelectItem value="D MMM YYYY">D MMM YYYY · 28 Apr 2026</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Time format</Label>
                    <Select
                      value={form.time_format}
                      onValueChange={(v) => setForm({ ...form, time_format: v as "12h" | "24h" })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour · 2:30 PM</SelectItem>
                        <SelectItem value="24h">24-hour · 14:30</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Section>

                <Section title="Numbers & week" description="Number grouping and the first day of the work week.">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Number format</Label>
                    <Select value={form.number_format} onValueChange={(v) => setForm({ ...form, number_format: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-IN">Indian · 12,34,567.89</SelectItem>
                        <SelectItem value="en-US">US · 1,234,567.89</SelectItem>
                        <SelectItem value="de-DE">European · 1.234.567,89</SelectItem>
                        <SelectItem value="fr-FR">French · 1 234 567,89</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Week starts on</Label>
                    <Select
                      value={String(form.week_start)}
                      onValueChange={(v) => setForm({ ...form, week_start: Number(v) })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Sunday</SelectItem>
                        <SelectItem value="1">Monday</SelectItem>
                        <SelectItem value="6">Saturday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Section>
              </div>
            </TabsContent>

          </Tabs>
        )}
      </PageBody>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-2xl border border-border bg-card/95 px-4 py-2.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-amber-500/40 text-amber-500">
              Unsaved changes
            </Badge>
            <Button size="sm" variant="ghost" onClick={reset} disabled={save.isPending}>
              <Undo2 className="mr-1.5 h-3.5 w-3.5" />
              Discard
            </Button>
            <Button size="sm" onClick={() => save.mutate()} disabled={blockSave}>
              {save.isPending ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              )}
              Save changes
            </Button>
          </div>
        </div>
      )}
    </PlatformShell>
  );
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {description && <p className="mb-4 text-xs text-muted-foreground">{description}</p>}
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  hint,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        type={type ?? "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

const ROLE_PRIORITY = ["super_admin", "admin", "hr", "manager", "finance", "sales", "support", "developer", "viewer", "employee"] as const;

function CurrentAdminCard() {
  const { user, profile, roles } = useAuth();
  if (!user) return null;
  // roles come from public.user_roles (joined by user_id) via useAuth, not from the profiles table.
  // Pick the highest-privilege role for display when a user holds multiple.
  const role = ROLE_PRIORITY.find((r) => (roles as string[]).includes(r)) ?? roles[0] ?? "—";
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-1 flex items-center gap-2">
        <UserIcon className="h-4 w-4" />
        <h2 className="text-base font-semibold">Workspace owner</h2>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        You're signed in as the account that originally created this workspace.
        To update your own name, avatar or password, open your profile.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {(profile?.full_name || user.email || "?").slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">
            {profile?.full_name || "Unnamed user"}
          </p>
          <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
            <Mail className="h-3 w-3" />
            {user.email}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3 text-emerald-500" />
            Role: <span className="font-medium capitalize">{role.replace(/_/g, " ")}</span>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/users">Manage users</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
