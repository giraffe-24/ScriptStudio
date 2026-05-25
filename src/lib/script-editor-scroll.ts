/** textarea 内の文字オフセット位置がビューポート上端に来るようスクロール */
export function scrollTextareaToCharOffset(
  textarea: HTMLTextAreaElement,
  text: string,
  charOffset: number,
): void {
  const safeOffset = Math.max(0, Math.min(charOffset, text.length));
  const lineIndex = text.slice(0, safeOffset).split("\n").length - 1;
  const style = window.getComputedStyle(textarea);
  const lineHeight = Number.parseFloat(style.lineHeight) || 22;

  textarea.focus();
  textarea.setSelectionRange(safeOffset, safeOffset);
  textarea.scrollTop = Math.max(0, lineIndex * lineHeight);
}
