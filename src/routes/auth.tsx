import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { auth, setToken } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Syde Hustle" },
      {
        name: "description",
        content: "Create your Syde Hustle account or log in to track your points and payouts.",
      },
      { property: "og:title", content: "Sign in — Syde Hustle" },
      {
        property: "og:description",
        content: "Secure login for your Syde Hustle points ledger and mobile money payouts.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("Enter a valid email address");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setBusy(true);
    try {
      const res =
        mode === "signup"
          ? await auth.signup(email, password)
          : await auth.login(email, password);
      const token = res?.token ?? res?.access_token;
      if (!token) throw new Error("No token returned");
      setToken(token);
      toast.success(mode === "signup" ? "Account created" : "Welcome back");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center px-5 py-12">
      <div className="text-center">
        <p className="font-display text-2xl font-bold tracking-tight">
          Syde <span className="text-gradient-gold">Hustle</span>
        </p>
        <h1 className="mt-3 text-lg font-semibold">
          {mode === "signup" ? "Create your account" : "Log in to your wallet"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your points, balance and payouts stay tied to your account.
        </p>
      </div>

      <div className="glass-card mt-8 rounded-3xl p-5 shadow-glow">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/50 p-1">
          {(["login", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              data-active={m === mode}
              className="rounded-xl py-2 text-sm font-semibold text-muted-foreground transition-colors data-[active=true]:bg-gold data-[active=true]:text-gold-foreground"
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-sm outline-none focus:border-gold"
            />
          </label>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-bold text-gold-foreground shadow-gold transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busy && <Loader2 className="size-4 animate-spin" />}
            {mode === "signup" ? "Create account" : "Log in"}
          </button>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-gold" />
            Sessions are secured with a bearer token issued by the Syde Hustle API.
          </p>
        </form>
      </div>
    </div>
  );
}
