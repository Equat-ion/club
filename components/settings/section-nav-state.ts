type IntersectionLike = {
  id: string;
  isIntersecting: boolean;
};

export function pickActiveSectionId(
  entries: IntersectionLike[],
  currentId: string,
  orderedIds: string[],
) {
  const visible = entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => orderedIds.indexOf(a.id) - orderedIds.indexOf(b.id));

  return visible[0]?.id ?? currentId;
}
