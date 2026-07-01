/**
 * GitHub ミラー: Supabase 上のエピソードファイル（企画・台本・manifest 等）の
 * 変更を、専用リポジトリ/ブランチへ「保存のたびに 1 コミット」で反映する。
 *
 * 目的は「排他ロックはかけないが、いつでも過去の版に戻せるようにする」こと。
 * 上書き（後勝ち）は許容するが、上書き前の版もコミットとして GitHub に残るため、
 * 誰の変更も失われず、任意の時点へ復元できる。
 *
 * 未設定（トークン/リポジトリ未指定）なら何もしない = 既存挙動そのまま。
 * 失敗しても呼び出し側（episode-files-store）が握りつぶすため、保存自体は止めない。
 *
 * 必要な環境変数:
 *   GITHUB_MIRROR_REPO    "owner/repo"（コミット先。ソースとは別の専用リポ推奨）
 *   GITHUB_MIRROR_TOKEN   contents:read+write 権限のトークン（GITHUB_TOKEN でも可）
 *   GITHUB_MIRROR_BRANCH  省略時 "main"
 *   GITHUB_MIRROR_EMAIL   省略時 "scriptstudio@users.noreply.github.com"
 */

const GITHUB_API = "https://api.github.com";

type MirrorConfig = {
  repo: string;
  branch: string;
  token: string;
  email: string;
};

function readConfig(): MirrorConfig | null {
  const repo = process.env.GITHUB_MIRROR_REPO?.trim();
  const token =
    process.env.GITHUB_MIRROR_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim();
  if (!repo || !repo.includes("/") || !token) return null;
  return {
    repo,
    token,
    branch: process.env.GITHUB_MIRROR_BRANCH?.trim() || "main",
    email:
      process.env.GITHUB_MIRROR_EMAIL?.trim() ||
      "scriptstudio@users.noreply.github.com",
  };
}

export function isGitMirrorConfigured(): boolean {
  return readConfig() !== null;
}

/** パスの各セグメントを URL エンコード（スラッシュは残す。日本語フォルダ「没」等に対応）。 */
function encodeContentPath(relPath: string): string {
  return relPath.split("/").map(encodeURIComponent).join("/");
}

function toBase64(content: string): string {
  return Buffer.from(content, "utf-8").toString("base64");
}

function commitMessage(summary: string, actor: string | null): string {
  return `sync: ${summary} (by ${actor?.trim() || "unknown"})`;
}

function signature(config: MirrorConfig, actor: string | null) {
  return { name: actor?.trim() || "ScriptStudio", email: config.email };
}

async function githubFetch(
  config: MirrorConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function getFileSha(
  config: MirrorConfig,
  relPath: string,
): Promise<string | null> {
  const res = await githubFetch(
    config,
    `/repos/${config.repo}/contents/${encodeContentPath(relPath)}?ref=${encodeURIComponent(config.branch)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub GET contents ${relPath}: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { sha?: string };
  return data.sha ?? null;
}

/** コミット先ブランチが無ければ、デフォルトブランチの HEAD から作成する。 */
async function ensureBranch(config: MirrorConfig): Promise<void> {
  const refRes = await githubFetch(
    config,
    `/repos/${config.repo}/git/ref/heads/${encodeURIComponent(config.branch)}`,
  );
  if (refRes.ok) return;
  if (refRes.status !== 404) {
    throw new Error(`GitHub GET ref: ${refRes.status} ${await refRes.text()}`);
  }

  const repoRes = await githubFetch(config, `/repos/${config.repo}`);
  if (!repoRes.ok) {
    throw new Error(`GitHub GET repo: ${repoRes.status} ${await repoRes.text()}`);
  }
  const defaultBranch = ((await repoRes.json()) as { default_branch?: string })
    .default_branch;
  if (!defaultBranch) {
    // 空リポジトリ等: ブランチを作れない。README 等で初期化しておく必要がある。
    throw new Error(
      "ミラー先リポジトリが初期化されていません（README 等で最初のコミットを作成してください）",
    );
  }
  if (defaultBranch === config.branch) return;

  const defRefRes = await githubFetch(
    config,
    `/repos/${config.repo}/git/ref/heads/${encodeURIComponent(defaultBranch)}`,
  );
  if (!defRefRes.ok) {
    throw new Error(`GitHub GET default ref: ${defRefRes.status} ${await defRefRes.text()}`);
  }
  const baseSha = ((await defRefRes.json()) as { object: { sha: string } }).object.sha;
  const createRes = await githubFetch(config, `/repos/${config.repo}/git/refs`, {
    method: "POST",
    body: JSON.stringify({ ref: `refs/heads/${config.branch}`, sha: baseSha }),
  });
  // 別リクエストが同時に作成した場合の 422 は許容
  if (!createRes.ok && createRes.status !== 422) {
    throw new Error(`GitHub create ref: ${createRes.status} ${await createRes.text()}`);
  }
}

/** ファイルを作成/更新（1 コミット）。同時保存による SHA 競合は数回リトライ。 */
export async function mirrorPutFile(
  relPath: string,
  content: string,
  actor: string | null,
  summary: string,
): Promise<void> {
  const config = readConfig();
  if (!config) return;
  await ensureBranch(config);

  for (let attempt = 0; attempt < 3; attempt++) {
    const sha = await getFileSha(config, relPath);
    const res = await githubFetch(
      config,
      `/repos/${config.repo}/contents/${encodeContentPath(relPath)}`,
      {
        method: "PUT",
        body: JSON.stringify({
          message: commitMessage(summary, actor),
          content: toBase64(content),
          branch: config.branch,
          committer: signature(config, actor),
          author: signature(config, actor),
          ...(sha ? { sha } : {}),
        }),
      },
    );
    if (res.ok) return;
    // 409/422: 直前に他の保存でブランチ HEAD が進んだ → SHA を取り直して再試行
    if (res.status === 409 || res.status === 422) continue;
    throw new Error(`GitHub PUT ${relPath}: ${res.status} ${await res.text()}`);
  }
  throw new Error(`GitHub PUT ${relPath}: 競合が解消せず失敗しました`);
}

export type MirrorCommit = {
  sha: string;
  message: string;
  authorName: string;
  date: string;
};

/** 指定ファイルを変更したコミット一覧（新しい順）。未設定/履歴なしは空配列。 */
export async function listFileCommits(
  relPath: string,
  limit = 50,
): Promise<MirrorCommit[]> {
  const config = readConfig();
  if (!config) return [];
  const res = await githubFetch(
    config,
    `/repos/${config.repo}/commits?path=${encodeURIComponent(relPath)}&sha=${encodeURIComponent(config.branch)}&per_page=${limit}`,
  );
  // 404/409: リポジトリ/ブランチが空、または対象パスの履歴なし
  if (res.status === 404 || res.status === 409) return [];
  if (!res.ok) {
    throw new Error(`GitHub list commits ${relPath}: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as Array<{
    sha: string;
    commit: { message: string; author?: { name?: string; date?: string } };
  }>;
  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    authorName: c.commit.author?.name ?? "unknown",
    date: c.commit.author?.date ?? "",
  }));
}

/** 指定コミット時点のファイル内容（テキスト）。無ければ null。 */
export async function getFileContentAtRef(
  relPath: string,
  ref: string,
): Promise<string | null> {
  const config = readConfig();
  if (!config) return null;
  const res = await githubFetch(
    config,
    `/repos/${config.repo}/contents/${encodeContentPath(relPath)}?ref=${encodeURIComponent(ref)}`,
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub get content ${relPath}@${ref}: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as { content?: string; encoding?: string };
  if (!data.content || (data.encoding && data.encoding !== "base64")) return null;
  return Buffer.from(data.content, "base64").toString("utf-8");
}

/** ファイルを削除（1 コミット）。存在しなければ何もしない。 */
export async function mirrorDeleteFile(
  relPath: string,
  actor: string | null,
  summary: string,
): Promise<void> {
  const config = readConfig();
  if (!config) return;

  const sha = await getFileSha(config, relPath);
  if (!sha) return;
  const res = await githubFetch(
    config,
    `/repos/${config.repo}/contents/${encodeContentPath(relPath)}`,
    {
      method: "DELETE",
      body: JSON.stringify({
        message: commitMessage(summary, actor),
        branch: config.branch,
        sha,
        committer: signature(config, actor),
        author: signature(config, actor),
      }),
    },
  );
  if (!res.ok && res.status !== 404) {
    throw new Error(`GitHub DELETE ${relPath}: ${res.status} ${await res.text()}`);
  }
}
