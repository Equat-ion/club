"use client";

import { cn } from "@/lib/utils";
import type { SettingsSection } from "./settings-sections";

export function SettingsSectionNav({
  sections,
  activeSectionId,
  onNavigate,
}: {
  sections: SettingsSection[];
  activeSectionId: string;
  onNavigate: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Settings sections"
      className="sticky top-20"
    >
      <ol className="w-56 space-y-1.5">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              data-active={section.id === activeSectionId}
              onClick={() => onNavigate(section.id)}
              className={cn(
                "w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:text-foreground",
                section.id === activeSectionId && "bg-accent text-foreground",
              )}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
