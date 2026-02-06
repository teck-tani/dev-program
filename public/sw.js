const CACHE_NAME = 'tani-devtool-v1';

// 오프라인에서 캐시할 핵심 페이지들
const PRECACHE_URLS = [
  '/ko/stopwatch',
  '/en/stopwatch',
  '/ko/timer',
  '/en/timer',
  '/ko/clock',
  '/en/clock',
];

// 설치 시 핵심 리소스 캐시
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// 활성화 시 오래된 캐시 정리
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// 네트워크 요청 처리 (Network First, Cache Fallback)
self.addEventListener('fetch', (event) => {
  // API 요청이나 외부 리소스는 캐시하지 않음
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // HTML 페이지 요청
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 성공 시 캐시에 저장
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // 오프라인 시 캐시에서 반환
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/ko/stopwatch');
          });
        })
    );
    return;
  }

  // 정적 리소스 (JS, CSS, 이미지 등) - Cache First
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        // 백그라운드에서 업데이트
        fetch(event.request).then((response) => {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response);
          });
        });
        return cached;
      }
      return fetch(event.request).then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});
