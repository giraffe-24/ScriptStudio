export type SiteAccessCredential = {
  username: string;
  password: string;
};

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  let diff = 0;
  for (let i = 0; i < bufA.length; i++) {
    diff |= bufA[i] ^ bufB[i];
  }
  return diff === 0;
}

function parseCredentialPair(raw: string): SiteAccessCredential | null {
  const colon = raw.indexOf(":");
  if (colon <= 0) return null;
  const username = raw.slice(0, colon).trim();
  const password = raw.slice(colon + 1);
  if (!username || !password) return null;
  return { username, password };
}

export function getSiteAccessCredentials(): SiteAccessCredential[] {
  const multi = process.env.SITE_ACCESS_CREDENTIALS?.trim();
  if (multi) {
    const parsed = multi
      .split(",")
      .map((part) => parseCredentialPair(part.trim()))
      .filter((c): c is SiteAccessCredential => c !== null);
    if (parsed.length > 0) return parsed;
  }

  const password = process.env.SITE_ACCESS_PASSWORD?.trim();
  if (!password) return [];

  const username = process.env.SITE_ACCESS_USER?.trim() || "reviewer";
  return [{ username, password }];
}

export function isSiteAccessEnabled(): boolean {
  return getSiteAccessCredentials().length > 0;
}

export function verifySiteAccess(
  username: string,
  password: string,
  credentials: SiteAccessCredential[],
): boolean {
  return credentials.some(
    (c) => safeEqual(username, c.username) && safeEqual(password, c.password),
  );
}

export function decodeBasicAuth(
  header: string | null,
): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(header.slice(6));
    const colon = decoded.indexOf(":");
    if (colon < 0) return null;
    return {
      username: decoded.slice(0, colon),
      password: decoded.slice(colon + 1),
    };
  } catch {
    return null;
  }
}
