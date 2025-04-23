/**
 * TacticsBoard.ts
 * サッカー作戦盤のメインクラス
 * - SVG要素の管理
 * - イベント処理
 * - 要素の追加・削除
 * - タッチ/マウス操作
 */

import { TacticsElement } from './TacticsElement.js';
import { TacticsLine } from './TacticsLine.js';
import { TacticsComment } from './TacticsComment.js';
import { TouchCoordinateHandler } from '../utils/coordinate/TouchCoordinateHandler.js';
import {
    ElementType,
    LineType,
    ModeType,
    Point,
    ViewBoxDimensions
} from '../types/types';

export class TacticsBoard {
    // プロパティ定義
    private currentMode: ModeType = null;
    private elements: TacticsElement[] = [];
    private lines: TacticsLine[] = [];
    private isDragging = false;
    private selectedElement: TacticsElement | null = null;
    private currentLine: TacticsLine | null = null;
    private isMobile: boolean;
    private svg!: SVGSVGElement; // 初期化は必ず行われるので ! を使用
    private touchCoordinateHandler!: TouchCoordinateHandler;
    private comment!: TacticsComment;
    private container: HTMLElement | null;

    constructor() {
        // 状態管理
        this.isMobile = window.innerWidth <= 768;
        this.container = document.getElementById('container');

        // 初期化順序を制御
        this.initializeComponents();
        this.setupEventListeners();

        // 開発用ログ
        this.logInitialization();
    }

    /**
     * コンポーネントの初期化
     * 初期化順序が重要な要素を適切な順序で初期化
     */
    private initializeComponents(): void {
        // 1. フィールドの初期化（SVG要素の作成）
        this.initializeField();

        // 2. 座標ハンドラーの初期化（SVG要素が必要）
        this.touchCoordinateHandler = new TouchCoordinateHandler(this.svg);

        // 3. コメント機能の初期化
        this.comment = new TacticsComment();
    }

    /**
     * フィールドの初期化
     * SVG要素の作成とフィールドラインの描画
     */
    private initializeField(): void {
        if (!this.container) {
            throw new Error('Container element not found');
        }

        // SVG要素の作成
        this.svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement;
        this.setupSVGAttributes();

        // フィールドラインの描画
        const fieldLines = document.createElementNS("http://www.w3.org/2000/svg", "g");
        fieldLines.innerHTML = this.getFieldLinesHTML();

        this.svg.appendChild(fieldLines);
        this.container.appendChild(this.svg);

        // コメントエリアの設定
        this.setupCommentArea();
    }

    /**
     * SVG要素の属性設定
     */
    private setupSVGAttributes(): void {
        const attributes: Record<string, string> = {
            'width': '100%',
            'height': '100%',
            'viewBox': '0 0 600 1000',
            'style': 'background-color: #88cc88; touch-action: none;',
            'data-testid': 'tactics-board-svg'
        };

        Object.entries(attributes).forEach(([key, value]) => {
            this.svg.setAttribute(key, value);
        });
    }

    /**
     * イベントリスナーの設定
     */
    private setupEventListeners(): void {
        // ウィンドウのリサイズイベント
        window.addEventListener('resize', this.handleResize.bind(this));

        // コントロールボタンのイベント
        this.setupControlButtons();

        // SVGのタッチ/マウスイベント
        this.setupInteractionEvents();
    }

    /**
     * コントロールボタンの設定
     */
    private setupControlButtons(): void {
        // モード切替ボタン
        document.querySelectorAll('#controls [data-mode]').forEach(button => {
            button.addEventListener('click', () => this.handleModeChange(button as HTMLElement));
        });

        // 機能ボタン
        const buttons: Record<string, () => void> = {
            'clear-lines': () => this.clearLines(),
            'screenshot-button': () => this.takeScreenshot(),
            'clear-mode': () => this.clearMode()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', handler);
            }
        });
    }

    /**
     * インタラクションイベントの設定
     */
    private setupInteractionEvents(): void {
        if (!this.svg) return;

        const events = {
            touch: {
                start: ['touchstart', this.handleTouchStart.bind(this), { passive: false }],
                move: ['touchmove', this.handleTouchMove.bind(this), { passive: false }],
                end: ['touchend', this.handleTouchEnd.bind(this)]
            },
            mouse: {
                down: ['mousedown', this.handleMouseDown.bind(this)],
                move: ['mousemove', this.handleMouseMove.bind(this)],
                up: ['mouseup', this.handleMouseUp.bind(this)],
                leave: ['mouseleave', this.handleMouseUp.bind(this)]
            }
        };

        // タッチイベント
        if ('ontouchstart' in window) {
            Object.values(events.touch).forEach(([event, handler, options]) => {
                this.svg.addEventListener(
                    event as string,
                    handler as EventListenerOrEventListenerObject,
                    options as AddEventListenerOptions
                );
            });
        }

        // マウスイベント
        Object.values(events.mouse).forEach(([event, handler]) => {
            this.svg.addEventListener(
                event as string,
                handler as EventListenerOrEventListenerObject
            );
        });
    }

    /**
     * 要素の追加
     */
    addElement(type: ElementType, x: number, y: number): TacticsElement {
        const element = new TacticsElement(type, x, y);
        element.onDelete = (elem: TacticsElement) => {
            const index = this.elements.indexOf(elem);
            if (index > -1) {
                this.elements.splice(index, 1);
            }
        };
        this.elements.push(element);
        this.svg.appendChild(element.getNode());
        return element;
    }

    /**
     * 要素の削除
     */
    removeElement(node: SVGElement): void {
        const index = this.elements.findIndex(item => item.node === node);
        if (index > -1) {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
            this.elements.splice(index, 1);
        }
    }

    /**
     * ラインの追加
     */
    addLine(type: LineType, startX: number, startY: number): TacticsLine | null {
        try {
            const line = new TacticsLine(type, startX, startY);
            this.lines.push(line);
            this.svg.appendChild(line.getNode());
            return line;
        } catch (error) {
            console.error('Failed to add line:', error);
            return null;
        }
    }

    /**
     * マウス位置の取得
     */
    getMousePosition(e: MouseEvent | Touch): Point {
        const rect = this.svg.getBoundingClientRect();
        const scaleX = this.svg.viewBox.baseVal.width / rect.width;
        const scaleY = this.svg.viewBox.baseVal.height / rect.height;

        // MouseEventの場合はclientX/Yを使用、TouchはそのままclientX/Yを持っている
        const clientX = e.clientX;
        const clientY = e.clientY;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    /**
     * タッチイベントハンドラー
     */
    handleTouchStart(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.touches[0];
        const point = this.getMousePosition(touch);

        // 既存の要素をタッチした場合
        const clickedElement = this.findClickedElement(point);
        if (clickedElement) {
            this.selectedElement = clickedElement;
            this.selectedElement.startInteraction(point.x, point.y);
            return;
        }

        // 新しい要素や線の追加
        if (this.isLineMode()) {
            const line = this.addLine(this.currentMode as LineType, point.x, point.y);
            this.currentLine = line;
        } else if (this.currentMode) {
            this.addElement(this.currentMode as ElementType, point.x, point.y);
        }
    }

    handleTouchMove(e: TouchEvent): void {
        e.preventDefault();
        const touch = e.touches[0];
        const point = this.getMousePosition(touch);

        // 要素のドラッグ処理
        if (this.selectedElement?.isDragging) {
            this.selectedElement.drag(point.x, point.y);
            return;
        }

        // ライン更新処理
        if (this.currentLine) {
            this.currentLine.updateEnd(point.x, point.y);
        }
    }

    handleTouchEnd(): void {
        // 要素のドラッグ終了処理
        if (this.selectedElement) {
            this.selectedElement.stopInteraction();
            this.selectedElement = null;
        }
        this.currentLine = null;
    }

    /**
     * マウスイベントハンドラー
     */
    handleMouseDown(e: MouseEvent): void {
        const point = this.touchCoordinateHandler.convertToSVGCoordinates(e);
        this.handleInteractionStart(point);
    }

    handleMouseMove(e: MouseEvent): void {
        const point = this.touchCoordinateHandler.convertToSVGCoordinates(e);
        this.handleInteractionMove(point);
    }

    handleMouseUp(): void {
        this.handleInteractionEnd();
    }

    /**
     * 共通のインタラクション処理
     */
    private handleInteractionStart(point: Point): void {
        const element = this.findClickedElement(point);
        if (element) {
            this.startDragging(element, point);
        } else if (this.currentMode) {
            this.createNewElement(point);
        }
    }

    private handleInteractionMove(point: Point): void {
        if (this.isDragging && this.selectedElement) {
            this.selectedElement.drag(point.x, point.y);
        } else if (this.currentLine) {
            this.currentLine.updateEnd(point.x, point.y);
        }
    }

    private handleInteractionEnd(): void {
        if (this.selectedElement) {
            this.selectedElement.stopInteraction();
            this.selectedElement = null;
            this.isDragging = false;
        }
        this.currentLine = null;
    }

    /**
     * ドラッグ操作の開始
     */
    private startDragging(element: TacticsElement, point: Point): void {
        this.selectedElement = element;
        this.isDragging = true;
        element.startInteraction(point.x, point.y);
    }

    /**
     * 要素を見つける
     */
    findClickedElement(point: Point): TacticsElement | undefined {
        return this.elements.find(element => {
            if (element.type === 'cone') {
                // コーンの場合は三角形の領域をチェック
                const size = element.elementSize.coneSize;
                return (
                    point.x >= element.x - size &&
                    point.x <= element.x + size &&
                    point.y >= element.y - size &&
                    point.y <= element.y + size
                );
            } else {
                // 円形要素の場合は中心からの距離をチェック
                const dx = point.x - element.x;
                const dy = point.y - element.y;
                return Math.sqrt(dx * dx + dy * dy) <= element.elementSize.radius;
            }
        });
    }

    isPointInElement(point: Point, element: TacticsElement): boolean {
        const hitArea = this.isMobile ? 15 : 10;
        const dx = point.x - element.x;
        const dy = point.y - element.y;
        return Math.sqrt(dx * dx + dy * dy) <= hitArea;
    }

    handleResize(): void {
        this.isMobile = window.innerWidth <= 768;
    }

    clearLines(): void {
        this.lines.forEach(line => {
            const node = line.getNode();
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
        this.lines = [];
    }

    clearMode(): void {
        this.setMode(null);
        document.querySelectorAll('#controls button').forEach(b =>
            b.classList.remove('active'));
    }

    handleModeChange(button: HTMLElement): void {
        const mode = button.dataset.mode as ModeType;
        if (mode) {
            this.setMode(mode);
            document.querySelectorAll('#controls button').forEach(b =>
                b.classList.remove('active'));
            button.classList.add('active');
        }
    }

    setMode(mode: ModeType): void {
        this.currentMode = mode;
        this.selectedElement = null;
        this.isDragging = false;
    }

    /**
     * 新しい要素の作成
     */
    createNewElement(point: Point): void {
        if (this.isLineMode()) {
            const line = this.addLine(this.currentMode as LineType, point.x, point.y);
            this.currentLine = line;
        } else if (this.currentMode) {
            this.addElement(this.currentMode as ElementType, point.x, point.y);
        }
    }

    /**
     * 現在のモードがライン描画モードかどうかを判定
     */
    isLineMode(): boolean {
        return !!this.currentMode && ['dribble', 'pass', 'run'].includes(this.currentMode);
    }

    /**
     * スクリーンショットの作成
     */
    takeScreenshot(): void {
        try {
            // SVGデータの準備
            const svgData = new XMLSerializer().serializeToString(this.svg);
            const img = new Image();
            const encodedData = btoa(unescape(encodeURIComponent(svgData)));
            img.src = 'data:image/svg+xml;base64,' + encodedData;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const commentTextArea = document.getElementById('comment-container')?.querySelector('textarea');
                const comment = commentTextArea ? commentTextArea.value : '';

                // コメントのレンダリングに必要な高さを計算
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    console.error("Failed to get canvas context");
                    return;
                }

                ctx.font = '14px Arial';
                const commentLines = this.getWrappedText(ctx, comment, 500);
                const commentHeight = commentLines.length * 20;

                // キャンバスのサイズ設定
                canvas.width = this.svg.viewBox.baseVal.width;
                canvas.height = this.svg.viewBox.baseVal.height + commentHeight + 40;

                // 背景とSVGの描画
                ctx.fillStyle = '#88cc88';
                ctx.fillRect(0, 0, canvas.width, this.svg.viewBox.baseVal.height);
                ctx.drawImage(img, 0, 0);

                // コメント領域の描画
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, this.svg.viewBox.baseVal.height, canvas.width, commentHeight + 40);

                // コメントの描画
                ctx.fillStyle = '#000000';
                ctx.font = '14px Arial';
                let y = this.svg.viewBox.baseVal.height + 20;
                commentLines.forEach(line => {
                    ctx.fillText(line, 50, y);
                    y += 20;
                });

                // 画像のダウンロード
                this.downloadScreenshot(canvas);
            };
        } catch (error) {
            console.error('Screenshot generation failed:', error);
        }
    }

    /**
     * スクリーンショットのダウンロード
     */
    private downloadScreenshot(canvas: HTMLCanvasElement): void {
        try {
            const link = document.createElement('a');
            link.download = 'tactics.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } catch (error) {
            console.error('Screenshot download failed:', error);
        }
    }

    /**
     * テキストの折り返し処理
     */
    private getWrappedText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
        const words = text.split('');
        const lines: string[] = [];
        let currentLine = '';

        words.forEach(word => {
            const width = ctx.measureText(currentLine + word).width;
            if (width < maxWidth - 100) {
                currentLine += word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines;
    }

    /**
     * 要素のクリーンアップ
     */
    clearElements(): void {
        this.elements.forEach(element => {
            const node = element.getNode();
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        });
        this.elements = [];
    }

    /**
     * 開発用ログ出力
     */
    private logInitialization(): void {
        console.log('TacticsBoard initialized:', {
            svg: this.svg,
            handler: this.touchCoordinateHandler,
            isMobile: this.isMobile,
            elementsCount: this.elements.length,
            linesCount: this.lines.length
        });
    }

    /**
     * フィールドのライン描画用HTMLを取得
     */
    private getFieldLinesHTML(): string {
        return `
      <!-- メインフィールド -->
      <rect x="50" y="50" width="500" height="900" fill="none" stroke="white" stroke-width="2"/>
      
      <!-- センターサークルとライン -->
      <circle cx="300" cy="500" r="50" fill="none" stroke="white" stroke-width="2"/>
      <line x1="50" y1="500" x2="550" y2="500" stroke="white" stroke-width="2"/>
      
      <!-- 上側ゴールエリア -->
      <rect x="200" y="50" width="200" height="50" fill="none" stroke="white" stroke-width="2"/>
      <!-- 上側ペナルティエリア -->
      <rect x="150" y="50" width="300" height="150" fill="none" stroke="white" stroke-width="2"/>
      <!-- 上側ゴール -->
      <rect x="250" y="20" width="100" height="30" fill="none" stroke="white" stroke-width="4"/>
      <!-- 上側ペナルティアーク -->
      <path d="M 200 200 A 50 50 0 0 0 400 200" fill="none" stroke="white" stroke-width="2"/>
      
      <!-- 下側ゴールエリア -->
      <rect x="200" y="900" width="200" height="50" fill="none" stroke="white" stroke-width="2"/>
      <!-- 下側ペナルティエリア -->
      <rect x="150" y="800" width="300" height="150" fill="none" stroke="white" stroke-width="2"/>
      <!-- 下側ゴール -->
      <rect x="250" y="950" width="100" height="30" fill="none" stroke="white" stroke-width="4"/>
      <!-- 下側ペナルティアーク -->
      <path d="M 200 800 A 50 50 0 0 1 400 800" fill="none" stroke="white" stroke-width="2"/>
      
      <!-- ペナルティマーク -->
      <circle cx="300" cy="150" r="2" fill="white"/>
      <circle cx="300" cy="850" r="2" fill="white"/>
      
      <!-- センターマーク -->
      <circle cx="300" cy="500" r="2" fill="white"/>
    `;
    }

    /**
     * コメントエリアの設定
     */
    private setupCommentArea(): void {
        const commentContainer = document.getElementById('comment-container');
        if (commentContainer) {
            commentContainer.style.margin = '20px auto';
            commentContainer.style.maxWidth = '600px';
        }
    }
}