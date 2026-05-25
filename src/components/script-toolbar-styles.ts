/** 台本ペイン共通ボタンスタイル（上段・下段で統一） */

export const scriptBtnBase =
  "text-xs font-medium px-3 py-1 rounded-md transition-colors disabled:cursor-not-allowed";

export const scriptBtnSecondary = `${scriptBtnBase} border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40`;

export const scriptBtnTertiary = `${scriptBtnBase} border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40`;

export const scriptBtnPrimaryBlue = `${scriptBtnBase} border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40`;

export const scriptBtnPrimaryOrange = `${scriptBtnBase} bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40`;

export const scriptBtnPrimaryRed = `${scriptBtnBase} bg-red-500 text-white hover:bg-red-600 disabled:opacity-40`;

export const scriptBtnPrimaryBlueFill = `${scriptBtnBase} bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-40`;

export const scriptBtnDisabled = `${scriptBtnBase} bg-gray-100 text-gray-400 border border-transparent cursor-not-allowed`;
