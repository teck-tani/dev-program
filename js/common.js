// 레이아웃 로드 함수
async function loadLayout() {
    try {
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
    const topContainer = document.getElementById('top-container');
    if (!topContainer) return;
    
    try {
        const response = await fetch(pathPrefix + 'layouts/top.html');
        const html = await response.text();
        
        // HTML에서 header 태그만 추출
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const header = doc.querySelector('header');
        
        topContainer.innerHTML = '';
        topContainer.appendChild(header);
        
        // 스크립트 실행
        const script = doc.querySelector('script');
        if (script) {
            const newScript = document.createElement('script');
            newScript.textContent = script.textContent;
            document.body.appendChild(newScript);
        }
        
        // 현재 활성 페이지 메뉴 강조
        highlightCurrentPage();
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