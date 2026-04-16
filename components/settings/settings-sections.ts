export type SettingsSection = {
  id: "org-name" | "logo" | "sso" | "danger";
  label: string;
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { id: "org-name", label: "Organization Name" },
  { id: "logo", label: "Logo" },
  { id: "sso", label: "Enterprise SSO" },
  { id: "danger", label: "Danger Zone" },
];
