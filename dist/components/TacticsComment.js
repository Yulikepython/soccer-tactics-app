/**
 * TacticsComment.ts
 * コメント機能を管理するクラス
 */
export class TacticsComment {
    constructor() {
        this.commentArea = null;
        this.initialize();
    }
    initialize() {
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
    getComment() {
        return this.commentArea?.value || '';
    }
    setComment(text) {
        if (this.commentArea) {
            this.commentArea.value = text;
        }
    }
    getCommentElement() {
        return this.commentArea;
    }
}
//# sourceMappingURL=TacticsComment.js.map