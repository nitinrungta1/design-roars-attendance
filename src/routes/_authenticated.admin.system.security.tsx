import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Lock, Save, Shield } from "lucide-react";
import { PageHeader, PageBody } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getPlatformSettings,
  updatePlatformSettings,
} from "@/lib/system.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/system/security")({
  head: () =>
    seo({
      title: "Security | Admin",
      description: "2FA, sessions, IP allowlists, HIBP.",
      kind: "product",
      path: "/admin/system/security",
      noindex: true,
    }),
  component: SecurityPage,
});

const DEFAULTS = {
  enforce_2fa: false,
  idle_timeout_minutes: 60,
  max_concurrent_sessions: 5,
  ip_allowlist: "",
  password_min_length: 10,
  require_symbol: true,
  require_number: true,
  hibp_check: true,
};

function SecurityPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "platform-settings"],
    queryFn: () => getPlatformSettings(),
  });

  const [sec, setSec] = useState(DEFAULTS);

  useEffect(() => {
    if (data?.settings?.security) {
      setSec({ ...DEFAULTS, ...data.settings.security });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      updatePlatformSettings({ data: { patch: { security: sec } } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Security policy updated");
        qc.invalidateQueries({ queryKey: ["admin", "platform-settings"] });
      } else toast.error(res.error);
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="System"
        title="Security"
        description="Enforce password policy, session limits, and access boundaries."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Security" }]}
        actions={
          <Button size="sm" onClick={() => save.mutate()} disabled={save.isPending || isLoading}>
            <Save className="mr-2 h-4 w-4" />
            Save policy
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
            <Card title="Authentication" icon={<Shield className="h-4 w-4" />}>
              <ToggleRow
                label="Require 2FA for admins"
                description="All super admins and admins must enroll an authenticator app."
                value={sec.enforce_2fa}
                onChange={(v) => setSec({ ...sec, enforce_2fa: v })}
              />
              <ToggleRow
                label="Block compromised passwords (HIBP)"
                description="Reject passwords seen in known breach datasets."
                value={sec.hibp_check}
                onChange={(v) => setSec({ ...sec, hibp_check: v })}
              />
              <NumberRow
                label="Min password length"
                value={sec.password_min_length}
                min={6}
                max={64}
                onChange={(v) => setSec({ ...sec, password_min_length: v })}
              />
              <ToggleRow
                label="Require symbol"
                value={sec.require_symbol}
                onChange={(v) => setSec({ ...sec, require_symbol: v })}
              />
              <ToggleRow
                label="Require number"
                value={sec.require_number}
                onChange={(v) => setSec({ ...sec, require_number: v })}
              />
            </Card>

            <Card title="Sessions & access" icon={<Lock className="h-4 w-4" />}>
              <NumberRow
                label="Idle timeout (minutes)"
                value={sec.idle_timeout_minutes}
                min={5}
                max={1440}
                onChange={(v) => setSec({ ...sec, idle_timeout_minutes: v })}
              />
              <NumberRow
                label="Max concurrent sessions"
                value={sec.max_concurrent_sessions}
                min={1}
                max={50}
                onChange={(v) => setSec({ ...sec, max_concurrent_sessions: v })}
              />
              <div className="space-y-1.5">
                <Label className="text-xs">IP allowlist (CIDR, one per line)</Label>
                <Textarea
                  rows={5}
                  value={sec.ip_allowlist}
                  onChange={(e) => setSec({ ...sec, ip_allowlist: e.target.value })}
                  placeholder="10.0.0.0/8&#10;192.168.1.0/24"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Leave empty to allow access from any IP.
                </p>
              </div>
            </Card>
          </div>
        )}
      </PageBody>
    </>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border/50 bg-background/40 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

function NumberRow({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
    </div>
  );
}
