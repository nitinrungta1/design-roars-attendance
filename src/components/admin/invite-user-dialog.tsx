import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteUser, PLATFORM_ROLES, type PlatformRole } from "@/lib/platform-users.functions";

export function InviteUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PlatformRole>("employee");

  const reset = () => {
    setFullName("");
    setEmail("");
    setRole("employee");
  };

  const invite = useMutation({
    mutationFn: () => inviteUser({ data: { email: email.trim(), full_name: fullName.trim(), role } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Invite sent to ${email}`);
        qc.invalidateQueries({ queryKey: ["admin", "platform-users"] });
        reset();
        onOpenChange(false);
      } else {
        toast.error("Failed to send invite", { description: res.error });
      }
    },
    onError: (e: Error) => toast.error("Failed to send invite", { description: e.message }),
  });

  const canSubmit = fullName.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            An invite email will be sent. The user sets their own password when they accept.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as PlatformRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLATFORM_ROLES.map((r) => (
                  <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => invite.mutate()} disabled={!canSubmit || invite.isPending} className="gap-1.5">
            <Mail className="h-4 w-4" />
            {invite.isPending ? "Sending…" : "Send invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
