/**
 * service-worker.js - v.hn.202410272356
 * キャッシュの制御とオフライン対応を行うService Worker
 */

const CACHE_NAME = 'soccer-tactics-cache-v1';
const CACHE_URLS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/TacticsBoard.js',
    '/js/TacticsElement.js',
    '/js/TacticsLine.js',
    '/js/TacticsComment.js'
];

// バージョンパラメータを含むURLからキャッシュキーを生成
const getCacheKey = (url) => {
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.delete('v');
        return urlObj.toString();
    } catch {
        return url;
    }
};

// インストール時の処理
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(CACHE_URLS))
            .then(() => self.skipWaiting())
    );
});

// アクティベート時の処理
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // 古いキャッシュの削除
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // 新しいService Workerをすぐにアクティブにする
            self.clients.claim()
        ])
    );
});

// フェッチ時の処理
self.addEventListener('fetch', event => {
    // HTMLファイルの場合は必ずネットワークから取得
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match('/index.html');
            })
        );
        return;
    }

    // その他のリソース
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // レスポンスのクローンを作成
                const responseToCache = response.clone();

                // バージョンパラメータが含まれている場合のみキャッシュを更新
                if (event.request.url.includes('?v=')) {
                    caches.open(CACHE_NAME).then(cache => {
                        // バージョンパラメータを除いたURLでキャッシュ
                        const cacheKey = getCacheKey(event.request.url);
                        cache.put(cacheKey, responseToCache);
                    });
                }

                return response;
            })
            .catch(() => {
                // オフライン時はキャッシュから取得
                return caches.match(getCacheKey(event.request.url));
            })
    );
});

// メッセージ受信時の処理
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});