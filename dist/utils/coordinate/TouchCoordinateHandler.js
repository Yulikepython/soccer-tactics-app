/**
 * TouchCoordinateHandler.ts
 * SVG要素のタッチ操作と座標変換を管理するユーティリティクラス
 */
export class TouchCoordinateHandler {
    constructor(svg) {
        if (!svg) {
            console.error('SVG element is required for TouchCoordinateHandler');
            throw new Error('SVG element is required for TouchCoordinateHandler');
        }
        this.svg = svg;
        this.viewBox = this.getViewBox();
        this.transformPrefix = this.getTransformPrefix();
        this.isTouch = 'ontouchstart' in window;
        this.mobileBreakpoint = 768;
        this.edgeThreshold = 50;
        this.defaultOffset = 30;
        this.transitionDuration = 150;
        // デバッグ情報
        console.log('TouchCoordinateHandler initialized:', {
            svg: this.svg,
            viewBox: this.viewBox,
            isTouch: this.isTouch,
            transformPrefix: this.transformPrefix
        });
    }
    getViewBox() {
        const viewBox = this.svg.viewBox.baseVal;
        return {
            width: viewBox.width,
            height: viewBox.height
        };
    }
    getTransformPrefix() {
        const el = document.createElement('div');
        const prefixes = ['transform', 'WebkitTransform', 'MozTransform', 'msTransform', 'OTransform'];
        for (const prefix of prefixes) {
            if (el.style[prefix] !== undefined) {
                return prefix;
            }
        }
        return 'transform';
    }
    convertToSVGCoordinates(e) {
        const rect = this.svg.getBoundingClientRect();
        const point = 'touches' in e ? e.touches[0] : e;
        // クライアント座標からSVG座標への変換
        const viewBox = this.svg.viewBox.baseVal;
        const scaleX = viewBox.width / rect.width;
        const scaleY = viewBox.height / rect.height;
        return {
            x: (point.clientX - rect.left) * scaleX,
            y: (point.clientY - rect.top) * scaleY
        };
    }
    calculateDragOffset(x, y) {
        if (!this.isMobile()) {
            return { x: 0, y: 0 };
        }
        // 画面端での特殊なオフセット計算
        if (y <= this.edgeThreshold) {
            return { x: 0, y: this.defaultOffset };
        }
        else if (y >= this.viewBox.height - this.edgeThreshold) {
            return { x: 0, y: -this.defaultOffset };
        }
        else if (x <= this.edgeThreshold) {
            return { x: this.defaultOffset, y: -this.defaultOffset / 2 };
        }
        else if (x >= this.viewBox.width - this.edgeThreshold) {
            return { x: -this.defaultOffset, y: -this.defaultOffset / 2 };
        }
        return { x: 0, y: -this.defaultOffset };
    }
    applyTransform(element, offset, enableTransition = true) {
        if (enableTransition) {
            element.style.transition = `${this.transformPrefix} ${this.transitionDuration}ms ease-out`;
        }
        else {
            element.style.transition = '';
        }
        const transform = `matrix(1, 0, 0, 1, ${offset.x}, ${offset.y})`;
        element.style[this.transformPrefix] = transform;
        element.style.willChange = enableTransition ? 'transform' : 'auto';
    }
    isMobile() {
        return window.innerWidth <= this.mobileBreakpoint;
    }
    isWithinBounds(x, y) {
        const margin = 10;
        return (x >= margin &&
            x <= this.viewBox.width - margin &&
            y >= margin &&
            y <= this.viewBox.height - margin);
    }
    resetTransform(element) {
        element.style.transition = '';
        element.style[this.transformPrefix] = 'none';
        element.style.willChange = 'auto';
    }
}
//# sourceMappingURL=TouchCoordinateHandler.js.map