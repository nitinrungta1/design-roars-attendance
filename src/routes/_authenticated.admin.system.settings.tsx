import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Save, Settings as SettingsIcon } from "lucide-react";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/lib/system.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/system/settings")({
  head: () =>
    seo({
      title: "Settings | Admin",
      description: "Global platform configuration.",
      kind: "product",
      path: "/admin/system/settings",
      noindex: true,
    }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "platform-settings"],
    queryFn: () => getPlatformSettings(),
  });

  const [form, setForm] = useState({
    brand_name: "",
    product_name: "",
    support_email: "",
    default_currency: "INR",
    default_timezone: "Asia/Kolkata",
    default_plan_code: "",
    primary_color: "",
    logo_url: "",
  });

  useEffect(() => {
    if (data?.settings) {
      setForm({
        brand_name: data.settings.brand_name,
        product_name: data.settings.product_name,
        support_email: data.settings.support_email,
        default_currency: data.settings.default_currency,
        default_timezone: data.settings.default_timezone,
        default_plan_code: data.settings.default_plan_code ?? "",
        primary_color: data.settings.primary_color ?? "",
        logo_url: data.settings.logo_url ?? "",
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      updatePlatformSettings({
        data: {
          patch: {
            brand_name: form.brand_name,
            product_name: form.product_name,
            support_email: form.support_email,
            default_currency: form.default_currency,
            default_timezone: form.default_timezone,
            default_plan_code: form.default_plan_code || null,
            primary_color: form.primary_color || null,
            logo_url: form.logo_url || null,
          },
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Settings saved");
        qc.invalidateQueries({ queryKey: ["admin", "platform-settings"] });
      } else toast.error(res.error);
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Settings"
        description="Global branding, defaults, and product configuration."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Settings" }]}
        actions={
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Save changes
          </Button>
        }
      />
      <PageBody className="space-y-6">
        {isLoading ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Section
              title="Brand"
              description="Used in the marketing site, emails, and admin shell."
              icon={<SettingsIcon className="h-4 w-4" />}
            >
              <Field
                label="Company / brand name"
                value={form.brand_name}
                onChange={(v) => setForm({ ...form, brand_name: v })}
              />
              <Field
                label="Product name"
                value={form.product_name}
                onChange={(v) => setForm({ ...form, product_name: v })}
                hint="Shown in the app shell and product UI."
              />
              <Field
                label="Support email"
                type="email"
                value={form.support_email}
                onChange={(v) => setForm({ ...form, support_email: v })}
              />
              <Field
                label="Logo URL"
                value={form.logo_url}
                onChange={(v) => setForm({ ...form, logo_url: v })}
                placeholder="https://…"
              />
              <Field
                label="Primary color"
                value={form.primary_color}
                onChange={(v) => setForm({ ...form, primary_color: v })}
                placeholder="oklch(0.6 0.2 250)"
              />
            </Section>
            <Section
              title="Defaults"
              description="Applied to new tenants and invoices."
            >
              <Field
                label="Default currency"
                value={form.default_currency}
                onChange={(v) => setForm({ ...form, default_currency: v.toUpperCase() })}
                placeholder="INR"
              />
              <Field
                label="Default timezone"
                value={form.default_timezone}
                onChange={(v) => setForm({ ...form, default_timezone: v })}
                placeholder="Asia/Kolkata"
              />
              <Field
                label="Default plan code"
                value={form.default_plan_code}
                onChange={(v) => setForm({ ...form, default_plan_code: v })}
                placeholder="starter"
              />
            </Section>
          </div>
        )}
      </PageBody>
    </>
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
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {description && (
        <p className="-mt-3 mb-4 text-xs text-muted-foreground">{description}</p>
      )}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
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
