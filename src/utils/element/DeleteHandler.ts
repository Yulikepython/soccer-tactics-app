/**
 * DeleteHandler.ts
 * 削除機能を管理するクラス
 */

import { ViewBoxDimensions } from '../../types/types';

interface DeleteHandlerConfig {
    deleteThreshold: number;
    indicatorSize: string;
    indicatorBgColor: string;
    deleteHoldTime: number;
}

type Zone = 'top' | 'bottom' | 'left' | 'right' | null;

export class DeleteHandler {
    private config: DeleteHandlerConfig;
    private indicators: Record<string, HTMLDivElement> = {};
    private overlays: Record<string, HTMLDivElement> = {};
    private fieldOverlay?: HTMLDivElement;
    private deleteTimer: number | null = null;
    private currentZone: Zone = null;
    private isModalShowing = false;

    public onDeleteConfirm: (() => void) | null = null;
    public onDeleteCancel: (() => void) | null = null;

    constructor(config: Partial<DeleteHandlerConfig> = {}) {
        this.config = {
            deleteThreshold: 50,
            indicatorSize: '48px',
            indicatorBgColor: 'rgba(239, 68, 68, 0.8)',
            deleteHoldTime: 500,
            ...config
        };

        this.setupDeleteZones();
    }

    setupDeleteZones(): void {
        const container = document.getElementById('field-container');
        if (!container) {
            console.error('Field container not found');
            return;
        }

        this.destroy();

        // フィールド全体のオーバーレイ
        this.fieldOverlay = document.createElement('div');
        this.fieldOverlay.className = 'field-overlay';
        container.appendChild(this.fieldOverlay);

        (['top', 'bottom', 'left', 'right'] as const).forEach(position => {
            // オーバーレイの作成
            const overlay = document.createElement('div');
            overlay.className = `delete-zone-overlay ${position}`;
            overlay.style.opacity = '0';
            container.appendChild(overlay);
            this.overlays[position] = overlay;

            // インジケーターの作成
            const indicator = document.createElement('div');
            indicator.className = `delete-zone-indicator delete-zone-${position}`;

            Object.assign(indicator.style, {
                position: 'absolute',
                width: this.config.indicatorSize,
                height: this.config.indicatorSize,
                backgroundColor: this.config.indicatorBgColor,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: '0',
                zIndex: '1000',
                ...this.getPositionStyles(position)
            });

            indicator.innerHTML = `
        ${this.getTrashIcon()}
        <div class="delete-progress-container">
          <div class="delete-progress"></div>
        </div>
      `;

            container.appendChild(indicator);
            this.indicators[position] = indicator;
        });
    }

    checkDeleteZone(x: number, y: number, viewBoxDimensions: ViewBoxDimensions): Zone {
        const threshold = this.config.deleteThreshold;
        let newZone: Zone = null;

        if (x <= threshold) {
            newZone = 'left';
        } else if (x >= viewBoxDimensions.width - threshold) {
            newZone = 'right';
        } else if (y <= threshold) {
            newZone = 'top';
        } else if (y >= viewBoxDimensions.height - threshold) {
            newZone = 'bottom';
        }

        // ゾーンが変更された場合のみ処理
        if (newZone !== this.currentZone) {
            if (this.deleteTimer) {
                clearTimeout(this.deleteTimer);
                this.deleteTimer = null;
                this.resetDeleteProgress();
            }

            this.currentZone = newZone;
            this.updateVisuals(newZone);

            if (newZone && !this.isModalShowing) {
                this.startDeleteTimer(newZone);
            }
        }

        return newZone;
    }

    updateVisuals(zone: Zone): void {
        if (this.fieldOverlay) {
            this.fieldOverlay.classList.toggle('active', !!zone);
        }

        Object.entries(this.overlays).forEach(([position, overlay]) => {
            overlay.style.opacity = position === zone ? '1' : '0';
        });

        Object.entries(this.indicators).forEach(([position, indicator]) => {
            indicator.style.opacity = position === zone ? '1' : '0';
            indicator.classList.toggle('active', position === zone);
        });
    }

    startDeleteTimer(zone: string): void {
        if (this.isModalShowing) return;

        const indicator = this.indicators[zone];
        if (!indicator) return;

        // プログレスバーのリセットと開始
        const progressBar = indicator.querySelector('.delete-progress') as HTMLDivElement;
        if (progressBar) {
            progressBar.style.width = '0';
            // 少し遅延を入れてトランジションを確実に動作させる
            setTimeout(() => {
                progressBar.style.transition = `width ${this.config.deleteHoldTime}ms linear`;
                progressBar.style.width = '100%';
            }, 10);
        }

        // 削除タイマーの設定
        this.deleteTimer = window.setTimeout(() => {
            if (this.currentZone === zone && !this.isModalShowing) {
                this.showDeleteConfirmation();
            }
        }, this.config.deleteHoldTime);
    }

    handleDragEnd(): void {
        if (this.currentZone && !this.isModalShowing) {
            if (this.deleteTimer) {
                clearTimeout(this.deleteTimer);
                this.deleteTimer = null;
            }
            this.showDeleteConfirmation();
        }
        this.hideAllIndicators();
    }

    showDeleteConfirmation(): void {
        if (this.isModalShowing) return;
        this.isModalShowing = true;

        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'delete-confirmation-modal';

        modalOverlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header" style="display: flex; align-items: center; margin-bottom: 16px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
            fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" 
            stroke-linejoin="round" style="color: #EF4444; margin-right: 12px;">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
          <h3 style="margin: 0; font-size: 1.25rem; font-weight: bold;">要素の削除</h3>
        </div>
        <p style="margin: 0 0 20px 0;">この要素を削除しますか？</p>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="cancel-button" style="padding: 8px 16px; border: none; border-radius: 4px; 
            background: #E5E7EB; cursor: pointer;">キャンセル</button>
          <button class="confirm-button" style="padding: 8px 16px; border: none; border-radius: 4px; 
            background: #EF4444; color: white; cursor: pointer;">削除する</button>
        </div>
      </div>
    `;

        // スタイルの適用
        Object.assign(modalOverlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '2000'
        });

        const modalContent = modalOverlay.querySelector('.modal-content') as HTMLDivElement;
        Object.assign(modalContent.style, {
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        });

        document.body.appendChild(modalOverlay);

        const cleanup = () => {
            modalOverlay.remove();
            this.isModalShowing = false;
            this.hideAllIndicators();
        };

        const cancelButton = modalOverlay.querySelector('.cancel-button') as HTMLButtonElement;
        cancelButton.addEventListener('click', () => {
            cleanup();
            if (this.onDeleteCancel) this.onDeleteCancel();
        });

        const confirmButton = modalOverlay.querySelector('.confirm-button') as HTMLButtonElement;
        confirmButton.addEventListener('click', () => {
            cleanup();
            if (this.onDeleteConfirm) this.onDeleteConfirm();
        });

        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                cleanup();
                if (this.onDeleteCancel) this.onDeleteCancel();
            }
        });
    }

    resetDeleteProgress(): void {
        Object.values(this.indicators).forEach(indicator => {
            const progressBar = indicator.querySelector('.delete-progress') as HTMLDivElement;
            if (progressBar) {
                progressBar.style.transition = 'none';
                progressBar.style.width = '0';
            }
        });
    }

    hideAllIndicators(): void {
        this.currentZone = null;
        if (this.deleteTimer) {
            clearTimeout(this.deleteTimer);
            this.deleteTimer = null;
        }
        this.resetDeleteProgress();

        if (!this.isModalShowing && this.fieldOverlay) {
            this.fieldOverlay.classList.remove('active');
            Object.values(this.overlays).forEach(overlay => {
                overlay.style.opacity = '0';
            });
            Object.values(this.indicators).forEach(indicator => {
                indicator.style.opacity = '0';
                indicator.classList.remove('active');
            });
        }
    }

    getPositionStyles(position: string): Partial<CSSStyleDeclaration> {
        const styles: Record<string, Partial<CSSStyleDeclaration>> = {
            top: {
                top: '10px',
                left: '50%',
                transform: 'translateX(-50%)'
            },
            bottom: {
                bottom: '10px',
                left: '50%',
                transform: 'translateX(-50%)'
            },
            left: {
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)'
            },
            right: {
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)'
            }
        };

        return styles[position] || {};
    }

    getTrashIcon(): string {
        return `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" 
          fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
      </svg>
    `;
    }

    destroy(): void {
        if (this.deleteTimer) {
            clearTimeout(this.deleteTimer);
            this.deleteTimer = null;
        }

        if (this.fieldOverlay && this.fieldOverlay.parentNode) {
            this.fieldOverlay.parentNode.removeChild(this.fieldOverlay);
        }

        Object.values(this.overlays).forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        });

        Object.values(this.indicators).forEach(indicator => {
            if (indicator && indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        });

        this.overlays = {};
        this.indicators = {};
        this.isModalShowing = false;
    }
}