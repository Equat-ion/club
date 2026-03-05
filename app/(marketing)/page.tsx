import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Club — Your student org, all in one place",
  description:
    "Club gives student-led organisations a shared home to organise their work. Manage tasks, coordinate teams, and grow your community — all from one modular platform.",
  openGraph: {
    title: "Club — Your student org, all in one place",
    description:
      "Club gives student-led organisations a shared home to organise their work. Manage tasks, coordinate teams, and grow your community.",
  },
  twitter: {
    title: "Club — Your student org, all in one place",
    description:
      "Club gives student-led organisations a shared home to organise their work. Manage tasks, coordinate teams, and grow your community.",
  },
};

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Club
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Your student org,
            <br />
            all in one place.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Club gives student-led organisations a shared home to organise their
            work. Manage tasks, coordinate teams, and grow your community — all
            from one modular platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg">Start for Free</Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          Built for student communities.
        </div>
      </footer>
    </div>
  );
}
