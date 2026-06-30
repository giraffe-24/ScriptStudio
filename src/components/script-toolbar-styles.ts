/** 台本ペイン共通ボタンスタイル（上段・下段で統一） */

export const scriptBtnBase =
  "text-xs font-medium px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:border-ring outline-none";

export const scriptBtnSecondary = `${scriptBtnBase} border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50`;

export const scriptBtnTertiary = `${scriptBtnBase} border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50`;

export const scriptBtnPrimaryBlue = `${scriptBtnBase} border border-transparent bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50`;

export const scriptBtnPrimaryOrange = `${scriptBtnBase} border border-transparent bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50`;

export const scriptBtnPrimaryBlueFill = `${scriptBtnBase} border border-transparent bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50`;

export const scriptBtnAbort = `${scriptBtnBase} border border-transparent bg-destructive/10 text-destructive hover:bg-destructive/20 disabled:opacity-50`;

export const scriptBtnDisabled = `${scriptBtnBase} border border-transparent bg-muted text-muted-foreground cursor-not-allowed`;
