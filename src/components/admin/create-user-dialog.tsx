import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  APP_ROLES,
  createPlatformUser,
  listCompaniesLite,
  type AppRole,
} from "@/lib/access.functions";

export function CreateUserDialog() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AppRole>("employee");
  const [companyId, setCompanyId] = useState<string>("__none__");
  const [sendInvite, setSendInvite] = useState(true);

  const companies = useQuery({
    queryKey: ["admin", "companies-lite"],
    queryFn: () => listCompaniesLite(),
    enabled: open,
  });

  const create = useMutation({
    mutationFn: () =>
      createPlatformUser({
        data: {
          email: email.trim(),
          fullName: fullName.trim(),
          password: sendInvite ? undefined : password,
          role,
          companyId: companyId === "__none__" ? null : companyId,
          sendInvite,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(sendInvite ? "Invitation sent" : "User created");
        qc.invalidateQueries({ queryKey: ["admin", "platform-users"] });
        setOpen(false);
        setFullName("");
        setEmail("");
        setPassword("");
        setRole("employee");
      } else {
        toast.error(res.error ?? "Failed to create user");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit =
    fullName.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(email) &&
    (sendInvite || password.length >= 8);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 gap-1.5">
          <UserPlus className="h-4 w-4" />
          Create user
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create platform user</DialogTitle>
          <DialogDescription>
            Add a teammate to your workspace. They will appear in the user list immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@company.com"
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Send invite email</p>
              <p className="text-xs text-muted-foreground">
                {sendInvite
                  ? "User sets their own password via email link."
                  : "You set an initial password below."}
              </p>
            </div>
            <Switch checked={sendInvite} onCheckedChange={setSendInvite} />
          </div>

          {!sendInvite && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Initial password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APP_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Company</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No company</SelectItem>
                  {(companies.data?.companies ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!canSubmit || create.isPending}
          >
            {create.isPending ? "Saving…" : sendInvite ? "Send invite" : "Create user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
