export const CALIB_MARKER = "<<<SCRIPTSTUDIO_CALIB_SPLIT>>>";

/**
 * 執筆テンプレ（config/calibration.md）がマーカー直後に置くプレースホルダー行。
 * 利用者の貼り付けではないため calib としては空扱いにし、エディタでは
 * textarea の placeholder が見えるようにする。旧形式（（推敲比較用）…）も落とす。
 */
const CALIB_PLACEHOLDER_RE = /^（推敲比較用）|^（この下に確定稿を貼り付け）$/;

function stripCalibPlaceholder(calib: string): string {
  return calib
    .split("\n")
    .filter((line) => !CALIB_PLACEHOLDER_RE.test(line.trim()))
    .join("\n")
    .trim();
}

export function splitScriptCalib(raw: string): { main: string; calib: string } {
  const idx = raw.indexOf(CALIB_MARKER);
  if (idx === -1) return { main: raw, calib: "" };
  return {
    main: raw.slice(0, idx).trim(),
    calib: stripCalibPlaceholder(raw.slice(idx + CALIB_MARKER.length)),
  };
}

export function combineScriptCalib(main: string, calib: string): string {
  return calib.trim()
    ? `${main}\n\n${CALIB_MARKER}\n\n${calib}`
    : main;
}

export function hasScriptDraft(content: string): boolean {
  return splitScriptCalib(content).main.trim().length > 0;
}

export function hasRevision(content: string): boolean {
  return splitScriptCalib(content).calib.trim().length > 0;
}
