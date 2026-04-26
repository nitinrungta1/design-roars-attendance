import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthShell } from "@/components/auth/auth-shell";
import { GoogleButton } from "@/components/auth/google-button";
import { seo } from "@/lib/seo";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => seo({ title: "Create account", description: "Start using Punchly free.", kind: "product", path: "/signup", noindex: true }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth-callback`,
        data: { full_name: fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created! Welcome to Punchly.");
      navigate({ to: "/admin" });
    } else {
      toast.success("Check your email to confirm your account.");
    }
  };

  return (
    <AuthShell
      title="Create your Punchly account"
      subtitle="Free to start. No credit card required."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-4">
        <GoogleButton label="Sign up with Google" />
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card/80 px-2 text-muted-foreground">or</span>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90"
          >
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
