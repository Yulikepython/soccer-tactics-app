/**
 * アプリケーション全体で使用する型定義
 */

// 要素タイプの定義
export type ElementType = 'player' | 'opponent' | 'goalkeeper' | 'ball' | 'cone';

// ライン（線）タイプの定義
export type LineType = 'dribble' | 'pass' | 'run';

// モードタイプの定義（要素タイプとラインタイプの組み合わせ）
export type ModeType = ElementType | LineType | null;

// 2D座標を表す型
export interface Point {
    x: number;
    y: number;
}

// 要素のサイズを表す型
export interface ElementSize {
    radius: number;
    coneSize: number;
    strokeWidth: number;
}

// ドラッグオフセットの型
export interface DragOffset {
    x: number;
    y: number;
}

// ドラッグ操作時の可視性オフセット設定の型
export interface DragVisibilityOffset {
    defaultOffset: number;
    currentOffset: Point;
    transitionDuration: number;
}

// SVGビューボックスのサイズ定義
export interface ViewBoxDimensions {
    width: number;
    height: number;
}

// イベント情報を統一するインターフェース
export interface NormalizedEventData {
    clientX: number;
    clientY: number;
    preventDefault?: () => void;
}