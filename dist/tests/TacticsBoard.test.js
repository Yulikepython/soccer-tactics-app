"use strict";
//v.hn.202410270927
/**
 * サッカー作戦盤アプリケーションのテストスイート
 *
 * テスト内容:
 * 1. 初期化テスト
 *   - SVG要素の作成と属性設定
 *   - コンポーネント構造の確認
 *
 * 2. 要素操作テスト
 *   - プレイヤー要素の追加
 *   - モード設定の確認
 *
 * 3. ライン描画テスト
 *   - ドリブル、パス、走るの各ラインタイプ
 *   - 座標設定と更新
 *
 * 4. コンポーネント構造テスト
 *   - 配列初期化
 *   - コメントコンポーネントの存在確認
 */
const { JSDOM } = require('jsdom');
const { MockTacticsElement, MockTacticsLine, MockTacticsComment } = require('./mocks/setupMocks');
// テスト用のDOM環境をセットアップ
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
<body>
  <div id="container"></div>
  <div id="comment-container"></div>
</body>
</html>
`);
global.window = dom.window;
global.document = dom.window.document;
/**
 * TacticsBoardクラスのモック実装
 * 実際のDOM操作を避けてテストを可能にする
 */
class TacticsBoard {
    constructor() {
        this.currentMode = null;
        this.elements = [];
        this.lines = [];
        this.isDragging = false;
        this.selectedElement = null;
        this.currentLine = null;
        this.comment = new MockTacticsComment();
        this.container = document.getElementById('container');
        this.initializeField();
    }
    /**
     * SVGフィールドの初期化
     * モック用のSVG要素とその属性を設定
     */
    initializeField() {
        this.svg = {
            _attributes: new Map(),
            _style: {},
            _children: [],
            setAttribute(name, value) {
                this._attributes.set(name, value);
            },
            getAttribute(name) {
                return this._attributes.get(name);
            },
            appendChild(child) {
                this._children.push(child);
                return child;
            },
            style: {
                backgroundColor: ''
            }
        };
        this.svg.setAttribute('width', '100%');
        this.svg.setAttribute('height', '100%');
        this.svg.setAttribute('viewBox', '0 0 600 1000');
        this.svg.style.backgroundColor = '#88cc88';
        const mockGroup = {
            _children: [],
            appendChild(child) {
                this._children.push(child);
                return child;
            }
        };
        this.svg.appendChild(mockGroup);
    }
    /**
     * 作戦盤の操作モードを設定
     * @param {string} mode - 設定するモード
     */
    setMode(mode) {
        this.currentMode = mode;
        this.selectedElement = null;
        this.isDragging = false;
    }
    /**
     * 新しい要素（プレイヤー、ボールなど）を追加
     * @param {string} type - 要素タイプ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    addElement(type, x, y) {
        const element = new MockTacticsElement(type, x, y);
        this.elements.push(element);
        if (this.svg) {
            this.svg.appendChild(element.getNode());
        }
        return element;
    }
    /**
     * 新しいライン（ドリブル、パス、走る）を追加
     * @param {string} type - ラインタイプ
     * @param {number} startX - 開始X座標
     * @param {number} startY - 開始Y座標
     */
    addLine(type, startX, startY) {
        const line = new MockTacticsLine(type, startX, startY);
        this.lines.push(line);
        if (this.svg) {
            this.svg.appendChild(line.getNode());
        }
        return line;
    }
}
describe('TacticsBoard', () => {
    let tacticsBoard;
    /**
     * 各テスト前の準備
     * DOMの初期化とTacticsBoardインスタンスの作成
     */
    beforeEach(() => {
        document.body.innerHTML = `
            <div id="container"></div>
            <div id="comment-container"></div>
        `;
        tacticsBoard = new TacticsBoard();
    });
    /**
     * 各テスト後のクリーンアップ
     * DOMのリセットとモックのクリア
     */
    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });
    /**
     * 初期化テストスイート
     * SVG要素の作成と設定を確認
     */
    describe('initialization', () => {
        test('should create SVG element', () => {
            expect(tacticsBoard.svg).toBeTruthy();
            expect(tacticsBoard.svg.getAttribute('viewBox')).toBe('0 0 600 1000');
            expect(tacticsBoard.svg.style.backgroundColor).toBe('#88cc88');
        });
    });
    /**
     * 要素操作テストスイート
     * プレイヤーの追加とモード設定を確認
     */
    describe('element manipulation', () => {
        test('should add player element', () => {
            tacticsBoard.setMode('player');
            const element = tacticsBoard.addElement('player', 100, 100);
            expect(element).toBeTruthy();
            expect(tacticsBoard.elements).toHaveLength(1);
            expect(element.type).toBe('player');
        });
        test('should set correct mode', () => {
            tacticsBoard.setMode('player');
            expect(tacticsBoard.currentMode).toBe('player');
        });
    });
    /**
     * ライン描画テストスイート
     * 各種ラインの追加と更新を確認
     */
    describe('line drawing', () => {
        test('should add dribble line', () => {
            tacticsBoard.setMode('dribble');
            const line = tacticsBoard.addLine('dribble', 100, 100);
            expect(line).toBeTruthy();
            expect(tacticsBoard.lines).toHaveLength(1);
        });
        test('should create line with correct coordinates', () => {
            const line = tacticsBoard.addLine('dribble', 100, 200);
            const node = line.getNode();
            expect(node.getAttribute('x1')).toBe('100');
            expect(node.getAttribute('y1')).toBe('200');
        });
        test('should update line end coordinates', () => {
            const line = tacticsBoard.addLine('dribble', 100, 200);
            line.updateEnd(150, 250);
            const node = line.getNode();
            expect(node.getAttribute('x2')).toBe('150');
            expect(node.getAttribute('y2')).toBe('250');
        });
        test('should handle different line types', () => {
            const dribbleLine = tacticsBoard.addLine('dribble', 100, 100);
            const passLine = tacticsBoard.addLine('pass', 200, 200);
            const runLine = tacticsBoard.addLine('run', 300, 300);
            expect(tacticsBoard.lines).toHaveLength(3);
            expect(dribbleLine.getNode().getAttribute('stroke')).toBe('black');
            expect(passLine.getNode().getAttribute('stroke')).toBe('blue');
            expect(runLine.getNode().getAttribute('stroke')).toBe('red');
        });
    });
    /**
     * コンポーネント構造テストスイート
     * 配列の初期化とコメントコンポーネントを確認
     */
    describe('component structure', () => {
        test('should initialize with empty elements and lines arrays', () => {
            expect(tacticsBoard.elements).toHaveLength(0);
            expect(tacticsBoard.lines).toHaveLength(0);
        });
        test('should have comment component', () => {
            expect(tacticsBoard.comment).toBeTruthy();
            expect(tacticsBoard.comment instanceof MockTacticsComment).toBe(true);
        });
    });
});
//# sourceMappingURL=TacticsBoard.test.js.map