const RETIRED_ANTHROPIC_MODELS = new Set([
  "claude-3-5-haiku-20241022",
  "claude-3-5-sonnet-20241022",
  // 2026-06-15 廃止（API が 404 not_found を返す）。env で指定されても無視して既定へ落とす。
  "claude-sonnet-4-20250514",
  "claude-opus-4-20250514",
]);

function sanitizeModel(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (RETIRED_ANTHROPIC_MODELS.has(trimmed)) return null;
  return trimmed;
}

function firstDefined(...values: Array<string | null>): string | null {
  for (const value of values) {
    if (value) return value;
  }
  return null;
}

export function getAnthropicModel(
  kind:
    | "summary"
    | "planning"
    | "inferPlan"
    | "script"
    | "sectionChat"
    | "themeAdapt"
    | "marketStage1"
    | "marketStage2",
): string {
  const globalModel = sanitizeModel(process.env.ANTHROPIC_MODEL);

  switch (kind) {
    case "summary":
      return (
        firstDefined(
          sanitizeModel(process.env.ANTHROPIC_MODEL_SUMMARY),
          sanitizeModel(process.env.ANTHROPIC_MODEL_STAGE1),
          globalModel,
        ) ?? "claude-sonnet-5"
      );
    case "marketStage1":
      return (
        firstDefined(
          sanitizeModel(process.env.ANTHROPIC_MODEL_STAGE1),
          globalModel,
        ) ?? "claude-sonnet-5"
      );
    case "marketStage2":
      return (
        firstDefined(
          sanitizeModel(process.env.ANTHROPIC_MODEL_STAGE2),
          globalModel,
        ) ?? "claude-opus-4-7"
      );
    case "planning":
    case "inferPlan":
      return (
        firstDefined(
          sanitizeModel(process.env.ANTHROPIC_MODEL_PLANNING),
          sanitizeModel(process.env.ANTHROPIC_MODEL_STAGE2),
          globalModel,
        ) ?? "claude-opus-4-7"
      );
    case "script":
      return (
        firstDefined(
          sanitizeModel(process.env.ANTHROPIC_MODEL_SCRIPT),
          sanitizeModel(process.env.ANTHROPIC_MODEL_STAGE2),
          globalModel,
        ) ?? "claude-opus-4-7"
      );
    case "sectionChat":
      return (
        firstDefined(
          sanitizeModel(process.env.ANTHROPIC_MODEL_SECTION_CHAT),
          sanitizeModel(process.env.ANTHROPIC_MODEL_STAGE2),
          globalModel,
        ) ?? "claude-opus-4-7"
      );
    case "themeAdapt":
      return (
        firstDefined(
          sanitizeModel(process.env.ANTHROPIC_MODEL_THEME_ADAPT),
          sanitizeModel(process.env.ANTHROPIC_MODEL_STAGE2),
          globalModel,
        ) ?? "claude-opus-4-7"
      );
  }
}
