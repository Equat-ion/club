"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Layers, Users, Zap, ShieldCheck } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await authClient.signUp.email({
      name,
      email,
      password,
    });

    if (error) {
      toast.error(error.message || "Failed to create account");
      setLoading(false);
      return;
    }

    toast.success("Account created! Redirecting...");
    router.push("/app");
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
              Your student<br />org deserves<br />better tools
            </h1>
            <p className="text-muted-foreground text-base xl:text-lg leading-relaxed max-w-xs">
              Set up your workspace in minutes. No credit card required.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { icon: Users, text: "Invite your team in seconds" },
              { icon: Zap, text: "Tasks, teams, and members in one place" },
              { icon: ShieldCheck, text: "Role-based access for every member" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className="size-4 text-primary shrink-0" />
                <span className="text-sm text-muted-foreground">{text}</span>
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
              Create your account
            </h2>
            <p className="text-muted-foreground text-sm">
              Get started with Club for your student org.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-[11px] uppercase font-bold tracking-wider"
              >
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="h-11"
              />
            </div>
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
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className="h-11"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 font-bold uppercase tracking-wider"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-primary font-bold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
