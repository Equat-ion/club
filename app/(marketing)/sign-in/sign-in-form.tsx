"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Layers, CheckCircle2 } from "lucide-react";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      toast.error(error.message || "Failed to sign in");
      setLoading(false);
      return;
    }

    router.push(redirect);
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Branding */}
      <div className="hidden md:flex w-5/12 flex-col bg-card border-r border-border p-12 xl:p-16">
        <div className="flex items-center gap-3 mb-16">
          <div className="size-10 bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
            <Layers className="size-6" />
          </div>
          <span className="text-foreground text-xl font-bold tracking-tight uppercase">
            Club
          </span>
        </div>

        <div className="flex-1 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl xl:text-5xl font-black text-foreground leading-tight tracking-tighter uppercase">
              Sign in<br />to your<br />workspace
            </h1>
            <p className="text-muted-foreground text-base xl:text-lg leading-relaxed max-w-xs">
              Access your organisation's tasks, teams, and tools — all in one
              place.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              "Task management & tracking",
              "Team coordination tools",
              "Member management",
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <CheckCircle2 className="size-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-12">
          <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
            © 2025-2026 Club. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center px-6 md:px-12 xl:px-16 bg-background">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile-only branding */}
          <div className="flex items-center gap-3 md:hidden">
            <div className="size-8 bg-primary flex items-center justify-center text-primary-foreground">
              <Layers className="size-4" />
            </div>
            <span className="text-foreground text-lg font-bold tracking-tight uppercase">
              Club
            </span>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-black tracking-tight uppercase">
              Welcome back
            </h2>
            <p className="text-muted-foreground text-sm">
              Enter your credentials to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[11px] uppercase font-bold tracking-wider"
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-[11px] uppercase font-bold tracking-wider"
              >
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-bold uppercase tracking-wider"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{" "}
            <Link
              href="/sign-up"
              className="text-primary font-bold hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
