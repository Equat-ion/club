import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  ClipboardList,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react"

import heroScreenshot from "../../assets/screenshot-1.png"
import settingsScreenshot from "../../assets/screenshot-2.png"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Club — isolated workspaces for student orgs",
  description:
    "Club gives every student organisation an isolated workspace for tasks, members, teams, billing, and plugins.",
  openGraph: {
    title: "Club — isolated workspaces for student orgs",
    description:
      "A premium, product-led workspace for student organisations with clear roles, org-scoped data, and first-party modules.",
  },
  twitter: {
    title: "Club — isolated workspaces for student orgs",
    description:
      "A premium, product-led workspace for student organisations with clear roles, org-scoped data, and first-party modules.",
  },
}

const productFacts = [
  {
    label: "Isolated workspace",
    value: "Your org gets a private workspace for all its people, work, and settings.",
    icon: ShieldCheck,
  },
  {
    label: "Clear roles",
    value: "Assign Admins to manage, Leads to organize, and Members to execute.",
    icon: Users,
  },
  {
    label: "Built-in tasks",
    value: "Track work with issue IDs, assignees, labels, and activity logs in one place.",
    icon: ClipboardList,
  },
  {
    label: "Modular tools",
    value: "Turn on tasks, teams, and billing features only when you need them.",
    icon: Sparkles,
  },
]

const workflowSteps = [
  {
    number: "01",
    title: "Create the org",
    description:
      "Set the slug, establish ownership, and start with a workspace that is already isolated from every other org.",
  },
  {
    number: "02",
    title: "Invite the right roles",
    description:
      "Admins manage the org, Leads run the work, and Members stay involved without access to settings they should not touch.",
  },
  {
    number: "03",
    title: "Run the day-to-day work",
    description:
      "Tasks, teams, members, and plugin content share one shell so the org feels coherent as it grows.",
  },
]

const roleRows = [
  {
    role: "Admin",
    scope: "Billing, org settings, invitations, and full plugin control.",
    limits: "Can do everything that defines the org itself.",
    tone: "bg-primary",
  },
  {
    role: "Lead",
    scope: "Members, tasks, and plugin content.",
    limits: "No billing or org settings access.",
    tone: "bg-secondary",
  },
  {
    role: "Member",
    scope: "View, collaborate, and contribute based on plugin permissions.",
    limits: "Read-mostly by default.",
    tone: "bg-accent",
  },
]

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-8 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-1/4 size-[28rem] rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-40 w-[120%] -translate-x-1/2 bg-[linear-gradient(90deg,transparent_0%,rgba(28,41,60,0.05)_50%,transparent_100%)]" />
      </div>

      <header className="relative z-10 border-b-2 border-foreground/10 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center border-2 border-foreground bg-primary shadow-[4px_4px_0_0_rgba(28,41,60,0.12)]">
              <Layers3 className="size-5 text-foreground" />
            </div>
            <div className="leading-none">
              <p className="text-lg font-extrabold uppercase tracking-[0.22em]">
                Club
              </p>
              <p className="text-[11px] uppercase tracking-[0.32em] text-muted-foreground">
                Thinkraft Labs
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            <Button
              asChild
              variant="ghost"
              className="rounded-sm font-semibold uppercase tracking-[0.2em]"
            >
              <Link href="#product">Product</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              className="rounded-sm font-semibold uppercase tracking-[0.2em]"
            >
              <Link href="#workflow">Workflow</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-sm border-2 border-foreground font-semibold uppercase tracking-[0.2em] shadow-[3px_3px_0_0_rgba(28,41,60,0.08)]"
            >
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative z-10">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="w-fit rounded-sm border-2 border-foreground bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.28em] text-foreground shadow-[3px_3px_0_0_rgba(28,41,60,0.08)]">
              Premium tech for student orgs
            </p>

            <h1
              className="mt-6 max-w-3xl text-5xl font-black tracking-[-0.04em] sm:text-6xl lg:text-7xl"
              style={{ textWrap: "balance" }}
            >
              One isolated workspace for your entire organisation.
            </h1>

            <p
              className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl"
              style={{ textWrap: "pretty" }}
            >
              Club gives your student organisation its own dedicated space. Manage tasks,
              members, teams, and billing within a clear, role-based system built
              specifically for student-led teams.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-sm border-2 border-foreground bg-primary px-6 font-bold uppercase tracking-[0.2em] text-foreground shadow-[5px_5px_0_0_rgba(28,41,60,0.14)] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-primary/90"
              >
                <Link href="/sign-up">
                  Create account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-sm border-2 border-foreground px-6 font-bold uppercase tracking-[0.2em] shadow-[5px_5px_0_0_rgba(28,41,60,0.08)]"
              >
                <Link href="#product">See the product</Link>
              </Button>
            </div>

            <div className="mt-10 border-y-2 border-foreground/10">
              <div className="grid gap-0 md:grid-cols-4">
                {productFacts.map((fact, index) => {
                  const Icon = fact.icon
                  return (
                    <div
                      key={fact.label}
                      className={`border-b-2 border-foreground/10 py-5 pr-5 md:border-b-0 ${
                        index < productFacts.length - 1
                          ? "md:border-r-2"
                          : ""
                      } md:border-foreground/10`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-sm bg-background">
                          <Icon className="size-4" />
                        </div>
                        <p className="text-sm font-bold uppercase tracking-[0.22em]">
                          {fact.label}
                        </p>
                      </div>
                      <p className="mt-3 max-w-[28ch] text-sm leading-6 text-muted-foreground">
                        {fact.value}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute inset-x-6 top-8 hidden h-full border-2 border-secondary bg-secondary/10 lg:block" />
            <div className="relative w-full overflow-hidden border-2 border-foreground bg-background shadow-[10px_10px_0_0_rgba(28,41,60,0.12)]">
              <div className="flex items-center justify-between border-b-2 border-foreground/10 px-4 py-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-muted-foreground">
                    Your workspaces
                  </p>
                  <p className="mt-1 text-lg font-black tracking-[-0.04em]">
                    Quickly switch between clubs
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-sm border-2 border-foreground bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground"
                >
                  Multi-tenant
                </Badge>
              </div>

              <Image
                src={heroScreenshot}
                alt="Club organization switcher preview"
                className="h-auto w-full object-cover"
                priority
              />

              <div className="grid divide-x-2 divide-foreground/10 border-t-2 border-foreground/10 sm:grid-cols-3">
                {[
                  ["Isolated", "Complete separation of workspaces."],
                  ["Role-based", "Clear permissions for every member."],
                  ["Unified", "All your tools in a single interface."],
                ].map(([title, detail]) => (
                  <div key={title} className="p-4">
                    <p className="text-sm font-bold uppercase tracking-[0.2em]">
                      {title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="relative z-10 border-y-2 border-foreground/10">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Product
            </p>
            <h2
              className="mt-4 max-w-xl text-3xl font-black tracking-[-0.04em] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              A dedicated system for your team's workflow.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              We don't mix your data with other communities. Your tasks, members, 
              and settings live in a completely isolated environment, giving you 
              absolute control over who sees what.
            </p>
          </div>

          <div className="border-2 border-foreground bg-card/40">
            <div className="grid gap-0">
              {[
                {
                  title: "Isolated workspace",
                  detail:
                    "Your org's data, members, and tasks are kept completely separate. No shared workspace blur.",
                },
                {
                  title: "Clear permissions",
                  detail:
                    "Assign Admin, Lead, and Member roles to ensure everyone has exactly the access they need without complex configurations.",
                },
                {
                  title: "Modular plugins",
                  detail:
                    "Enable tasks, teams, and billing modules as your organisation grows, all within the same familiar interface.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className={`grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,0.45fr)_minmax(0,0.55fr)] ${
                    index > 0 ? "border-t-2 border-foreground/10" : ""
                  }`}
                >
                  <div>
                    <p className="text-xl font-black tracking-[-0.04em]">
                      {item.title}
                    </p>
                  </div>
                  <p className="max-w-[60ch] text-base leading-7 text-muted-foreground">
                    {item.detail}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-foreground/10">
              <Image
                src={settingsScreenshot}
                alt="Club settings and enterprise configuration preview"
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section id="workflow" className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
                Workflow
              </p>
              <h2
                className="mt-4 max-w-xl text-3xl font-black tracking-[-0.04em] sm:text-4xl"
                style={{ textWrap: "balance" }}
              >
                Get your organisation running in three steps.
              </h2>
          </div>

          <div className="border-t-2 border-foreground/10">
              {[
                {
                  number: "01",
                  title: "Create your workspace",
                  description:
                    "Claim your org's slug, set up your profile, and get a clean slate isolated from everyone else.",
                },
                {
                  number: "02",
                  title: "Invite your team",
                  description:
                    "Add your Admins to manage the org, Leads to run projects, and Members to execute the work.",
                },
                {
                  number: "03",
                  title: "Manage the work",
                  description:
                    "Create tasks, assign teams, and manage your day-to-day operations in a unified platform.",
                },
              ].map((step, index) => (
                <div
                  key={step.number}
                  className={`grid gap-4 py-6 lg:grid-cols-[auto_minmax(0,0.38fr)_minmax(0,0.62fr)] ${
                    index > 0 ? "border-t-2 border-foreground/10" : ""
                  }`}
                >
                  <div className="font-mono text-sm font-bold tracking-[0.2em] text-muted-foreground">
                    {step.number}
                  </div>
                  <div>
                    <p className="text-xl font-black tracking-[-0.04em]">
                      {step.title}
                    </p>
                  </div>
                  <p className="max-w-[60ch] text-base leading-7 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y-2 border-foreground/10 bg-card/30">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-muted-foreground">
              Roles
            </p>
            <h2
              className="mt-4 max-w-xl text-3xl font-black tracking-[-0.04em] sm:text-4xl"
              style={{ textWrap: "balance" }}
            >
              Permissions built for student organisations.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              We use the vocabulary you already use. Every member gets the right 
              level of access by default, without wrestling with complex permission matrices.
            </p>
          </div>

          <div className="overflow-hidden border-2 border-foreground bg-background">
            <div className="hidden border-b-2 border-foreground/10 px-5 py-4 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground md:grid md:grid-cols-[0.18fr_0.35fr_0.47fr]">
              <div>Role</div>
              <div>Scope</div>
              <div>Limits</div>
            </div>

            {roleRows.map((row, index) => (
              <div
                key={row.role}
                className={`grid gap-4 px-5 py-5 md:grid-cols-[0.18fr_0.35fr_0.47fr] ${
                  index > 0 ? "border-t-2 border-foreground/10" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-1 size-3 rounded-sm ${row.tone}`} />
                  <p className="text-lg font-black tracking-[-0.04em]">
                    {row.role}
                  </p>
                </div>
                <p className="text-sm leading-7 text-foreground">
                  <span className="mr-2 font-bold uppercase tracking-[0.2em] text-muted-foreground md:hidden">
                    Scope
                  </span>
                  {row.scope}
                </p>
                <p className="text-sm leading-7 text-muted-foreground">
                  <span className="mr-2 font-bold uppercase tracking-[0.2em] text-muted-foreground md:hidden">
                    Limits
                  </span>
                  {row.limits}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-8 border-2 border-foreground bg-primary p-8 shadow-[8px_8px_0_0_rgba(28,41,60,0.12)] md:p-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-foreground/80">
                Start here
              </p>
              <h2
                className="mt-4 max-w-2xl text-3xl font-black tracking-[-0.04em] sm:text-4xl"
                style={{ textWrap: "balance" }}
              >
                Ready to organise your club?
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground">
                Stop wrestling with scattered documents and mismatched tools. Set up 
                your org's dedicated workspace today and bring your team together.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-sm border-2 border-foreground bg-background px-6 font-bold uppercase tracking-[0.2em] text-foreground shadow-[5px_5px_0_0_rgba(28,41,60,0.14)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-background/90"
              >
                <Link href="/sign-up">
                  Get started
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 rounded-sm border-2 border-foreground bg-transparent px-6 font-bold uppercase tracking-[0.2em] shadow-[5px_5px_0_0_rgba(28,41,60,0.08)] hover:bg-background"
              >
                <Link href="#product">Review the product</Link>
              </Button>
            </div>
          </div>

          <footer className="flex flex-col gap-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <p>Built for student communities that need structure without clutter.</p>
            <p>Club by Thinkraft Labs.</p>
          </footer>
        </div>
      </section>
    </main>
  )
}
