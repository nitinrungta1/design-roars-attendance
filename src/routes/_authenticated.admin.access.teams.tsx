import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Group, Plus, Trash2, UserPlus, Crown } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { fmtDate } from "@/components/admin/data-shell";
import {
  listTeams,
  createTeam,
  deleteTeam,
  listTeamMembers,
  addTeamMember,
  removeTeamMember,
  setTeamLead,
  listCompanyMemberCandidates,
} from "@/lib/access.functions";
import { listCompanies } from "@/lib/customers.functions";
import { seo } from "@/lib/seo";
import { useRequirePermission } from "@/hooks/use-require-permission";

export const Route = createFileRoute("/_authenticated/admin/access/teams")({
  head: () =>
    seo({
      title: "Teams | Admin",
      description: "Team groupings.",
      kind: "product",
      path: "/admin/access/teams",
      noindex: true,
    }),
  component: TeamsPage,
});

function TeamsPage() {
  const blocked = useRequirePermission("access.teams.write");
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCompanyId, setNewCompanyId] = useState<string>("");

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ["admin", "teams"],
    queryFn: () => listTeams(),
  });
  const { data: companiesData } = useQuery({
    queryKey: ["admin", "companies-list"],
    queryFn: () => listCompanies(),
  });

  const create = useMutation({
    mutationFn: (vars: { companyId: string; name: string; description?: string }) =>
      createTeam({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Team created");
        qc.invalidateQueries({ queryKey: ["admin", "teams"] });
        setCreateOpen(false);
        setNewName("");
        setNewDesc("");
      } else toast.error(res.error);
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTeam({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Team deleted");
        qc.invalidateQueries({ queryKey: ["admin", "teams"] });
      } else toast.error(res.error);
    },
  });

  const teams = teamsData?.teams ?? [];
  const companies = companiesData?.companies ?? [];

  if (blocked) return blocked;

  return (
    <>
      <PageHeader
        eyebrow="Access Control"
        title="Teams"
        description="Group people for approvals, dashboards, and reporting."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Teams" }]}
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create team</DialogTitle>
                <DialogDescription>
                  Teams are scoped to a company and can include any of its members.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium">Company</label>
                  <Select value={newCompanyId} onValueChange={setNewCompanyId}>
                    <SelectTrigger>
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
                  <label className="text-xs font-medium">Name</label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Field operations"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium">Description</label>
                  <Textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!newName.trim() || !newCompanyId || create.isPending}
                  onClick={() =>
                    create.mutate({
                      companyId: newCompanyId,
                      name: newName.trim(),
                      description: newDesc.trim() || undefined,
                    })
                  }
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <PageBody className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl border border-border bg-muted/30"
              />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <EmptyState
            icon={Group}
            title="No teams yet"
            description="Create your first team to start organising people."
            action={
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create team
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams.map((t) => (
              <div
                key={t.id}
                className="flex flex-col rounded-2xl border border-border bg-card/40 p-5"
                style={{ borderLeftColor: t.color, borderLeftWidth: 4 }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{t.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">
                      {t.company_name}
                    </p>
                  </div>
                  <Badge variant="secondary" className="rounded-full">
                    {t.member_count}
                  </Badge>
                </div>
                {t.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                )}
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Crown className="h-3 w-3" />
                  <span className="truncate">Lead: {t.lead_name ?? "Unassigned"}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-[10px] text-muted-foreground">
                    Created {fmtDate(t.created_at)}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTeamId(t.id)}
                    >
                      <UserPlus className="mr-1 h-3 w-3" />
                      Members
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Delete team "${t.name}"?`)) remove.mutate(t.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>

      {activeTeamId && (
        <TeamMembersDialog
          teamId={activeTeamId}
          companyId={teams.find((t) => t.id === activeTeamId)?.company_id ?? ""}
          onClose={() => setActiveTeamId(null)}
        />
      )}
    </>
  );
}

function TeamMembersDialog({
  teamId,
  companyId,
  onClose,
}: {
  teamId: string;
  companyId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [pickUserId, setPickUserId] = useState<string>("");

  const { data: membersData } = useQuery({
    queryKey: ["admin", "team-members", teamId],
    queryFn: () => listTeamMembers({ data: { teamId } }),
  });
  const { data: candidatesData } = useQuery({
    queryKey: ["admin", "team-candidates", companyId],
    queryFn: () => listCompanyMemberCandidates({ data: { companyId } }),
    enabled: !!companyId,
  });

  const add = useMutation({
    mutationFn: (vars: { userId: string }) =>
      addTeamMember({ data: { teamId, userId: vars.userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "team-members", teamId] });
      qc.invalidateQueries({ queryKey: ["admin", "teams"] });
      setPickUserId("");
    },
  });
  const remove = useMutation({
    mutationFn: (userId: string) => removeTeamMember({ data: { teamId, userId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "team-members", teamId] });
      qc.invalidateQueries({ queryKey: ["admin", "teams"] });
    },
  });
  const lead = useMutation({
    mutationFn: (userId: string) => setTeamLead({ data: { teamId, userId } }),
    onSuccess: () => {
      toast.success("Team lead updated");
      qc.invalidateQueries({ queryKey: ["admin", "team-members", teamId] });
      qc.invalidateQueries({ queryKey: ["admin", "teams"] });
    },
  });

  const members = membersData?.members ?? [];
  const memberIds = new Set(members.map((m) => m.user_id));
  const candidates = (candidatesData?.members ?? []).filter((c) => !memberIds.has(c.user_id));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Team members</DialogTitle>
          <DialogDescription>
            Add company members to this team and choose a team lead.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Select value={pickUserId} onValueChange={setPickUserId}>
            <SelectTrigger>
              <SelectValue placeholder="Add member…" />
            </SelectTrigger>
            <SelectContent>
              {candidates.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  No company members available
                </div>
              ) : (
                candidates.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.full_name ?? c.user_id.slice(0, 8)}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!pickUserId || add.isPending}
            onClick={() => add.mutate({ userId: pickUserId })}
          >
            Add
          </Button>
        </div>

        <div className="max-h-80 space-y-1 overflow-y-auto">
          {members.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">
              No members yet.
            </p>
          ) : (
            members.map((m) => (
              <div
                key={m.user_id}
                className="flex items-center gap-2 rounded-lg border border-border bg-background/40 p-2"
              >
                <Avatar className="h-7 w-7">
                  {m.avatar_url && <AvatarImage src={m.avatar_url} />}
                  <AvatarFallback className="text-[10px]">
                    {(m.full_name ?? "?").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.full_name ?? m.user_id.slice(0, 8)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Joined {fmtDate(m.added_at)}
                  </p>
                </div>
                {m.is_lead && (
                  <Badge variant="secondary" className="rounded-full text-[10px]">
                    <Crown className="mr-1 h-3 w-3" />
                    Lead
                  </Badge>
                )}
                {!m.is_lead && (
                  <Button size="sm" variant="ghost" onClick={() => lead.mutate(m.user_id)}>
                    <Crown className="h-3 w-3" />
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(m.user_id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
