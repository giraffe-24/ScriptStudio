export const SITE_ACCESS_SESSION_COOKIE = "scriptstudio_session";

export type SiteAccessCredential = {
  username: string;
  password: string;
};

function getSessionSecret(): string {
  const fromEnv = process.env.SITE_ACCESS_SECRET?.trim();
  if (fromEnv) return fromEnv;
  return getSiteAccessCredentials()
    .map((c) => `${c.username}:${c.password}`)
    .join("|");
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(username: string): Promise<string> {
  const key = await importHmacKey(getSessionSecret());
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(username),
  );
  const sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${encodeURIComponent(username)}.${sig}`;
}

export async function verifySessionToken(
  token: string,
): Promise<string | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const username = decodeURIComponent(token.slice(0, dot));
  const sig = token.slice(dot + 1);
  if (!username || !sig) return null;

  const key = await importHmacKey(getSessionSecret());
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(atob(sig), (c) => c.charCodeAt(0)),
      new TextEncoder().encode(username),
    );
    return valid ? username : null;
  } catch {
    return null;
  }
}

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
