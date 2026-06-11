export const CALIB_MARKER = "<<<SCRIPTSTUDIO_CALIB_SPLIT>>>";

export function splitScriptCalib(raw: string): { main: string; calib: string } {
  const idx = raw.indexOf(CALIB_MARKER);
  if (idx === -1) return { main: raw, calib: "" };
  return {
    main: raw.slice(0, idx).trim(),
    calib: raw.slice(idx + CALIB_MARKER.length).trim(),
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
