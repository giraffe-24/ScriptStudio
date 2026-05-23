import Anthropic from "@anthropic-ai/sdk";
import type { EnrichedCandidate } from "@/lib/types";
import { buildCandidateGeneratePrompt, loadMarketAnalysisRubric } from "../prompts";

function extractJsonArray(text: string): EnrichedCandidate[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    return JSON.parse(match[0]) as EnrichedCandidate[];
  } catch {
    return [];
  }
}

export async function runCandidateGenerateStage(
  systemPrompt: string,
  promptData: Parameters<typeof buildCandidateGeneratePrompt>[0],
): Promise<EnrichedCandidate[]> {
  const rubric = promptData.rubric || (await loadMarketAnalysisRubric());
  const userPrompt = buildCandidateGeneratePrompt({ ...promptData, rubric });
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const model =
    process.env.ANTHROPIC_MODEL_STAGE2 ??
    process.env.ANTHROPIC_MODEL ??
    "claude-opus-4-5";

  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "[]";
  return extractJsonArray(text);
}
