import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarRange, Plus, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  listSchedules,
  upsertSchedule,
  publishSchedule,
  deleteSchedule,
  getRosterPlanner,
  assignRosterEntry,
  clearRosterEntry,
  copyRosterWeek,
  clearRosterWindow,
} from "@/lib/workforce-roster.functions";
import { listCompanies } from "@/lib/customers.functions";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin/workforce/roster")({
  head: () =>
    seo({
      title: "Roster Planner | Admin",
      description: "Calendar-based shift planning with conflict detection.",
      kind: "product",
      path: "/admin/workforce/roster",
      noindex: true,
    }),
  component: RosterPage,
});

function RosterPage() {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: list } = useQuery({
    queryKey: ["admin", "workforce", "schedules"],
    queryFn: () => listSchedules(),
  });
  const { data: companies } = useQuery({
    queryKey: ["admin", "companies-lite"],
    queryFn: () => listCompanies(),
  });

  const schedules = list?.rows ?? [];
  const selectedId = activeId ?? schedules[0]?.id ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Workforce"
        title="Roster Planner"
        description="Drag-friendly calendar to plan shifts. Publish to lock the roster for employees."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Roster" }]}
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New schedule
          </Button>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Schedules" value={schedules.length} />
          <StatCard
            label="Published"
            value={schedules.filter((s) => s.status === "published").length}
            tone="success"
          />
          <StatCard
            label="Draft"
            value={schedules.filter((s) => s.status === "draft").length}
            tone="warning"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px,1fr]">
          <ScheduleList
            schedules={schedules}
            selectedId={selectedId}
            onSelect={setActiveId}
            onDelete={async (id) => {
              if (!confirm("Delete schedule and all entries?")) return;
              const res = await deleteSchedule({ data: { id } });
              if (res.ok) {
                toast.success("Schedule deleted");
                if (activeId === id) setActiveId(null);
                qc.invalidateQueries({ queryKey: ["admin", "workforce", "schedules"] });
              } else toast.error(res.error);
            }}
            onPublish={async (id) => {
              const res = await publishSchedule({ data: { id } });
              if (res.ok) {
                toast.success("Schedule published");
                qc.invalidateQueries({ queryKey: ["admin", "workforce", "schedules"] });
                qc.invalidateQueries({ queryKey: ["admin", "workforce", "roster", id] });
              } else toast.error(res.error);
            }}
          />
          {selectedId ? (
            <RosterGrid scheduleId={selectedId} />
          ) : (
            <EmptyState
              icon={CalendarRange}
              title="No schedule selected"
              description="Create a schedule to start planning shifts on the calendar grid."
            />
          )}
        </div>
      </PageBody>

      <CreateScheduleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        companies={companies?.companies ?? []}
        onCreated={(id) => {
          setActiveId(id);
          qc.invalidateQueries({ queryKey: ["admin", "workforce", "schedules"] });
        }}
      />
    </>
  );
}

function ScheduleList({
  schedules,
  selectedId,
  onSelect,
  onDelete,
  onPublish,
}: {
  schedules: { id: string; name: string; start_date: string; end_date: string; status: string; entries_count: number }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-border bg-card/40 p-3">
      <p className="px-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Schedules
      </p>
      {schedules.length === 0 && (
        <p className="px-2 py-6 text-center text-xs text-muted-foreground">No schedules yet</p>
      )}
      {schedules.map((s) => {
        const active = s.id === selectedId;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              "block w-full rounded-xl border px-3 py-2 text-left transition",
              active
                ? "border-primary bg-primary/5"
                : "border-transparent hover:bg-accent/30",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium">{s.name}</span>
              <Badge
                variant={s.status === "published" ? "default" : "secondary"}
                className="text-[10px]"
              >
                {s.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {s.start_date} → {s.end_date}
            </p>
            <p className="text-[11px] text-muted-foreground">{s.entries_count} entries</p>
            {active && (
              <div className="mt-2 flex gap-1">
                {s.status !== "published" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPublish(s.id);
                    }}
                  >
                    <Send className="mr-1 h-3 w-3" /> Publish
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-rose-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(s.id);
                  }}
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Delete
                </Button>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function CreateScheduleDialog({
  open,
  onOpenChange,
  companies,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companies: { id: string; name: string }[];
  onCreated: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [start, setStart] = useState(() => new Date().toISOString().slice(0, 10));
  const [end, setEnd] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  });
  const [submitting, setSubmitting] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New schedule</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Company</Label>
            <Select value={companyId} onValueChange={setCompanyId}>
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
            <Label className="text-xs">Name</Label>
            <Input
              className="mt-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Week 18 — Engineering"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Start</Label>
              <Input
                className="mt-1"
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">End</Label>
              <Input
                className="mt-1"
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!name || !companyId || !start || !end || submitting}
            onClick={async () => {
              setSubmitting(true);
              const res = await upsertSchedule({
                data: {
                  company_id: companyId,
                  name: name.trim(),
                  start_date: start,
                  end_date: end,
                },
              });
              setSubmitting(false);
              if (res.ok && res.id) {
                toast.success("Schedule created");
                onOpenChange(false);
                onCreated(res.id);
                setName("");
              } else if (!res.ok) toast.error(res.error);
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RosterGrid({ scheduleId }: { scheduleId: string }) {
  const qc = useQueryClient();
  const [cell, setCell] = useState<{ employee_id: string; work_date: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "workforce", "roster", scheduleId],
    queryFn: () => getRosterPlanner({ data: { schedule_id: scheduleId } }),
  });

  const assign = useMutation({
    mutationFn: (vars: {
      schedule_id: string;
      company_id: string;
      employee_id: string;
      work_date: string;
      shift_id: string | null;
      is_off: boolean;
      notes: string | null;
    }) => assignRosterEntry({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        if (res.conflicts > 0) {
          toast.warning(
            `Assigned. Conflicts in published schedules: ${res.conflict_schedules.join(", ")}`,
          );
        } else {
          toast.success("Shift assigned");
        }
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "roster", scheduleId] });
      } else toast.error(res.error);
    },
  });

  const clear = useMutation({
    mutationFn: (vars: { schedule_id: string; employee_id: string; work_date: string }) =>
      clearRosterEntry({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Cleared");
        qc.invalidateQueries({ queryKey: ["admin", "workforce", "roster", scheduleId] });
      } else toast.error(res.error);
    },
  });

  type EntryT = NonNullable<typeof data>["entries"][number];
  const entryMap = useMemo(() => {
    const m = new Map<string, EntryT>();
    for (const e of data?.entries ?? []) {
      m.set(`${e.employee_id}:${e.work_date}`, e);
    }
    return m;
  }, [data]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
        Loading roster…
      </div>
    );
  }
  if (!data) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-12 text-center text-sm text-muted-foreground">
        Schedule not found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">{data.schedule.name}</p>
          <p className="text-xs text-muted-foreground">
            {data.schedule.start_date} → {data.schedule.end_date} · {data.employees.length}{" "}
            employees · {data.shifts.length} shifts
          </p>
        </div>
        <Badge variant={data.schedule.status === "published" ? "default" : "secondary"}>
          {data.schedule.status}
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="sticky left-0 z-10 min-w-[180px] bg-muted/40 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Employee
              </th>
              {data.days.map((d) => (
                <th
                  key={d}
                  className="min-w-[110px] px-2 py-2 text-center text-xs font-semibold text-muted-foreground"
                >
                  {fmtDay(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.employees.map((e) => (
              <tr key={e.id} className="hover:bg-accent/20">
                <td className="sticky left-0 z-10 bg-card/40 px-3 py-2">
                  <div className="text-sm font-medium">{e.full_name}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {e.employee_code} · {e.department_name ?? "—"}
                  </div>
                </td>
                {data.days.map((d) => {
                  const entry = entryMap.get(`${e.id}:${d}`);
                  return (
                    <td key={d} className="px-1 py-1 text-center">
                      <button
                        onClick={() =>
                          setCell({ employee_id: e.id, work_date: d })
                        }
                        className={cn(
                          "h-12 w-full rounded-lg border text-xs transition",
                          entry?.is_off
                            ? "border-dashed border-border bg-muted/40 text-muted-foreground"
                            : entry?.shift_id
                              ? "border-transparent text-white"
                              : "border-dashed border-border hover:border-primary/40 hover:bg-accent/30",
                        )}
                        style={
                          entry?.shift_id && entry.shift_color
                            ? { backgroundColor: entry.shift_color }
                            : undefined
                        }
                      >
                        {entry?.is_off ? "OFF" : (entry?.shift_name ?? "+")}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cell && (
        <CellDialog
          companyId={data.schedule.company_id}
          scheduleId={scheduleId}
          employeeId={cell.employee_id}
          employeeName={
            data.employees.find((x) => x.id === cell.employee_id)?.full_name ?? ""
          }
          workDate={cell.work_date}
          shifts={data.shifts}
          existing={entryMap.get(`${cell.employee_id}:${cell.work_date}`) ?? null}
          onClose={() => setCell(null)}
          onAssign={(payload) =>
            assign.mutate(payload, {
              onSettled: () => setCell(null),
            })
          }
          onClear={() =>
            clear.mutate(
              {
                schedule_id: scheduleId,
                employee_id: cell.employee_id,
                work_date: cell.work_date,
              },
              { onSettled: () => setCell(null) },
            )
          }
        />
      )}
    </div>
  );
}

function CellDialog({
  companyId,
  scheduleId,
  employeeId,
  employeeName,
  workDate,
  shifts,
  existing,
  onClose,
  onAssign,
  onClear,
}: {
  companyId: string;
  scheduleId: string;
  employeeId: string;
  employeeName: string;
  workDate: string;
  shifts: { id: string; name: string; start_time: string; end_time: string; color: string | null }[];
  existing: { shift_id: string | null; is_off: boolean; notes: string | null } | null;
  onClose: () => void;
  onAssign: (data: {
    schedule_id: string;
    company_id: string;
    employee_id: string;
    work_date: string;
    shift_id: string | null;
    is_off: boolean;
    notes: string | null;
  }) => void;
  onClear: () => void;
}) {
  const [shiftId, setShiftId] = useState<string>(existing?.shift_id ?? shifts[0]?.id ?? "");
  const [isOff, setIsOff] = useState<boolean>(existing?.is_off ?? false);
  const [notes, setNotes] = useState<string>(existing?.notes ?? "");

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {employeeName} · {workDate}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Shift</Label>
            <Select value={shiftId} onValueChange={setShiftId} disabled={isOff}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pick a shift" />
              </SelectTrigger>
              <SelectContent>
                {shifts.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} · {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isOff}
              onChange={(e) => setIsOff(e.target.checked)}
            />
            Mark as day off
          </label>
          <div>
            <Label className="text-xs">Notes</Label>
            <Input
              className="mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
        <DialogFooter className="justify-between sm:justify-between">
          <div className="flex gap-2">
            {existing && (
              <Button variant="ghost" onClick={onClear} className="text-rose-600">
                <X className="mr-1 h-4 w-4" /> Clear
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              disabled={!isOff && !shiftId}
              onClick={() =>
                onAssign({
                  schedule_id: scheduleId,
                  company_id: companyId,
                  employee_id: employeeId,
                  work_date: workDate,
                  shift_id: isOff ? null : shiftId,
                  is_off: isOff,
                  notes: notes || null,
                })
              }
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function fmtDay(d: string) {
  const date = new Date(d);
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
