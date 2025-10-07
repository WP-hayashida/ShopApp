import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSSのクラスを結合・マージするためのユーティリティ関数
 * clsxとtailwind-mergeを組み合わせて、クラス名の重複や競合を解決します。
 * @param inputs - 結合するクラス名のリスト
 * @returns マージされたクラス名の文字列
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
