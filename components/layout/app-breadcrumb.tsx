"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

const SECTION_LABELS: Record<string, string> = {
  home: "Home",
  members: "Members",
  tasks: "Tasks",
  teams: "Teams",
  settings: "Settings",
  billing: "Billing",
  plugins: "Plugins",
  calendar: "Calendar",
};

export function AppBreadcrumb() {
  const pathname = usePathname();

  // Pathname structure: /app/[slug]/[section]/[...rest]
  const parts = pathname.split("/").filter(Boolean);
  // parts[0] = "app", parts[1] = slug, parts[2] = section, parts[3+] = sub-pages

  if (parts.length < 3) return null;

  const slug = parts[1];
  const section = parts[2];
  const subPage = parts[3];

  const sectionLabel = SECTION_LABELS[section] ?? section;
  const sectionHref = `/app/${slug}/${section}`;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1.5 text-sm min-w-0"
    >
      {subPage ? (
        <>
          <Link
            href={sectionHref}
            className="text-muted-foreground hover:text-foreground transition-colors truncate"
          >
            {sectionLabel}
          </Link>
          <span className="text-muted-foreground/40 select-none">/</span>
          <span className="font-semibold text-foreground truncate">Detail</span>
        </>
      ) : (
        <span className="font-semibold text-foreground">{sectionLabel}</span>
      )}
    </nav>
  );
}
