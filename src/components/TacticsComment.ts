/**
 * TacticsComment.ts
 * コメント機能を管理するクラス
 */

export class TacticsComment {
    private commentArea: HTMLTextAreaElement | null = null;

    constructor() {
        this.initialize();
    }

    initialize(): void {
        const commentContainer = document.getElementById('comment-container');
        if (!commentContainer) {
            console.error('Comment container not found');
            return;
        }

        // ラベルの追加
        const label = document.createElement('label');
        label.textContent = '備考・メモ';
        label.style.display = 'block';
        label.style.marginBottom = '10px';
        label.style.fontWeight = 'bold';

        // テキストエリアの作成
        this.commentArea = document.createElement('textarea');
        this.commentArea.placeholder = '備考・メモを入力してください...';

        // 要素の追加
        commentContainer.appendChild(label);
        commentContainer.appendChild(this.commentArea);
    }

    getComment(): string {
        return this.commentArea?.value || '';
    }

    setComment(text: string): void {
        if (this.commentArea) {
            this.commentArea.value = text;
        }
    }

    getCommentElement(): HTMLTextAreaElement | null {
        return this.commentArea;
    }
}