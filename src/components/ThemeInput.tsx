"use client";

import { useState } from "react";
import type { ThemeCandidate, ThemePattern } from "@/lib/types";

interface Props {
  pattern: ThemePattern;
  onSelect: (candidate: ThemeCandidate) => void;
}

const SAMPLE_MARKET: ThemeCandidate[] = [
  {
    title: "【40代50代向け】Gmailの未読が0になる！受信トレイ整理術5選",
    hook: "毎朝メールを開くたびに未読が何百件…もう見るのが怖い、そんな方に今日は劇的に変わる方法をお伝えします",
    targetPain: "メールが溜まりすぎて何から手をつければいいか分からない・見落としが怖い",
    reason: "「Gmail 整理」は検索ボリュームが高く、ITに不慣れな層が求める「一度やれば解決する設定系」と相性が良い",
    score: "high",
  },
  {
    title: "Googleカレンダーとスマホを完全同期！予定を二重管理しない方法",
    hook: "手帳とスマホとPCで予定がバラバラ、ダブルブッキングしたことがある方、今日から1つにまとめられます",
    targetPain: "複数デバイス・複数ツールで予定がバラバラ、管理が面倒",
    reason: "Google カレンダーとスマホ連携は「知っているようで知らない」層が多く、ハウツー需要が安定して高い",
    score: "high",
  },
  {
    title: "Androidのバッテリーが長持ちする！今すぐできる設定7つ",
    hook: "夕方には電池が残り10%…充電器を持ち歩くのが当たり前になっていませんか？",
    targetPain: "バッテリーの減りが早い、外出先で充電切れが心配",
    reason: "「バッテリー 長持ち 設定」は常に検索上位。操作手順が明確で再現性が高く、視聴完了率が出やすい",
    score: "high",
  },
  {
    title: "Google フォトで家族の写真を自動整理！アルバム作成を全自動化する",
    hook: "スマホの容量がいっぱいで写真が撮れない…でも消すのは怖い。そんな方に今日は完全解決の方法を",
    targetPain: "写真が溜まりすぎてスマホ容量がいっぱい、整理する時間がない",
    reason: "Google フォトの自動バックアップ・アルバム機能は50代以上に需要が高く、家族向けコンテンツとして差別化できる",
    score: "high",
  },
  {
    title: "LINEの通知をすっきり整理！重要な連絡だけ受け取る設定方法",
    hook: "LINEの通知が鳴るたびにびっくりして…でも全部オフにすると大事な連絡を見逃しそう",
    targetPain: "LINE通知が多すぎてストレス、でも全オフにするのは不安",
    reason: "LINEの通知管理はシニア層の悩みトップ3に入る定番テーマ。設定画面の解説が具体的に作れる",
    score: "medium",
  },
  {
    title: "Googleマップのここがすごい！知らないと損する便利機能5選",
    hook: "Googleマップって道案内だけじゃないんです。今日紹介する使い方、きっとまだ知らないはず",
    targetPain: "地図アプリを「ナビ専用」でしか使っていない、便利機能を活用できていない",
    reason: "Googleマップの隠し機能は「知っていると得した気分になれる」ネタとして拡散されやすく、保存率も高い",
    score: "medium",
  },
  {
    title: "スマホのストレージが一瞬で空く！今すぐ削除すべき3つのもの",
    hook: "「空き容量が不足しています」この通知、何度見ても嫌ですよね。今日5分で解決できます",
    targetPain: "スマホの空き容量がなく動作が重い・新しいアプリが入れられない",
    reason: "ストレージ不足は40〜60代スマホユーザーの最頻出トラブル。具体的な削除手順が明快で再現性100%",
    score: "medium",
  },
  {
    title: "パスワードをもう覚えなくていい！Googleパスワードマネージャー完全活用術",
    hook: "パスワードを忘れるたびに「パスワードを忘れた方はこちら」…もうその繰り返しから解放されます",
    targetPain: "パスワードを忘れて毎回再設定している・同じパスワードを使い回してしまっている",
    reason: "パスワード管理の悩みは世代を超えた普遍的テーマ。Googleの無料機能で解決できる点がチャンネルブランドと一致",
    score: "medium",
  },
];

const SAMPLE_ADAPT = (theme: string): ThemeCandidate[] => [
  {
    title: `【40代50代向け】${theme}を3ステップで完全解決`,
    hook: `「${theme}」って難しそう…そう思っていた方、今日は誰でも5分でできる方法をお伝えします`,
    targetPain: "やり方が分からず後回しにしている・失敗が怖い",
    reason: "具体的なステップ数と「誰でもできる」訴求でクリック率が上がる定番フォーマット",
    score: "high",
  },
  {
    title: `知らないと損する「${theme}」完全ガイド`,
    hook: `実は「${theme}」を使いこなすだけで、毎日の◯◯が劇的に楽になります。今日初めて知る方も多いはず`,
    targetPain: "存在は知っているが使い方が分からず活用できていない",
    reason: "「知らないと損する」は損失回避心理を刺激する鉄板フック。検索意図とマッチしやすい",
    score: "high",
  },
  {
    title: `${theme}の設定はこれだけでOK！時短で終わる手順を解説`,
    hook: `「${theme}の設定って面倒そう」と避けていた方、実は10分あれば全部終わります`,
    targetPain: "設定が複雑そうで取り掛かれない・時間がかかりそうで後回しにしている",
    reason: "「時短」「これだけでOK」は行動障壁を下げるワードとして再生数・保存率の両方に効く",
    score: "high",
  },
  {
    title: `${theme}を使いこなせている人は10人に1人！今すぐ差をつける方法`,
    hook: `周りの人が知らない「${theme}」の使い方、今日だけで3つ覚えられます`,
    targetPain: "なんとなく使っているが、ちゃんと活用できているか自信がない",
    reason: "希少性と優越感を同時に刺激する切り口。視聴者が「共有したくなる」動画になりやすい",
    score: "high",
  },
  {
    title: `やってみたら感動した！${theme}の意外な便利技5選`,
    hook: `「こんなことできたの？」今日紹介する機能、知った瞬間にすぐ試したくなるはずです`,
    targetPain: "日常的に使っているが機能の半分も活用できていない",
    reason: "「やってみたら」は共感・追体験を促す表現。保存率・高評価率が上がりやすいエンタメ寄りの訴求",
    score: "medium",
  },
  {
    title: `${theme}が苦手な人に贈る！これだけ覚えれば十分な基本操作`,
    hook: `「難しそうで避けていた」という方、今日は一番シンプルな使い方だけを丁寧に解説します`,
    targetPain: "機能が多すぎて何から始めればいいか分からず手が出せない",
    reason: "完全初心者向けの入門コンテンツは検索流入が安定し、チャンネル登録につながりやすい",
    score: "medium",
  },
  {
    title: `${theme}でよくある失敗TOP3とその対処法`,
    hook: `「せっかく設定したのに上手くいかない」そのモヤモヤ、今日ぜんぶ解決します`,
    targetPain: "試したが失敗した経験があり、また挑戦するのが怖い",
    reason: "失敗談・トラブル解決系は当事者意識が高く、コメント欄が盛り上がりやすいテーマ",
    score: "medium",
  },
];

const SCORE_BORDER = {
  high: "border-blue-300",
  medium: "border-yellow-300",
  low: "border-gray-200",
};

const SCORE_BG = {
  high: "bg-blue-50",
  medium: "bg-yellow-50",
  low: "bg-gray-50",
};

const SCORE_BADGE = {
  high: "bg-blue-100 text-blue-700 border-blue-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-500 border-gray-200",
};

// high: 積極的に採用を推奨 / medium: 標準的な候補 / low: 参考程度・再検討余地あり
const SCORE_LABEL = { high: "推奨", medium: "普通", low: "要検討" };

export function ThemeInput({ pattern, onSelect }: Props) {
  const [userTheme, setUserTheme] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<ThemeCandidate[]>([]);
  const [hasYouTubeData, setHasYouTubeData] = useState(false);

  const [pickedIndex, setPickedIndex] = useState<number | null>(null);
  // アコーディオンで開いている候補のインデックス（複数可）
  const [openIndexes, setOpenIndexes] = useState<Set<number>>(new Set());

  function toggleOpen(i: number) {
    setOpenIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleResearch() {
    setLoading(true);
    setCandidates([]);
    setPickedIndex(null);
    setOpenIndexes(new Set());
    try {
      if (pattern === "market") {
        const res = await fetch("/api/market-research", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ category }),
        });
        const data = await res.json();
        const results: ThemeCandidate[] = data.candidates ?? [];
        setCandidates(results.length > 0 ? results : SAMPLE_MARKET);
        setHasYouTubeData(data.hasYouTubeData ?? false);
      } else {
        const res = await fetch("/api/adapt-theme", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: userTheme }),
        });
        const data = await res.json();
        const results: ThemeCandidate[] = data.candidates ?? [];
        setCandidates(results.length > 0 ? results : SAMPLE_ADAPT(userTheme));
      }
    } catch (e) {
      console.error("ThemeInput fetch error:", e);
      setCandidates(pattern === "market" ? SAMPLE_MARKET : SAMPLE_ADAPT(userTheme));
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (pickedIndex === null) return;
    onSelect(candidates[pickedIndex]);
  }

  return (
    <div className="space-y-4">
      {/* 入力エリア */}
      {pattern === "market" ? (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            カテゴリ（空白でも OK）
          </label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="例：Gmail, Android, Google フォト"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            onKeyDown={(e) => e.key === "Enter" && handleResearch()}
          />
        </div>
      ) : (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            テーマを入力
          </label>
          <input
            type="text"
            value={userTheme}
            onChange={(e) => setUserTheme(e.target.value)}
            placeholder="例：LINEの通知をまとめて管理する方法"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            onKeyDown={(e) => e.key === "Enter" && handleResearch()}
          />
        </div>
      )}

      <button
        onClick={handleResearch}
        disabled={loading || (pattern === "user-input" && !userTheme.trim())}
        className={`w-full rounded-lg py-2.5 text-sm font-medium transition-all ${
          loading
            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
            : pattern === "market"
            ? "bg-blue-500 text-white hover:bg-blue-600"
            : "bg-purple-500 text-white hover:bg-purple-600"
        }`}
      >
        {loading
          ? "AI が分析中…"
          : pattern === "market"
          ? "📊 トレンド分析する"
          : "✨ テーマを改変する"}
      </button>

      {/* 候補リスト */}
      {candidates.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              テーマ候補
            </h3>
            {pattern === "market" && (
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full ${
                  hasYouTubeData
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {hasYouTubeData ? "YouTube API" : "AI 知識ベース"}
              </span>
            )}
          </div>

          {candidates.map((c, i) => {
            const isPicked = pickedIndex === i;
            const isOpen = openIndexes.has(i);
            return (
              <div
                key={i}
                className={`border-2 rounded-xl overflow-hidden transition-all ${
                  isPicked
                    ? `${SCORE_BORDER[c.score]} ${SCORE_BG[c.score]} shadow-sm`
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                {/* タイトル行：選択 + アコーディオン開閉 */}
                <div className="flex items-start gap-2 p-3">
                  <button
                    onClick={() => setPickedIndex(i)}
                    className="flex-1 text-left"
                  >
                    <span className="text-xs text-gray-700 leading-snug">
                      {c.title}
                    </span>
                  </button>
                  <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                        SCORE_BADGE[c.score]
                      }`}
                    >
                      {SCORE_LABEL[c.score]}
                    </span>
                    {/* アコーディオントグル */}
                    <button
                      onClick={() => toggleOpen(i)}
                      className="text-gray-400 hover:text-gray-600 text-xs leading-none w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                      aria-label="詳細を表示"
                    >
                      <span className={`inline-block transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                        ▾
                      </span>
                    </button>
                  </div>
                </div>

                {/* アコーディオン本体 */}
                {isOpen && (
                  <div className="border-t border-gray-100 px-3 pb-3 pt-2 space-y-2.5 bg-white bg-opacity-60">
                    {/* フック（青） */}
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                        フック
                      </p>
                      <p className="text-xs text-blue-600 italic leading-relaxed">
                        「{c.hook}」
                      </p>
                    </div>
                    {/* 視聴者の悩み（黒） */}
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        視聴者の悩み
                      </p>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {c.targetPain}
                      </p>
                    </div>
                    {/* 選定理由 */}
                    {c.reason && (
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                          選定理由
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {c.reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* 確定ボタン */}
          <div className="pt-1">
            <button
              onClick={handleConfirm}
              disabled={pickedIndex === null}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pickedIndex !== null
                  ? "bg-blue-500 text-white hover:bg-blue-600 shadow-sm active:scale-[0.98]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {pickedIndex !== null
                ? "企画書を作成する →"
                : "候補を選んでください"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
