const CACHE_NAME = 'tani-devtool-v2';

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

// 네트워크 요청 처리
self.addEventListener('fetch', (event) => {
  // API 요청이나 외부 리소스는 캐시하지 않음
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);

  // RSC 요청 (Next.js 클라이언트 네비게이션) - Network First
  // RSC 헤더 또는 _rsc 파라미터가 있으면 항상 네트워크 우선
  if (event.request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // HTML 페이지 요청 (직접 URL 접속) - Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => {
            return cached || caches.match('/ko/stopwatch');
          });
        })
    );
    return;
  }

  // _next/ 리소스 - Network First (배포 후 캐시 불일치 방지)
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // 기타 정적 리소스 (이미지, 폰트 등) - Cache First
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
