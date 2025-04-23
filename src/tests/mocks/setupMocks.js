//v.hn.202410270927

/**
 * サッカー作戦盤アプリケーションのモックセットアップ
 * 
 * モッククラス:
 * 1. MockTacticsElement
 *    - プレイヤー、ボール、コーンなどの要素をモック化
 *    - 各要素の属性とスタイルを管理
 * 
 * 2. MockTacticsLine
 *    - ドリブル、パス、走るなどのラインをモック化
 *    - ライン特有の属性（色、破線など）を管理
 * 
 * 3. MockTacticsComment
 *    - コメント機能をモック化
 *    - テキストエリアの操作をシミュレート
 * 
 * 4. TacticsBoard
 *    - メインボードクラスのモック実装
 *    - 実際のDOM操作を避けてテストを可能に
 */

const { JSDOM } = require('jsdom');

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
 * 作戦盤上の要素（プレイヤー、ボール、コーン）のモッククラス
 */
class MockTacticsElement {
    /**
     * 要素の初期化
     * @param {string} type - 要素タイプ（player, enemy, gk, ball, cone）
     * @param {number} x - X座標
     * @param {number} y - Y座標
     */
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.attributes = new Map();
        
        if (type === 'cone') {
            this.attributes.set('points', `${x},${y-10} ${x-10},${y+10} ${x+10},${y+10}`);
            this.attributes.set('fill', 'orange');
        } else {
            this.attributes.set('cx', String(x));
            this.attributes.set('cy', String(y));
            this.attributes.set('r', '10');
            this.applyStyle();
        }
    }

    /**
     * 要素タイプに応じたスタイルを適用
     */
    applyStyle() {
        const styles = {
            player: 'blue',
            enemy: 'red',
            gk: 'yellow',
            ball: 'white'
        };
        this.attributes.set('fill', styles[this.type] || 'black');
    }

    /**
     * モック化されたDOM要素を返す
     */
    getNode() {
        return {
            getAttribute: (name) => this.attributes.get(name),
            setAttribute: (name, value) => this.attributes.set(name, String(value))
        };
    }
}

/**
 * 作戦盤上のライン（ドリブル、パス、走る）のモッククラス
 */
class MockTacticsLine {
    /**
     * ラインの初期化
     * @param {string} type - ラインタイプ（dribble, pass, run）
     * @param {number} startX - 開始点のX座標
     * @param {number} startY - 開始点のY座標
     */
    constructor(type, startX, startY) {
        this.attributes = new Map();
        
        // 初期値の設定
        this.attributes.set('x1', String(startX));
        this.attributes.set('y1', String(startY));
        this.attributes.set('x2', String(startX));
        this.attributes.set('y2', String(startY));
        this.attributes.set('stroke-width', '2');

        // タイプ別のスタイル設定
        const styles = {
            dribble: { stroke: 'black', 'stroke-dasharray': '5,5' },
            pass: { stroke: 'blue' },
            run: { stroke: 'red', 'stroke-dasharray': '10,10' }
        };

        // スタイルの適用
        if (styles[type]) {
            Object.entries(styles[type]).forEach(([attr, value]) => {
                this.attributes.set(attr, String(value));
            });
        }
    }

    /**
     * ラインの終点座標を更新
     * @param {number} x - 終点のX座標
     * @param {number} y - 終点のY座標
     */
    updateEnd(x, y) {
        this.attributes.set('x2', String(x));
        this.attributes.set('y2', String(y));
    }

    /**
     * モック化されたDOM要素を返す
     */
    getNode() {
        return {
            getAttribute: (name) => this.attributes.get(name),
            setAttribute: (name, value) => this.attributes.set(name, String(value))
        };
    }
}

/**
 * コメント機能のモッククラス
 */
class MockTacticsComment {
    /**
     * コメントコンポーネントの初期化
     */
    constructor() {
        this.commentArea = document.createElement('textarea');
        this.commentArea.placeholder = '備考・メモを入力してください...';
    }

    /**
     * コメントテキストを取得
     * @returns {string} コメントテキスト
     */
    getComment() {
        return this.commentArea.value;
    }

    /**
     * コメントテキストを設定
     * @param {string} text - 設定するテキスト
     */
    setComment(text) {
        this.commentArea.value = text;
    }

    /**
     * コメント用のテキストエリア要素を取得
     * @returns {HTMLTextAreaElement} テキストエリア要素
     */
    getCommentElement() {
        return this.commentArea;
    }
}

/**
 * メインボードクラスのモック実装
 */
class TacticsBoard {
    /**
     * ボードの初期化
     */
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
     */
    initializeField() {
        this.svg = {
            _attributes: new Map(),
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
    }

    /**
     * モードの設定
     * @param {string} mode - 設定するモード
     */
    setMode(mode) {
        this.currentMode = mode;
        this.selectedElement = null;
        this.isDragging = false;
    }

    /**
     * 要素の追加
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
     * ラインの追加
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

module.exports = {
    dom,
    MockTacticsElement,
    MockTacticsLine,
    MockTacticsComment,
    TacticsBoard
};