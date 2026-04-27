import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, Plus, Pencil, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listAttendanceRules,
  upsertAttendanceRules,
  deleteAttendanceRules,
  type AttendanceRulesRow,
} from "@/lib/workforce-pro.functions";
import { listCompanies } from "@/lib/customers.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/workforce/rules")({
  head: () =>
    seo({
      title: "Workforce Rules | Admin",
      description: "Attendance, break, overtime, and geo policies per tenant.",
      kind: "product",
      path: "/admin/workforce/rules",
      noindex: true,
    }),
  component: RulesPage,
});

const DEFAULT_FORM: Omit<AttendanceRulesRow, "id"> = {
  company_id: "",
  name: "Standard policy",
  is_default: true,
  grace_minutes: 10,
  late_after_minutes: 15,
  half_day_after_minutes: 60,
  auto_absent_no_checkin: true,
  auto_checkout_after_shift: true,
  early_exit_minutes: 30,
  allowed_break_minutes: 60,
  excess_break_alert: true,
  unpaid_break_after_minutes: 90,
  ot_after_minutes: 540,
  weekend_ot_multiplier: 1.5,
  holiday_ot_multiplier: 2.0,
  night_shift_handling: "split_at_midnight",
  cross_midnight_allowed: true,
  rotation_automation: false,
  geo_radius_meters: 150,
  allowed_ips: [],
  paid_hours_logic: "worked_minutes",
  deduction_logic: "half_day_threshold",
  half_day_calc: "less_than_240_minutes",
};

function RulesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AttendanceRulesRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "rules"],
    queryFn: () => listAttendanceRules(),
  });
  const { data: companies } = useQuery({
    queryKey: ["admin", "companies-lite"],
    queryFn: () => listCompanies(),
  });

  const upsert = useMutation({
    mutationFn: (vars: Parameters<typeof upsertAttendanceRules>[0]["data"]) =>
      upsertAttendanceRules({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(editing ? "Policy updated" : "Policy created");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "rules"] });
        setOpen(false);
        setEditing(null);
      } else toast.error(res.error);
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteAttendanceRules({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Policy deleted");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "rules"] });
      } else toast.error(res.error);
    },
  });

  const rules = data?.rules ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Workforce Rules"
        description="Configure attendance, break, overtime, geo, and payroll policies per tenant."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Workforce Rules" }]}
        actions={
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> New policy
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Policies" value={rules.length} />
          <StatCard label="Defaults" value={rules.filter((r) => r.is_default).length} tone="success" />
          <StatCard label="Geo-fenced" value={rules.filter((r) => r.geo_radius_meters > 0).length} />
        </div>

        <DataTable
          headers={["Policy", "Grace / Late", "Break", "OT after", "Geo radius", "Default", ""]}
          empty={
            !isLoading && rules.length === 0 ? (
              <EmptyState
                icon={ShieldCheck}
                title="No policies configured"
                description="Create your first attendance policy. Default policies apply to all employees in a tenant unless overridden."
              />
            ) : null
          }
        >
          {rules.map((r) => (
            <Tr key={r.id}>
              <Td>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {r.night_shift_handling.replace(/_/g, " ")}
                </div>
              </Td>
              <Td>
                <span className="font-mono text-xs">
                  {r.grace_minutes}m / {r.late_after_minutes}m
                </span>
              </Td>
              <Td className="font-mono text-xs">{r.allowed_break_minutes}m</Td>
              <Td className="font-mono text-xs">
                {Math.floor(r.ot_after_minutes / 60)}h{r.ot_after_minutes % 60 ? `${r.ot_after_minutes % 60}m` : ""}
              </Td>
              <Td className="font-mono text-xs">{r.geo_radius_meters}m</Td>
              <Td>
                {r.is_default ? (
                  <Badge variant="secondary" className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <Star className="mr-1 h-3 w-3" /> Default
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(r);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete policy "${r.name}"?`)) del.mutate(r.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>
                </div>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={7} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>

      <RulesDialog
        key={editing?.id ?? "new"}
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
        editing={editing}
        companies={companies?.companies ?? []}
        onSubmit={(payload) => upsert.mutate(payload)}
        submitting={upsert.isPending}
      />
    </>
  );
}

function RulesDialog({
  open,
  onOpenChange,
  editing,
  companies,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: AttendanceRulesRow | null;
  companies: { id: string; name: string }[];
  onSubmit: (data: AttendanceRulesRow) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<AttendanceRulesRow>(
    editing ?? { ...DEFAULT_FORM, id: "", company_id: companies[0]?.id ?? "" } as AttendanceRulesRow,
  );

  useEffect(() => {
    if (open) {
      setForm(
        editing ?? ({ ...DEFAULT_FORM, id: "", company_id: companies[0]?.id ?? "" } as AttendanceRulesRow),
      );
    }
  }, [open, editing, companies]);

  const u = <K extends keyof AttendanceRulesRow>(k: K, v: AttendanceRulesRow[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const num = (k: keyof AttendanceRulesRow) =>
    (e: React.ChangeEvent<HTMLInputElement>) => u(k, Number(e.target.value) || 0 as never);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit policy" : "New attendance policy"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Identity */}
          <Section title="Identity">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs">Company</Label>
                <Select
                  value={form.company_id}
                  onValueChange={(v) => u("company_id", v)}
                  disabled={!!editing}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Policy name</Label>
                <Input
                  className="mt-1"
                  value={form.name}
                  onChange={(e) => u("name", e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pt-2 sm:col-span-2">
                <Switch
                  checked={form.is_default}
                  onCheckedChange={(v) => u("is_default", v)}
                />
                <Label className="text-sm">Default policy for this tenant</Label>
              </div>
            </div>
          </Section>

          {/* Time rules */}
          <Section title="Time rules">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <NumField label="Grace (min)" value={form.grace_minutes} onChange={num("grace_minutes")} />
              <NumField label="Late after (min)" value={form.late_after_minutes} onChange={num("late_after_minutes")} />
              <NumField label="Half-day after late (min)" value={form.half_day_after_minutes} onChange={num("half_day_after_minutes")} />
              <NumField label="Early exit threshold (min)" value={form.early_exit_minutes} onChange={num("early_exit_minutes")} />
              <ToggleField label="Auto-absent if no check-in" checked={form.auto_absent_no_checkin} onChange={(v) => u("auto_absent_no_checkin", v)} />
              <ToggleField label="Auto-checkout after shift" checked={form.auto_checkout_after_shift} onChange={(v) => u("auto_checkout_after_shift", v)} />
            </div>
          </Section>

          {/* Break rules */}
          <Section title="Break rules">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <NumField label="Allowed break (min)" value={form.allowed_break_minutes} onChange={num("allowed_break_minutes")} />
              <NumField label="Unpaid after (min)" value={form.unpaid_break_after_minutes} onChange={num("unpaid_break_after_minutes")} />
              <ToggleField label="Excess-break alerts" checked={form.excess_break_alert} onChange={(v) => u("excess_break_alert", v)} />
            </div>
          </Section>

          {/* Overtime */}
          <Section title="Overtime">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <NumField label="OT after (min/day)" value={form.ot_after_minutes} onChange={num("ot_after_minutes")} />
              <NumField step="0.1" label="Weekend multiplier" value={form.weekend_ot_multiplier} onChange={num("weekend_ot_multiplier")} />
              <NumField step="0.1" label="Holiday multiplier" value={form.holiday_ot_multiplier} onChange={num("holiday_ot_multiplier")} />
            </div>
          </Section>

          {/* Shift handling */}
          <Section title="Shift handling">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Night shift handling</Label>
                <Select
                  value={form.night_shift_handling}
                  onValueChange={(v) => u("night_shift_handling", v)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="split_at_midnight">Split at midnight</SelectItem>
                    <SelectItem value="attribute_to_start">Attribute to start day</SelectItem>
                    <SelectItem value="attribute_to_end">Attribute to end day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ToggleField label="Cross-midnight allowed" checked={form.cross_midnight_allowed} onChange={(v) => u("cross_midnight_allowed", v)} />
              <ToggleField label="Rotation automation" checked={form.rotation_automation} onChange={(v) => u("rotation_automation", v)} />
            </div>
          </Section>

          {/* Geo & device */}
          <Section title="Geo & device rules">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <NumField label="Geo radius (meters)" value={form.geo_radius_meters} onChange={num("geo_radius_meters")} />
              <div>
                <Label className="text-xs">Allowed IPs (comma-separated)</Label>
                <Input
                  className="mt-1"
                  value={form.allowed_ips.join(", ")}
                  onChange={(e) =>
                    u(
                      "allowed_ips",
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    )
                  }
                  placeholder="203.0.113.5, 198.51.100.0/24"
                />
              </div>
            </div>
          </Section>

          {/* Payroll-ready */}
          <Section title="Payroll-ready logic">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label className="text-xs">Paid hours logic</Label>
                <Select value={form.paid_hours_logic} onValueChange={(v) => u("paid_hours_logic", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worked_minutes">Worked minutes</SelectItem>
                    <SelectItem value="shift_hours">Shift hours</SelectItem>
                    <SelectItem value="first_to_last_punch">First-to-last punch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Deduction logic</Label>
                <Select value={form.deduction_logic} onValueChange={(v) => u("deduction_logic", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="half_day_threshold">Half-day threshold</SelectItem>
                    <SelectItem value="per_minute">Per-minute deduction</SelectItem>
                    <SelectItem value="none">No deduction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Half-day calculation</Label>
                <Select value={form.half_day_calc} onValueChange={(v) => u("half_day_calc", v)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less_than_240_minutes">&lt; 4 hours</SelectItem>
                    <SelectItem value="less_than_300_minutes">&lt; 5 hours</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!form.name || !form.company_id || submitting}
            onClick={() => onSubmit(form)}
          >
            {editing ? "Save policy" : "Create policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/30 p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: string;
}) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input className="mt-1" type="number" step={step ?? "1"} value={value} onChange={onChange} />
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 pt-5">
      <Switch checked={checked} onCheckedChange={onChange} />
      <Label className="text-sm">{label}</Label>
    </div>
  );
}
