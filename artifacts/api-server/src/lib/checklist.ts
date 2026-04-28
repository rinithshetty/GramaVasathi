export const DEFAULT_CHECKLIST_ITEMS: { key: string; label: string }[] = [
  { key: "clean_room", label: "Clean room" },
  { key: "drinking_water", label: "Drinking water" },
  { key: "hot_meals", label: "Hot meals available" },
  { key: "bedding_linens", label: "Bedding & linens" },
  { key: "working_bathroom", label: "Working bathroom" },
  { key: "mobile_network", label: "Mobile network" },
  { key: "first_aid", label: "First-aid kit" },
  { key: "activity_guide", label: "Local activity guide" },
];

export function defaultChecklistItems(): {
  key: string;
  label: string;
  checked: boolean;
}[] {
  return DEFAULT_CHECKLIST_ITEMS.map((i) => ({ ...i, checked: false }));
}

export function computeScore(
  items: { key: string; checked: boolean }[],
): number {
  if (items.length === 0) return 0;
  const checked = items.filter((i) => i.checked).length;
  return Math.round((checked / items.length) * 100);
}

export function mergeChecklist(
  saved: { key: string; checked: boolean }[],
): { key: string; label: string; checked: boolean }[] {
  const map = new Map(saved.map((i) => [i.key, i.checked]));
  return DEFAULT_CHECKLIST_ITEMS.map((d) => ({
    key: d.key,
    label: d.label,
    checked: map.get(d.key) ?? false,
  }));
}
