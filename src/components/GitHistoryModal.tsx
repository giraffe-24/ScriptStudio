"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type MirrorCommit = {
  sha: string;
  message: string;
  authorName: string;
  date: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  episodeNumber: number;
  episodeSlug: string;
  filename: string;
  /** 表示用ラベル（例: 「企画書」）。 */
  label: string;
  /** 選んだ版の内容で置き換える。呼び出し側で保存・再ミラーされる。 */
  onRestore: (content: string) => Promise<void>;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ja-JP", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/** コミットメッセージの1行目（sync: prefix を除いて読みやすく）。 */
function summarize(message: string): string {
  const first = message.split("\n")[0] ?? "";
  return first.replace(/^sync:\s*/, "");
}

export function GitHistoryModal({
  open,
  onOpenChange,
  episodeNumber,
  episodeSlug,
  filename,
  label,
  onRestore,
}: Props) {
  const [commits, setCommits] = useState<MirrorCommit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contents, setContents] = useState<Record<string, string>>({});
  const [expandedSha, setExpandedSha] = useState<string | null>(null);
  const [confirmSha, setConfirmSha] = useState<string | null>(null);
  const [busySha, setBusySha] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setError("");
    setContents({});
    setExpandedSha(null);
    setConfirmSha(null);

    const params = new URLSearchParams({
      action: "list",
      number: String(episodeNumber),
      slug: episodeSlug,
      filename,
    });
    fetch(`/api/git-history?${params.toString()}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "履歴の取得に失敗しました");
        setCommits(data.commits ?? []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setCommits([]);
      })
      .finally(() => setLoading(false));
  }, [open, episodeNumber, episodeSlug, filename]);

  async function fetchContent(sha: string): Promise<string> {
    if (contents[sha] != null) return contents[sha];
    const params = new URLSearchParams({
      action: "content",
      number: String(episodeNumber),
      slug: episodeSlug,
      filename,
      sha,
    });
    const res = await fetch(`/api/git-history?${params.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "内容の取得に失敗しました");
    const content = String(data.content ?? "");
    setContents((prev) => ({ ...prev, [sha]: content }));
    return content;
  }

  async function toggleDetail(sha: string) {
    if (expandedSha === sha) {
      setExpandedSha(null);
      return;
    }
    setError("");
    try {
      await fetchContent(sha);
      setExpandedSha(sha);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleRestore(sha: string) {
    setBusySha(sha);
    setError("");
    try {
      const content = await fetchContent(sha);
      await onRestore(content);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusySha(null);
      setConfirmSha(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{label}の変更履歴（Git）</DialogTitle>
          <DialogDescription>
            保存のたびに専用リポジトリへ記録された版から復元できます。
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(28rem,70vh)] space-y-3 overflow-y-auto">
          {loading && <p className="text-xs text-muted-foreground">読み込み中…</p>}
          {!loading && commits.length === 0 && !error && (
            <p className="text-xs text-muted-foreground">まだ記録がありません。</p>
          )}
          {commits.map((commit, index) => {
            const isLatest = index === 0;
            const isExpanded = expandedSha === commit.sha;
            return (
              <div key={commit.sha} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-medium">
                      [{commit.authorName}] {formatDate(commit.date)}
                    </p>
                    {isLatest && (
                      <span className="mt-1 inline-block rounded bg-secondary px-1.5 py-0.5 text-xs text-secondary-foreground">
                        最新
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-foreground">{summarize(commit.message)}</p>

                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => void toggleDetail(commit.sha)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <ChevronUp className="size-3.5" aria-hidden />
                  ) : (
                    <ChevronDown className="size-3.5" aria-hidden />
                  )}
                  {isExpanded ? "内容を閉じる" : "内容を見る"}
                </button>

                {isExpanded ? (
                  <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-2 font-mono text-xs leading-relaxed">
                    {contents[commit.sha] ?? ""}
                  </pre>
                ) : null}

                {confirmSha === commit.sha ? (
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-xs text-destructive flex-1">
                      現在の{label}をこの版で置き換えます。よろしいですか？
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmSha(null)}
                      disabled={busySha === commit.sha}
                    >
                      取消
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleRestore(commit.sha)}
                      disabled={busySha === commit.sha}
                    >
                      {busySha === commit.sha ? "復元中…" : "確定"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setConfirmSha(commit.sha)}
                    disabled={!!busySha || isLatest}
                    title={isLatest ? "最新の版です" : undefined}
                  >
                    この版に戻す
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            閉じる
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
