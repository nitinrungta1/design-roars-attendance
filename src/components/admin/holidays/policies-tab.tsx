import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Copy, ListTree, Globe2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate } from "@/components/admin/data-shell";
import {
  type HolidayPolicy,
  listHolidayPolicies,
  createHolidayPolicy,
  updateHolidayPolicy,
  deleteHolidayPolicy,
  clonePolicy,
  listPolicyHolidays,
  addPolicyHoliday,
  removePolicyHoliday,
  importTemplateIntoPolicy,
  listOffices,
} from "@/lib/holiday-engine.functions";

const WEEKDAYS = [
  { v: 0, label: "Sun" },
  { v: 1, label: "Mon" },
  { v: 2, label: "Tue" },
  { v: 3, label: "Wed" },
  { v: 4, label: "Thu" },
  { v: 5, label: "Fri" },
  { v: 6, label: "Sat" },
];

interface CountryOpt {
  code: string;
  name: string;
  flag_emoji: string | null;
}

export function PoliciesTab({
  companyId,
  countries,
  year,
}: {
  companyId: string;
  countries: CountryOpt[];
  year: number;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<HolidayPolicy | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<HolidayPolicy | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "holiday-policies", companyId],
    queryFn: () =>
      companyId
        ? listHolidayPolicies({ data: { company_id: companyId } })
        : Promise.resolve({ policies: [] }),
    enabled: !!companyId,
  });
  const { data: offices } = useQuery({
    queryKey: ["admin", "offices", companyId],
    queryFn: () =>
      companyId ? listOffices({ data: { company_id: companyId } }) : Promise.resolve({ offices: [] }),
    enabled: !!companyId,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteHolidayPolicy({ data: { id } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Policy removed");
        qc.invalidateQueries({ queryKey: ["admin", "holiday-policies"] });
      } else toast.error(r.error);
    },
  });
  const clone = useMutation({
    mutationFn: (p: HolidayPolicy) =>
      clonePolicy({ data: { policy_id: p.id, name: `${p.name} (copy)` } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Policy cloned");
        qc.invalidateQueries({ queryKey: ["admin", "holiday-policies"] });
      } else toast.error(r.error);
    },
  });

  if (!companyId)
    return (
      <EmptyState
        icon={ListTree}
        title="Select a company"
        description="Holiday policies are scoped per company."
      />
    );

  const policies = data?.policies ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Holiday policies</h3>
          <p className="text-xs text-muted-foreground">
            Reusable bundles that can be assigned to employees, offices, departments or whole regions.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> New policy
        </Button>
      </div>

      <DataTable
        headers={["Name", "Country", "Region", "Office", "Floating", "Default", ""]}
        empty={
          !isLoading && policies.length === 0 ? (
            <EmptyState
              icon={ListTree}
              title="No policies yet"
              description="Create a policy and import country holidays into it."
            />
          ) : null
        }
      >
        {policies.map((p) => (
          <Tr key={p.id}>
            <Td>
              <button
                className="text-left font-medium hover:underline"
                onClick={() => setSelectedPolicy(p)}
              >
                {p.name}
              </button>
              {p.description && (
                <div className="text-xs text-muted-foreground">{p.description}</div>
              )}
            </Td>
            <Td className="text-muted-foreground">
              {p.country_code
                ? `${countries.find((c) => c.code === p.country_code)?.flag_emoji ?? ""} ${p.country_code}`
                : "—"}
            </Td>
            <Td className="text-muted-foreground">{p.region ?? "—"}</Td>
            <Td className="text-muted-foreground">
              {offices?.offices.find((o) => o.id === p.office_location_id)?.name ?? "—"}
            </Td>
            <Td className="font-mono text-xs">{p.floating_quota}</Td>
            <Td>{p.is_default ? <Badge variant="secondary">Default</Badge> : "—"}</Td>
            <Td className="text-right">
              <Button size="sm" variant="ghost" onClick={() => clone.mutate(p)}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setEditing(p);
                  setFormOpen(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Delete policy "${p.name}"?`)) remove.mutate(p.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </Td>
          </Tr>
        ))}
      </DataTable>

      {selectedPolicy && (
        <PolicyDetail
          policy={selectedPolicy}
          year={year}
          countries={countries}
          onClose={() => setSelectedPolicy(null)}
        />
      )}

      <PolicyFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        companyId={companyId}
        countries={countries}
        offices={offices?.offices ?? []}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin", "holiday-policies"] });
          setEditing(null);
        }}
      />
    </div>
  );
}

function PolicyDetail({
  policy,
  year,
  countries,
  onClose,
}: {
  policy: HolidayPolicy;
  year: number;
  countries: CountryOpt[];
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "policy-holidays", policy.id, year],
    queryFn: () => listPolicyHolidays({ data: { policy_id: policy.id, year } }),
  });
  const [importCountry, setImportCountry] = useState(policy.country_code ?? "");
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");

  const importer = useMutation({
    mutationFn: () =>
      importTemplateIntoPolicy({
        data: { policy_id: policy.id, country_code: importCountry, year, mode: importMode },
      }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(`Imported ${r.inserted ?? 0} holidays`);
        qc.invalidateQueries({ queryKey: ["admin", "policy-holidays"] });
      } else toast.error(r.error);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => removePolicyHoliday({ data: { id } }),
    onSuccess: (r) => {
      if (r.ok) qc.invalidateQueries({ queryKey: ["admin", "policy-holidays"] });
      else toast.error(r.error);
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold">
            Holidays in <span className="text-primary">{policy.name}</span> · {year}
          </h4>
          <p className="text-xs text-muted-foreground">{data?.holidays.length ?? 0} entries</p>
        </div>
        <Button size="sm" variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-dashed border-border p-3">
        <div className="space-y-1">
          <Label className="text-xs">Country template</Label>
          <Select value={importCountry} onValueChange={setImportCountry}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Pick country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.flag_emoji ?? "🌐"} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Mode</Label>
          <Select value={importMode} onValueChange={(v) => setImportMode(v as "merge" | "replace")}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="merge">Merge</SelectItem>
              <SelectItem value="replace">Replace year</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={() => importer.mutate()}
          disabled={!importCountry || importer.isPending}
          className="gap-2"
        >
          <Globe2 className="h-4 w-4" /> Import {year}
        </Button>
      </div>
      <DataTable
        headers={["Date", "Name", "Type", "Paid", ""]}
        empty={
          !isLoading && (data?.holidays.length ?? 0) === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="Empty policy"
              description="Import a country template above or add holidays manually."
            />
          ) : null
        }
      >
        {(data?.holidays ?? []).map((h) => (
          <Tr key={h.id}>
            <Td className="font-mono text-xs">{fmtDate(h.holiday_date)}</Td>
            <Td className="font-medium">{h.name}</Td>
            <Td className="capitalize text-muted-foreground">{h.type.replace("_", " ")}</Td>
            <Td>{h.is_paid ? "Yes" : "No"}</Td>
            <Td className="text-right">
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(h.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Td>
          </Tr>
        ))}
      </DataTable>
      <AddPolicyHolidayInline policyId={policy.id} />
    </div>
  );
}

function AddPolicyHolidayInline({ policyId }: { policyId: string }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const add = useMutation({
    mutationFn: () =>
      addPolicyHoliday({ data: { policy_id: policyId, name, holiday_date: date } }),
    onSuccess: (r) => {
      if (r.ok) {
        setName("");
        setDate("");
        toast.success("Holiday added to policy");
        qc.invalidateQueries({ queryKey: ["admin", "policy-holidays"] });
      } else toast.error(r.error);
    },
  });
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label className="text-xs">Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Republic Day" />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Date</Label>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <Button size="sm" onClick={() => add.mutate()} disabled={!name || !date || add.isPending}>
        Add
      </Button>
    </div>
  );
}

function PolicyFormDialog({
  open,
  onOpenChange,
  editing,
  companyId,
  countries,
  offices,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  editing: HolidayPolicy | null;
  companyId: string;
  countries: CountryOpt[];
  offices: { id: string; name: string }[];
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    company_id: editing?.company_id ?? companyId,
    name: editing?.name ?? "",
    description: editing?.description ?? "",
    country_code: editing?.country_code ?? "",
    region: editing?.region ?? "",
    office_location_id: editing?.office_location_id ?? "",
    weekend_days: editing?.weekend_days ?? [0, 6],
    floating_quota: editing?.floating_quota ?? 0,
    is_default: editing?.is_default ?? false,
  });
  useMemo(() => {
    setForm({
      company_id: editing?.company_id ?? companyId,
      name: editing?.name ?? "",
      description: editing?.description ?? "",
      country_code: editing?.country_code ?? "",
      region: editing?.region ?? "",
      office_location_id: editing?.office_location_id ?? "",
      weekend_days: editing?.weekend_days ?? [0, 6],
      floating_quota: editing?.floating_quota ?? 0,
      is_default: editing?.is_default ?? false,
    });
  }, [editing, companyId]);

  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateHolidayPolicy({ data: { id: editing.id, ...form } })
        : createHolidayPolicy({ data: form }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(editing ? "Policy updated" : "Policy created");
        onOpenChange(false);
        onSaved();
      } else toast.error(r.error);
    },
  });

  const toggleDay = (d: number) =>
    setForm((f) => ({
      ...f,
      weekend_days: f.weekend_days.includes(d)
        ? f.weekend_days.filter((x) => x !== d)
        : [...f.weekend_days, d].sort(),
    }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit policy" : "New holiday policy"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. India Policy"
            />
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Country</Label>
              <Select
                value={form.country_code}
                onValueChange={(v) => setForm({ ...form, country_code: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.flag_emoji ?? "🌐"} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Region</Label>
              <Input
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                placeholder="e.g. Maharashtra"
              />
            </div>
            <div className="space-y-1">
              <Label>Office</Label>
              <Select
                value={form.office_location_id}
                onValueChange={(v) => setForm({ ...form, office_location_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Floating quota</Label>
              <Input
                type="number"
                min={0}
                max={30}
                value={form.floating_quota}
                onChange={(e) =>
                  setForm({ ...form, floating_quota: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Weekend days</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.v}
                  type="button"
                  onClick={() => toggleDay(d.v)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    form.weekend_days.includes(d.v)
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <p className="text-sm font-medium">Default policy</p>
              <p className="text-xs text-muted-foreground">
                Auto-applied to new employees in this company.
              </p>
            </div>
            <Switch
              checked={form.is_default}
              onCheckedChange={(v) => setForm({ ...form, is_default: v })}
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={!form.name || save.isPending}>
            {editing ? "Save" : "Create policy"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
