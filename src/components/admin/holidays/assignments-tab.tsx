import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import { EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate } from "@/components/admin/data-shell";
import {
  SCOPE_LEVELS,
  type ScopeLevel,
  listAssignments,
  assignPolicy,
  unassignPolicy,
  listHolidayPolicies,
  listOffices,
  listEmployeeOptions,
} from "@/lib/holiday-engine.functions";

interface CountryOpt {
  code: string;
  name: string;
  flag_emoji: string | null;
}

export function AssignmentsTab({
  companyId,
  countries,
}: {
  companyId: string;
  countries: CountryOpt[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "holiday-assignments", companyId],
    queryFn: () =>
      companyId
        ? listAssignments({ data: { company_id: companyId } })
        : Promise.resolve({ assignments: [] }),
    enabled: !!companyId,
  });

  const remove = useMutation({
    mutationFn: (id: string) => unassignPolicy({ data: { id } }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success("Assignment removed");
        qc.invalidateQueries({ queryKey: ["admin", "holiday-assignments"] });
      } else toast.error(r.error);
    },
  });

  if (!companyId)
    return (
      <EmptyState
        icon={Users2}
        title="Select a company"
        description="Assignments are scoped per company."
      />
    );

  const items = data?.assignments ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Policy assignments</h3>
          <p className="text-xs text-muted-foreground">
            Bulk-assign a policy by employee, office, country or region. Higher priority wins on
            conflict.
          </p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New assignment
        </Button>
      </div>

      <DataTable
        headers={["Policy", "Scope", "Target", "Priority", "Assigned", ""]}
        empty={
          !isLoading && items.length === 0 ? (
            <EmptyState
              icon={Users2}
              title="No assignments yet"
              description="Create a policy in the Policies tab, then assign it here."
            />
          ) : null
        }
      >
        {items.map((a) => (
          <Tr key={a.id}>
            <Td className="font-medium">{a.policy_name}</Td>
            <Td>
              <Badge variant="secondary" className="capitalize">
                {a.scope_level}
              </Badge>
            </Td>
            <Td className="text-muted-foreground">
              {a.scope_level === "employee"
                ? (a.employee_name ?? "—")
                : a.scope_level === "country"
                  ? `${countries.find((c) => c.code === a.country_code)?.flag_emoji ?? ""} ${a.country_code ?? ""}`
                  : a.scope_level === "region"
                    ? a.region
                    : a.scope_level === "office"
                      ? (a.location_id ?? "—")
                      : "All employees"}
            </Td>
            <Td className="font-mono text-xs">{a.priority}</Td>
            <Td className="text-muted-foreground">{fmtDate(a.created_at)}</Td>
            <Td className="text-right">
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(a.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </Td>
          </Tr>
        ))}
      </DataTable>

      <AssignDialog
        open={open}
        onOpenChange={setOpen}
        companyId={companyId}
        countries={countries}
        onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "holiday-assignments"] })}
      />
    </div>
  );
}

function AssignDialog({
  open,
  onOpenChange,
  companyId,
  countries,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  companyId: string;
  countries: CountryOpt[];
  onSaved: () => void;
}) {
  const [scope, setScope] = useState<ScopeLevel>("employee");
  const [policyId, setPolicyId] = useState("");
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [locationId, setLocationId] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [region, setRegion] = useState("");
  const [priority, setPriority] = useState(100);

  const { data: policies } = useQuery({
    queryKey: ["admin", "holiday-policies", companyId],
    queryFn: () => listHolidayPolicies({ data: { company_id: companyId } }),
    enabled: open && !!companyId,
  });
  const { data: offices } = useQuery({
    queryKey: ["admin", "offices", companyId],
    queryFn: () => listOffices({ data: { company_id: companyId } }),
    enabled: open && !!companyId,
  });
  const { data: employees } = useQuery({
    queryKey: ["admin", "employee-options", companyId],
    queryFn: () => listEmployeeOptions({ data: { company_id: companyId } }),
    enabled: open && !!companyId,
  });

  const save = useMutation({
    mutationFn: () =>
      assignPolicy({
        data: {
          company_id: companyId,
          policy_id: policyId,
          scope_level: scope,
          employee_ids: scope === "employee" ? employeeIds : undefined,
          location_id: scope === "office" ? locationId : undefined,
          country_code: scope === "country" ? countryCode : undefined,
          region: scope === "region" ? region : undefined,
          priority,
        },
      }),
    onSuccess: (r) => {
      if (r.ok) {
        toast.success(`Assigned to ${r.inserted ?? 1} target(s)`);
        onOpenChange(false);
        onSaved();
        setEmployeeIds([]);
      } else toast.error(r.error);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign holiday policy</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Policy</Label>
            <Select value={policyId} onValueChange={setPolicyId}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a policy" />
              </SelectTrigger>
              <SelectContent>
                {(policies?.policies ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Scope</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as ScopeLevel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCOPE_LEVELS.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {scope === "employee" && (
            <div className="space-y-1">
              <Label>Employees</Label>
              <div className="max-h-48 overflow-auto rounded-lg border border-border p-2 space-y-1">
                {(employees?.employees ?? []).map((e) => (
                  <label key={e.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={employeeIds.includes(e.id)}
                      onChange={(ev) =>
                        setEmployeeIds((cur) =>
                          ev.target.checked ? [...cur, e.id] : cur.filter((x) => x !== e.id),
                        )
                      }
                    />
                    {e.full_name}
                    {e.country_code && (
                      <span className="text-xs text-muted-foreground">· {e.country_code}</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
          {scope === "office" && (
            <div className="space-y-1">
              <Label>Office</Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick an office" />
                </SelectTrigger>
                <SelectContent>
                  {(offices?.offices ?? []).map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {scope === "country" && (
            <div className="space-y-1">
              <Label>Country</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger>
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
          )}
          {scope === "region" && (
            <div className="space-y-1">
              <Label>Region</Label>
              <Input
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Maharashtra"
              />
            </div>
          )}
          <div className="space-y-1">
            <Label>Priority</Label>
            <Input
              type="number"
              min={0}
              max={1000}
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value) || 100)}
            />
            <p className="text-xs text-muted-foreground">
              Higher number wins when multiple assignments overlap.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => save.mutate()} disabled={!policyId || save.isPending}>
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
