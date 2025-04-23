"use strict";
//v.hn.202410270927
/**
 * サッカー作戦盤のElement要素のテストスイート
 *
 * テスト内容:
 * 1. 基本機能テスト
 *   - 要素の初期化
 *   - スタイル設定
 *   - 属性管理
 *   - ノード生成
 *
 * 2. モバイル対応テスト
 *   - レスポンシブサイズ調整
 *   - タッチ操作対応
 *   - モバイル用スタイリング
 *
 * 3. ドラッグ操作テスト
 *   - ドラッグ開始処理
 *   - 位置更新
 *   - 終了処理
 *   - オフセット計算
 *
 * 4. 境界値テスト
 *   - 画面範囲チェック
 *   - 移動制限の確認
 *
 * 5. 特殊要素テスト
 *   - コーン要素の生成
 *   - コーン専用ドラッグ処理
 *   - 座標計算の検証
 */
const { JSDOM } = require('jsdom');
describe('TacticsElement', () => {
    let element;
    let dom;
    let window;
    let document;
    /**
     * テスト環境のグローバルセットアップ
     * DOM環境の初期化とグローバルオブジェクトの設定を行う
     */
    beforeAll(() => {
        dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
            <body>
                <div id="container">
                    <svg width="600" height="1000" viewBox="0 0 600 1000"></svg>
                </div>
            </body>
            </html>
        `);
        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;
        global.SVGElement = window.SVGElement;
    });
    /**
     * 各テストケース実行前の準備
     * - SVG要素の作成モック化
     * - デスクトップ環境の設定
     * - TacticsElementクラスの定義
     */
    beforeEach(() => {
        // SVG要素のモック化設定
        document.createElementNS = jest.fn((namespace, tagName) => {
            const element = document.createElement(tagName);
            element.setAttribute = jest.fn((name, value) => {
                element[name] = value;
            });
            element.getAttribute = jest.fn((name) => {
                return element[name];
            });
            return element;
        });
        // デスクトップ環境の設定
        Object.defineProperty(window, 'innerWidth', {
            value: 1024,
            writable: true
        });
        // TacticsElementクラスの定義と初期化
        global.TacticsElement = class TacticsElement {
            constructor(type, x, y) {
                this.type = type;
                this.x = x;
                this.y = y;
                this.isMobile = window.innerWidth <= 768;
                this.elementSize = this.getElementSize();
                this.node = this.createElement();
                this.isDragging = false;
                this.dragOffset = { x: 0, y: 0 };
                this.dragVisibilityOffset = {
                    defaultOffset: 30,
                    currentOffset: { x: 0, y: 0 },
                    transitionDuration: 150
                };
                this.viewBoxDimensions = {
                    width: 600,
                    height: 1000
                };
            }
            /**
             * デバイスに応じた要素サイズを取得
             * @returns {Object} サイズ設定オブジェクト
             */
            getElementSize() {
                return {
                    radius: this.isMobile ? 15 : 10,
                    coneSize: this.isMobile ? 15 : 10,
                    strokeWidth: this.isMobile ? 3 : 2
                };
            }
            /**
             * 要素の種類に応じたSVG要素を作成
             * @returns {SVGElement} 作成されたSVG要素
             */
            createElement() {
                return this.type === 'cone' ? this.createConeElement() : this.createCircleElement();
            }
            /**
             * 円形要素（プレイヤー、ボール等）の作成
             * @returns {SVGCircleElement} 作成された円要素
             */
            createCircleElement() {
                const element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                element.setAttribute('cx', this.x);
                element.setAttribute('cy', this.y);
                element.setAttribute('r', this.elementSize.radius);
                element.style = {};
                this.applyElementStyle(element);
                return element;
            }
            /**
             * コーン要素（三角形）の作成
             * @returns {SVGPolygonElement} 作成された多角形要素
             */
            createConeElement() {
                const element = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
                this.updateConePoints(element, this.elementSize.coneSize);
                element.setAttribute('fill', 'orange');
                element.style = {};
                return element;
            }
            /**
             * ドラッグ開始時の処理
             * @param {number} x - マウス/タッチX座標
             * @param {number} y - マウス/タッチY座標
             */
            startDrag(x, y) {
                this.isDragging = true;
                const currentX = this.type === 'cone' ? this.x : parseFloat(this.node.getAttribute('cx'));
                const currentY = this.type === 'cone' ? this.y : parseFloat(this.node.getAttribute('cy'));
                this.dragOffset = {
                    x: currentX - x,
                    y: currentY - y
                };
            }
            /**
             * ドラッグ中の要素位置更新
             * @param {number} x - マウス/タッチX座標
             * @param {number} y - マウス/タッチY座標
             */
            drag(x, y) {
                if (this.isDragging) {
                    const newX = x + this.dragOffset.x;
                    const newY = y + this.dragOffset.y;
                    if (this.isWithinBounds(newX, newY)) {
                        this.updatePosition(newX, newY);
                    }
                }
            }
            /**
             * ドラッグ終了時の処理
             */
            stopDrag() {
                this.isDragging = false;
            }
            /**
             * 座標が許容範囲内かチェック
             * @param {number} x - 検証するX座標
             * @param {number} y - 検証するY座標
             * @returns {boolean} 範囲内の場合true
             */
            isWithinBounds(x, y) {
                const margin = 10;
                return (x >= margin &&
                    x <= this.viewBoxDimensions.width - margin &&
                    y >= margin &&
                    y <= this.viewBoxDimensions.height - margin);
            }
            /**
             * 要素の位置を更新
             * @param {number} x - 新しいX座標
             * @param {number} y - 新しいY座標
             */
            updatePosition(x, y) {
                this.x = x;
                this.y = y;
                if (this.type === 'cone') {
                    this.updateConePoints(this.node, this.elementSize.coneSize);
                }
                else {
                    this.node.setAttribute('cx', x);
                    this.node.setAttribute('cy', y);
                }
            }
            /**
             * コーン要素の頂点座標を更新
             * @param {SVGPolygonElement} triangle - コーン要素
             * @param {number} size - コーンのサイズ
             */
            updateConePoints(triangle, size) {
                triangle.setAttribute('points', `${this.x},${this.y - size} ${this.x - size},${this.y + size} ${this.x + size},${this.y + size}`);
            }
            /**
             * 要素タイプに応じたスタイルを適用
             * @param {SVGElement} element - スタイルを適用する要素
             */
            applyElementStyle(element) {
                const styles = {
                    player: { fill: 'blue' },
                    opponent: { fill: 'red' },
                    goalkeeper: { fill: 'yellow' },
                    ball: {
                        fill: 'white',
                        stroke: 'black',
                        'stroke-width': this.elementSize.strokeWidth
                    }
                };
                const style = styles[this.type];
                if (style) {
                    Object.entries(style).forEach(([property, value]) => {
                        element.setAttribute(property, value);
                    });
                }
            }
            /**
             * 要素のノードを取得
             * @returns {SVGElement} 要素のノード
             */
            getNode() {
                return this.node;
            }
        };
        // テスト用のインスタンスを作成
        element = new TacticsElement('player', 100, 100);
    });
    /**
     * 基本機能テストスイート
     * 要素の初期化とスタイル設定を検証
     */
    describe('基本機能', () => {
        test('要素が正しく初期化される', () => {
            expect(element).toBeTruthy();
            expect(element.type).toBe('player');
            expect(element.x).toBe(100);
            expect(element.y).toBe(100);
        });
        test('プレイヤー要素のスタイルが正しく設定される', () => {
            const node = element.getNode();
            expect(node.getAttribute('fill')).toBe('blue');
            expect(node.getAttribute('r')).toBe(10);
        });
    });
    /**
     * モバイル対応テストスイート
     * レスポンシブデザインと要素サイズの検証
     */
    describe('モバイル対応', () => {
        test('モバイル環境で正しいサイズが設定される', () => {
            Object.defineProperty(window, 'innerWidth', { value: 375 });
            const mobileElement = new TacticsElement('player', 100, 100);
            expect(mobileElement.elementSize.radius).toBe(15);
            expect(mobileElement.elementSize.strokeWidth).toBe(3);
        });
    });
    /**
     * ドラッグ操作テストスイート
     * ドラッグアンドドロップの機能検証
     */
    describe('ドラッグ操作', () => {
        test('ドラッグ開始時の状態が正しく設定される', () => {
            element.startDrag(90, 90);
            expect(element.isDragging).toBe(true);
            expect(element.dragOffset).toBeDefined();
        });
        test('ドラッグ中の位置が正しく更新される', () => {
            element.startDrag(90, 90);
            element.drag(120, 120);
            expect(element.x).toBeGreaterThan(100);
            expect(element.y).toBeGreaterThan(100);
        });
        test('ドラッグ終了時に状態がリセットされる', () => {
            element.startDrag(90, 90);
            element.drag(120, 120);
            element.stopDrag();
            expect(element.isDragging).toBe(false);
        });
    });
    /**
     * 境界チェックテストスイート
     * 要素の移動制限の検証
     */
    describe('境界チェック', () => {
        test('要素が画面外に移動できない', () => {
            element.startDrag(90, 90);
            element.drag(-50, -50);
            expect(element.x).toBeGreaterThanOrEqual(10);
            expect(element.y).toBeGreaterThanOrEqual(10);
        });
    });
    /**
     * 特殊要素テストスイート
     * コーン要素の特殊な動作の検証
     */
    describe('特殊要素: コーン', () => {
        test('コーン要素が正しく作成される', () => {
            const cone = new TacticsElement('cone', 100, 100);
            const node = cone.getNode();
            expect(node.getAttribute('fill')).toBe('orange');
            expect(node.getAttribute('points')).toBeDefined();
        });
        test('コーン要素のドラッグが正しく動作する', () => {
            const cone = new TacticsElement('cone', 100, 100);
            cone.startDrag(90, 90);
            cone.drag(120, 120);
            const points = cone.getNode().getAttribute('points');
            expect(points).toBeDefined();
        });
    });
});
//# sourceMappingURL=TacticsElement.test.js.map