export function evaluateEnterpriseGroupAlignment(input: {
  mappedGroups: string[];
  scimGroups: string[];
  samlGroups: string[];
}) {
  const mapped = new Set(input.mappedGroups);
  const scim = new Set(input.scimGroups);

  for (const group of input.samlGroups) {
    if (!scim.has(group)) {
      return { state: "mismatch" as const };
    }
  }

  const scimMapped = input.scimGroups.filter((group) => mapped.has(group));
  const samlMapped = input.samlGroups.filter((group) => mapped.has(group));

  if (samlMapped.length === 0 && scimMapped.length === 0) {
    return { state: "unmapped" as const };
  }

  return { state: "aligned" as const };
}
