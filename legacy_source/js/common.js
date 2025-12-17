// 레이아웃 로드 함수
async function loadLayout() {
    try {
        console.log('loadLayout 실행');
        // 현재 페이지 경로에 따라 레이아웃 경로 조정
        const pathPrefix = getPathPrefix();
        
        // Top 레이아웃 로드
        await loadTopLayout(pathPrefix);
        
        // Footer 레이아웃 로드
        await loadFooterLayout(pathPrefix);
        
        // 모바일 메뉴 초기화
        initMobileMenu();
    } catch (error) {
        console.error('레이아웃 로드 중 오류 발생:', error);
    }
}

// 현재 페이지 위치에 따른 경로 접두사 결정
function getPathPrefix() {
    const currentPath = window.location.pathname;
    // 현재 경로가 pages 또는 다른 하위 디렉토리에 있는지 확인
    if (currentPath.includes('/pages/') || 
        currentPath.includes('/products/') || 
        currentPath.includes('/services/')) {
        return '../';
    } else {
        return '';
    }
}

// Top 레이아웃 로드
async function loadTopLayout(pathPrefix) {
    console.log('loadTopLayout 호출됨');
    const topContainer = document.getElementById('top-container');
    if (!topContainer) {
        console.error('top-container element not found');
        return;
    }
    
    try {
        // pathPrefix가 없으면 자동으로 결정
        if (pathPrefix === undefined) {
            pathPrefix = getPathPrefix();
        }
        
        console.log('Loading layout from:', pathPrefix + 'layouts/top.html');
        const response = await fetch(pathPrefix + 'layouts/top.html');
        const html = await response.text();
        
        // HTML에서 header 태그만 추출
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const header = doc.querySelector('header');
        
        if (header) {
            // 헤더 요소를 추가하기 전에 컨테이너를 비웁니다
            topContainer.innerHTML = '';
            topContainer.appendChild(header);
            
            // 스크립트 실행
            const scripts = doc.querySelectorAll('script');
            scripts.forEach(script => {
                const newScript = document.createElement('script');
                Array.from(script.attributes).forEach(attr => {
                    newScript.setAttribute(attr.name, attr.value);
                });
                newScript.textContent = script.textContent;
                document.body.appendChild(newScript);
            });
            
            // 현재 활성 페이지 메뉴 강조
            highlightCurrentPage();
            
            // 드롭다운 메뉴 초기화 - 약간의 지연을 주어 DOM이 완전히 로드된 후 실행
            setTimeout(initDropdownMenu, 10);
        } else {
            console.error('Header element not found in top.html');
        }
    } catch (error) {
        console.error('Top 레이아웃 로드 중 오류 발생:', error);
    }
}

// Footer 레이아웃 로드
async function loadFooterLayout(pathPrefix) {
    const footerContainer = document.getElementById('footer-container');
    if (!footerContainer) return;
    
    try {
        const response = await fetch(pathPrefix + 'layouts/footer.html');
        const html = await response.text();
        
        // HTML에서 footer 태그만 추출
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const footer = doc.querySelector('footer');
        
        footerContainer.innerHTML = '';
        footerContainer.appendChild(footer);
    } catch (error) {
        console.error('Footer 레이아웃 로드 중 오류 발생:', error);
    }
}

// 현재 활성 페이지 메뉴 강조
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const menuItems = document.querySelectorAll('nav ul li a');
    
    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href) {
            const hrefPath = href.substring(href.lastIndexOf('/') + 1);
            const currentFilename = currentPath.substring(currentPath.lastIndexOf('/') + 1);
            
            if (hrefPath === currentFilename || 
                (currentPath === '/' && href.includes('index.html'))) {
                item.classList.add('active');
                item.parentElement.classList.add('active');
            }
        }
    });
}

// 모바일 메뉴 초기화
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    if (!menuToggle) return;
    
    menuToggle.addEventListener('click', function() {
        const nav = document.getElementById('mainNav');
        nav.classList.toggle('active');
        
        const icon = this.querySelector('i');
        if (icon.classList.contains('fa-bars')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
}

// 드롭다운 메뉴 초기화
function initDropdownMenu() {
    const dropdownBtn = document.querySelector('.dropdown-btn');
    if (!dropdownBtn) return;
    
    // 이미 이벤트가 등록되어 있는지 확인하기 위한 마커
    if (dropdownBtn.getAttribute('data-initialized') === 'true') return;
    
    dropdownBtn.setAttribute('data-initialized', 'true');
    
    dropdownBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = this.parentElement;
        dropdown.classList.toggle('active');
    });

    // 다른 곳을 클릭하면 드롭다운 닫기
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.dropdown')) {
            const dropdown = document.querySelector('.dropdown');
            if (dropdown) dropdown.classList.remove('active');
        }
    });
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadLayout);

// 화면 크기 변경 시 메뉴 상태 초기화
window.addEventListener('resize', function() {
    const nav = document.getElementById('mainNav');
    const menuToggle = document.getElementById('menuToggle');
    
    if (window.innerWidth > 768 && nav) {
        nav.classList.remove('active');
        
        const icon = menuToggle?.querySelector('i');
        if (icon && icon.classList.contains('fa-times')) {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    }
}); 