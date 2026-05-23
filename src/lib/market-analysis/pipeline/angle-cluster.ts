import Anthropic from "@anthropic-ai/sdk";
import { buildAngleClusterPrompt, loadMarketAnalysisRubric } from "../prompts";

function extractJsonObject(text: string): string | null {
  const match = text.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

export async function runAngleClusterStage(
  systemPrompt: string,
  promptData: Parameters<typeof buildAngleClusterPrompt>[0],
): Promise<string> {
  const rubric = promptData.rubric || (await loadMarketAnalysisRubric());
  const userPrompt = buildAngleClusterPrompt({ ...promptData, rubric });
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const model =
    process.env.ANTHROPIC_MODEL_STAGE1 ??
    process.env.ANTHROPIC_MODEL ??
    "claude-sonnet-4-20250514";

  const message = await client.messages.create({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text : "{}";
  const json = extractJsonObject(text);
  return json ?? text;
}
