/**
 * TacticsElement.ts
 * 作戦盤上の要素（プレイヤー、ボール、コーン）を管理するクラス
 */
import { TouchCoordinateHandler } from '../utils/coordinate/TouchCoordinateHandler.js';
import { DeleteHandler } from '../utils/element/DeleteHandler.js';
export class TacticsElement {
    constructor(type, x, y) {
        this.deleteZone = false; // 初期値を設定
        // 基本プロパティ
        this.type = type;
        this.x = x;
        this.y = y;
        this.isMobile = window.innerWidth <= 768;
        this.isSelected = false;
        this.isDragging = false;
        // サイズと位置関連
        this.elementSize = this.getElementSize();
        this.viewBoxDimensions = { width: 600, height: 1000 };
        this.dragOffset = { x: 0, y: 0 };
        this.touchOffset = { x: 0, y: -25 }; // 選択時の上方向オフセット
        // 要素の作成
        this.node = this.createElement();
        this.setupFilters();
        // ハンドラーの初期化
        this.setupHandlers();
        this.setupEventListeners();
    }
    setupHandlers() {
        // 座標ハンドラー
        this.coordinateHandler = new TouchCoordinateHandler(document.querySelector('#container svg'));
        // 削除ハンドラー
        this.deleteHandler = new DeleteHandler();
        this.deleteHandler.onDeleteConfirm = () => this.delete();
        this.deleteHandler.onDeleteCancel = () => this.resetPosition();
    }
    setupEventListeners() {
        // リサイズ対応
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 768;
            this.elementSize = this.getElementSize();
            this.updateElementSize();
        });
        // タッチ操作
        this.node.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.node.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.node.addEventListener('touchend', this.handleTouchEnd.bind(this));
        // マウス操作
        this.node.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    setupFilters() {
        // SVGフィルターの設定（ドロップシャドウとグロー効果）
        const svg = document.querySelector('#container svg');
        if (svg && !svg.querySelector('#elementFilter')) {
            const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
            defs.innerHTML = `
        <filter id="elementFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5"/>
        </filter>
        <filter id="selectedFilter" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.4"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="1"/>
          <feColorMatrix type="matrix" values="1.2 0 0 0 0  0 1.2 0 0 0  0 0 1.2 0 0  0 0 0 1 0"/>
        </filter>
      `;
            svg.appendChild(defs);
        }
    }
    getElementSize() {
        const baseRadius = this.isMobile ? 20 : 10;
        return {
            radius: baseRadius,
            // コーンサイズを調整（1.5倍に変更）
            coneSize: this.isMobile ? baseRadius * 1.2 : baseRadius * 1.5,
            strokeWidth: this.isMobile ? 4 : 2
        };
    }
    // 要素サイズの更新（リサイズ時）
    updateElementSize() {
        if (this.type === 'cone') {
            this.updateConePoints(this.node, this.elementSize.coneSize);
        }
        else {
            const circle = this.node;
            circle.setAttribute('r', String(this.elementSize.radius));
            // ストロークの更新
            if (this.type === 'ball' || this.type === 'goalkeeper') {
                circle.setAttribute('stroke-width', String(this.elementSize.strokeWidth));
            }
        }
    }
    // イベントハンドラー
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const point = this.getLocalCoordinates(touch.clientX, touch.clientY);
        this.startInteraction(point.x, point.y);
    }
    handleTouchMove(e) {
        if (this.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            const point = this.getLocalCoordinates(touch.clientX, touch.clientY);
            this.drag(point.x, point.y);
        }
    }
    handleTouchEnd() {
        this.stopInteraction();
    }
    handleMouseDown(e) {
        const point = this.getLocalCoordinates(e.clientX, e.clientY);
        this.startInteraction(point.x, point.y);
    }
    handleMouseMove(e) {
        if (this.isDragging) {
            const point = this.getLocalCoordinates(e.clientX, e.clientY);
            this.drag(point.x, point.y);
        }
    }
    handleMouseUp() {
        this.stopInteraction();
    }
    startInteraction(x, y) {
        this.isDragging = true;
        this.select();
        // ドラッグオフセットの計算
        this.dragOffset = {
            x: this.x - x,
            y: this.y - y
        };
        // モバイル時の視認性向上オフセット
        if (this.isMobile) {
            this.applyTouchOffset();
        }
    }
    stopInteraction() {
        if (this.isDragging) {
            this.isDragging = false;
            this.deselect();
            if (this.deleteHandler) {
                this.deleteHandler.handleDragEnd();
            }
        }
    }
    select() {
        this.isSelected = true;
        this.node.setAttribute('filter', 'url(#selectedFilter)');
        this.applyTouchOffset();
    }
    deselect() {
        this.isSelected = false;
        this.node.setAttribute('filter', 'url(#elementFilter)');
        this.resetTouchOffset();
    }
    applyTouchOffset() {
        const transform = `translate(${this.touchOffset.x} ${this.touchOffset.y})`;
        this.node.setAttribute('transform', transform);
    }
    resetTouchOffset() {
        this.node.removeAttribute('transform');
    }
    drag(x, y) {
        const newX = x + this.dragOffset.x;
        const newY = y + this.dragOffset.y;
        this.updatePosition(newX, newY);
        if (this.deleteHandler) {
            // boolean型に変換して代入
            this.deleteZone = !!this.deleteHandler.checkDeleteZone(newX, newY, this.viewBoxDimensions);
        }
    }
    createElement() {
        const element = this.type === 'cone'
            ? this.createConeElement()
            : this.createCircleElement();
        element.setAttribute('filter', 'url(#elementFilter)');
        element.style.cursor = 'move';
        element.classList.add('tactics-element');
        return element;
    }
    createCircleElement() {
        const element = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        element.setAttribute('cx', String(this.x));
        element.setAttribute('cy', String(this.y));
        element.setAttribute('r', String(this.elementSize.radius));
        this.applyElementStyle(element);
        return element;
    }
    createConeElement() {
        const element = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        this.updateConePoints(element, this.elementSize.coneSize);
        element.setAttribute('fill', 'orange');
        // モバイル時は縁取りを追加して視認性を確保
        if (this.isMobile) {
            element.setAttribute('stroke', '#d97706'); // 暗めのオレンジ
            element.setAttribute('stroke-width', '1');
        }
        return element;
    }
    applyElementStyle(element) {
        const styles = {
            player: {
                fill: 'blue',
                stroke: this.isMobile ? 'white' : 'none',
                'stroke-width': this.isMobile ? '2' : '0'
            },
            opponent: {
                fill: 'red',
                stroke: this.isMobile ? 'white' : 'none',
                'stroke-width': this.isMobile ? '2' : '0'
            },
            goalkeeper: {
                fill: 'yellow',
                stroke: 'black',
                'stroke-width': String(this.elementSize.strokeWidth)
            },
            ball: {
                fill: 'white',
                stroke: 'black',
                'stroke-width': String(this.elementSize.strokeWidth)
            },
            cone: {} // コーンは別処理
        };
        const style = styles[this.type];
        if (style) {
            Object.entries(style).forEach(([property, value]) => {
                element.setAttribute(property, value);
            });
        }
    }
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
        if (this.type === 'cone') {
            this.updateConePoints(this.node, this.elementSize.coneSize);
        }
        else {
            const circle = this.node;
            circle.setAttribute('cx', String(x));
            circle.setAttribute('cy', String(y));
        }
    }
    updateConePoints(triangle, size) {
        // よりシャープな三角形に
        const height = size * 1; // 高さを少し高めに
        const baseWidth = size * 0.6; // 底辺を少し狭めに
        triangle.setAttribute('points', `${this.x},${this.y - height} ` + // 頂点
            `${this.x - baseWidth},${this.y + size} ` + // 左下
            `${this.x + baseWidth},${this.y + size}` // 右下
        );
    }
    resetPosition() {
        const defaultPosition = {
            x: this.viewBoxDimensions.width / 2,
            y: this.viewBoxDimensions.height / 2
        };
        this.updatePosition(defaultPosition.x, defaultPosition.y);
    }
    getLocalCoordinates(clientX, clientY) {
        const svgElement = this.node.ownerSVGElement;
        if (!svgElement) {
            console.error("SVG element not found");
            return { x: 0, y: 0 };
        }
        const svgRect = svgElement.getBoundingClientRect();
        const scaleX = this.viewBoxDimensions.width / svgRect.width;
        const scaleY = this.viewBoxDimensions.height / svgRect.height;
        return {
            x: (clientX - svgRect.left) * scaleX,
            y: (clientY - svgRect.top) * scaleY
        };
    }
    delete() {
        if (this.deleteHandler) {
            this.deleteHandler.destroy();
        }
        this.node.remove();
        if (this.onDelete) {
            this.onDelete(this);
        }
    }
    getNode() {
        return this.node;
    }
}
//# sourceMappingURL=TacticsElement.js.map