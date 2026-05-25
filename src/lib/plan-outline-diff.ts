import type { OutlineItem } from "@/lib/script-outline";
import type { PlanFingerprintInput } from "@/lib/plan-fingerprint";

export function parsePlanFingerprint(fingerprint?: string): PlanFingerprintInput | null {
  if (!fingerprint) return null;
  try {
    return JSON.parse(fingerprint) as PlanFingerprintInput;
  } catch {
    return null;
  }
}

export function getChangedSectionIndices(
  previousOutline: OutlineItem[] | undefined,
  currentOutline: OutlineItem[],
): number[] {
  if (!currentOutline.length) return [];
  if (!previousOutline?.length) {
    return currentOutline.map((_, index) => index);
  }

  const previousByName = new Map(previousOutline.map((item) => [item.section, item]));
  const changed: number[] = [];

  for (let index = 0; index < currentOutline.length; index++) {
    const current = currentOutline[index];
    const previous = previousByName.get(current.section);
    if (!previous || previous.content !== current.content) {
      changed.push(index);
    }
  }

  return changed;
}

export function getRemovedSectionNames(
  previousOutline: OutlineItem[] | undefined,
  currentOutline: OutlineItem[],
): string[] {
  if (!previousOutline?.length) return [];
  const currentNames = new Set(currentOutline.map((item) => item.section));
  return previousOutline.filter((item) => !currentNames.has(item.section)).map((item) => item.section);
}

export function collectSectionIndicesToRegenerate(
  previousOutline: OutlineItem[] | undefined,
  currentOutline: OutlineItem[],
): number[] {
  const indices = getChangedSectionIndices(previousOutline, currentOutline);
  if (!previousOutline?.length) return indices;

  const previousNames = new Set(previousOutline.map((item) => item.section));
  for (let index = 0; index < currentOutline.length; index++) {
    if (!previousNames.has(currentOutline[index].section)) {
      indices.push(index);
    }
  }

  return [...new Set(indices)].sort((a, b) => a - b);
}

export function hasOutlineStructureChange(
  previousOutline: OutlineItem[] | undefined,
  currentOutline: OutlineItem[],
): boolean {
  if (!previousOutline) return false;
  if (previousOutline.length !== currentOutline.length) return true;
  return previousOutline.some((item, index) => item.section !== currentOutline[index]?.section);
}
