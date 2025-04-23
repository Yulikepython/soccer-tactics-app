/**
 * TacticsLine.ts
 * 線要素（ドリブル、パス、走る）を管理するクラス
 */

import { LineType } from '../types/types';

export class TacticsLine {
    public type: LineType;
    public startX: number;
    public startY: number;
    public node: SVGLineElement;

    constructor(type: LineType, startX: number, startY: number) {
        this.type = type;
        this.startX = startX;
        this.startY = startY;
        this.node = this.createElement();
    }

    // 線要素の作成
    createElement(): SVGLineElement {
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute('x1', String(this.startX));
        line.setAttribute('y1', String(this.startY));
        line.setAttribute('x2', String(this.startX));
        line.setAttribute('y2', String(this.startY));

        switch (this.type) {
            case 'dribble':
                line.setAttribute('stroke', 'black');
                line.setAttribute('stroke-width', '2');
                line.setAttribute('stroke-dasharray', '5,5');
                break;
            case 'pass':
                line.setAttribute('stroke', 'blue');
                line.setAttribute('stroke-width', '2');
                break;
            case 'run':
                line.setAttribute('stroke', 'red');
                line.setAttribute('stroke-width', '2');
                line.setAttribute('stroke-dasharray', '10,10');
                break;
        }

        return line;
    }

    updateEnd(x: number, y: number): void {
        this.node.setAttribute('x2', String(x));
        this.node.setAttribute('y2', String(y));
    }

    getNode(): SVGLineElement {
        return this.node;
    }
}