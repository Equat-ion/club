export type SettingsSection = {
  id: "org-name" | "logo" | "enterprise" | "danger";
  label: string;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "org-name", label: "Organization Name" },
  { id: "logo", label: "Logo" },
  { id: "enterprise", label: "Enterprise" },
  { id: "danger", label: "Danger Zone" },
];
