"use client";

import { useEffect, useState } from "react";
import type { ThemeCandidate, ChatMessage } from "@/lib/types";
import { ChatPane } from "./ChatPane";

interface Plan {
  episodeTitle: string;
  youtubeGoal: string;
  targetViewer: string;
  pain: string;
  promise: string;
  keyPoints: string[];
  outline: { section: string; content: string }[];
  competitorAnalysis: string;
  estimatedLength: string;
}

interface Props {
  candidate: ThemeCandidate | null;
  onPlanReady: (plan: Plan, title: string) => void;
}

export function PlanningDoc({ candidate, onPlanReady }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatSection, setChatSection] = useState<{ label: string; content: string } | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [editingTitle, setEditingTitle] = useState("");

  useEffect(() => {
    if (!candidate) return;
    generatePlan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);

  async function generatePlan() {
    if (!candidate) return;
    setLoading(true);
    setPlan(null);
    setChatSection(null);
    setChatHistory([]);

    const res = await fetch("/api/generate-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        theme: candidate.title,
        hook: candidate.hook,
        targetPain: candidate.targetPain,
        reason: candidate.reason,
      }),
    });
    const data = await res.json();
    setPlan(data.plan ?? null);
    setEditingTitle(data.plan?.episodeTitle ?? "");
    setLoading(false);
  }

  function handleSectionChat(label: string, content: string) {
    setChatSection({ label, content });
    setChatHistory([]);
  }

  function updateSection(key: keyof Plan, value: string | string[]) {
    if (!plan) return;
    setPlan({ ...plan, [key]: value });
  }

  function updateOutlineContent(index: number, value: string) {
    if (!plan) return;
    const newOutline = [...plan.outline];
    newOutline[index] = { ...newOutline[index], content: value };
    setPlan({ ...plan, outline: newOutline });
  }

  if (!candidate) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-sm">テーマを選択すると企画書が生成されます</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">✍️</div>
          <p className="text-sm text-gray-500">企画書を生成中…</p>
          <p className="text-xs text-gray-400 mt-1">通常 10〜20 秒かかります</p>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-700 text-sm">企画書</h2>
          <button
            onClick={() => onPlanReady(plan, editingTitle)}
            className="bg-blue-500 text-white text-xs px-4 py-1.5 rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            台本を生成 →
          </button>
        </div>

        {/* タイトル */}
        <PlanField label="動画タイトル" icon="🎬">
          <input
            value={editingTitle}
            onChange={(e) => {
              setEditingTitle(e.target.value);
              updateSection("episodeTitle", e.target.value);
            }}
            className="w-full text-sm font-semibold text-gray-800 border-b border-gray-200 pb-1 focus:outline-none focus:border-blue-400 bg-transparent"
          />
        </PlanField>

        {/* YouTube ゴール */}
        <PlanField label="YouTube ゴール" icon="🎯" onChat={() => handleSectionChat("YouTubeゴール", plan.youtubeGoal)}>
          <EditableText value={plan.youtubeGoal} onChange={(v) => updateSection("youtubeGoal", v)} />
        </PlanField>

        {/* 想定視聴者 */}
        <PlanField label="想定視聴者" icon="👤" onChat={() => handleSectionChat("想定視聴者", plan.targetViewer)}>
          <EditableText value={plan.targetViewer} onChange={(v) => updateSection("targetViewer", v)} />
        </PlanField>

        {/* 視聴者の悩み */}
        <PlanField label="視聴者の悩み" icon="😰" onChat={() => handleSectionChat("視聴者の悩み", plan.pain)}>
          <EditableText value={plan.pain} onChange={(v) => updateSection("pain", v)} />
        </PlanField>

        {/* 動画の約束 */}
        <PlanField label="動画の約束（視聴者が得る価値）" icon="✅" onChat={() => handleSectionChat("動画の約束", plan.promise)}>
          <EditableText value={plan.promise} onChange={(v) => updateSection("promise", v)} />
        </PlanField>

        {/* コンテンツの核 */}
        <PlanField label="コンテンツの核" icon="💡" onChat={() => handleSectionChat("コンテンツの核", plan.keyPoints.join("\n"))}>
          <ul className="space-y-1">
            {plan.keyPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-blue-400 text-xs mt-1">●</span>
                <input
                  value={point}
                  onChange={(e) => {
                    const newPoints = [...plan.keyPoints];
                    newPoints[i] = e.target.value;
                    updateSection("keyPoints", newPoints);
                  }}
                  className="flex-1 text-sm text-gray-700 border-b border-gray-100 focus:outline-none focus:border-blue-300 bg-transparent"
                />
              </li>
            ))}
          </ul>
        </PlanField>

        {/* 構成 */}
        <PlanField label="構成" icon="📐" onChat={() => handleSectionChat("構成", plan.outline.map(o => `${o.section}：${o.content}`).join("\n"))}>
          <div className="space-y-2">
            {plan.outline.map((item, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-xs text-gray-400 font-mono whitespace-nowrap mt-1">{item.section}</span>
                <input
                  value={item.content}
                  onChange={(e) => updateOutlineContent(i, e.target.value)}
                  className="flex-1 text-sm text-gray-700 border-b border-gray-100 focus:outline-none focus:border-blue-300 bg-transparent"
                />
              </div>
            ))}
          </div>
        </PlanField>

        {/* 差別化 */}
        <PlanField label="競合との差別化" icon="⚡" onChat={() => handleSectionChat("差別化", plan.competitorAnalysis)}>
          <EditableText value={plan.competitorAnalysis} onChange={(v) => updateSection("competitorAnalysis", v)} />
        </PlanField>

        <div className="text-right text-xs text-gray-400 pt-2">
          想定尺：{plan.estimatedLength}
        </div>
      </div>

      {chatSection && (
        <ChatPane
          theme={candidate.title}
          sectionLabel={chatSection.label}
          sectionContent={chatSection.content}
          history={chatHistory}
          onHistoryUpdate={setChatHistory}
          onClose={() => setChatSection(null)}
        />
      )}
    </div>
  );
}

function PlanField({
  label,
  icon,
  children,
  onChat,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
  onChat?: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
          <span>{icon}</span> {label}
        </span>
        {onChat && (
          <button
            onClick={onChat}
            className="text-[10px] text-gray-400 hover:text-blue-500 border border-gray-200 hover:border-blue-300 px-2 py-0.5 rounded-full transition-colors"
          >
            AI と深掘り
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function EditableText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-sm text-gray-700 resize-none border-0 focus:outline-none bg-transparent leading-relaxed"
      rows={3}
    />
  );
}
