/** エピソードフォルダ名 `{NN}-{slug}` を SSOT とする */

export type EpisodeIdentity = {
  number: number;
  slug: string;
  dirName: string;
};

const EPISODE_DIR_RE = /^(\d{1,3})-([a-zA-Z0-9][a-zA-Z0-9_-]*)$/;

export function episodeDirName(number: number, slug: string): string {
  return `${String(number).padStart(2, "0")}-${slug}`;
}

export function parseEpisodeDirName(dirName: string): EpisodeIdentity | null {
  const match = dirName.match(EPISODE_DIR_RE);
  if (!match) return null;
  const number = Number(match[1]);
  const slug = match[2];
  if (!Number.isInteger(number) || number <= 0 || !slug) return null;
  return { number, slug, dirName };
}

export function isValidEpisodeIdentity(number: number, slug: string): boolean {
  if (!Number.isInteger(number) || number <= 0) return false;
  const trimmed = slug.trim();
  if (!trimmed) return false;
  return parseEpisodeDirName(episodeDirName(number, trimmed)) !== null;
}

/** manifest の number/slug がフォルダ名と食い違うときはフォルダ名を正とする */
export function mergeManifestIdentity(
  identity: EpisodeIdentity,
  manifest: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...manifest,
    id: String(identity.number),
    slug: identity.slug,
  };
}

export function manifestNeedsIdentityRepair(
  identity: EpisodeIdentity,
  manifest: Record<string, unknown>,
): boolean {
  const manifestNumber = Number(manifest.id);
  const manifestSlug = typeof manifest.slug === "string" ? manifest.slug.trim() : "";
  return (
    !Number.isInteger(manifestNumber) ||
    manifestNumber <= 0 ||
    manifestNumber !== identity.number ||
    manifestSlug !== identity.slug
  );
}
