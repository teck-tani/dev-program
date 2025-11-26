// color-core.js - HTML 색상표를 위한 핵심 자바스크립트 코드

document.addEventListener('DOMContentLoaded', function() {
    // 공통 헤더와 푸터 로드
    loadCommonElements();
    
    // 초기 설정
    initColorPicker();
    loadSavedColors();
    loadDefaultColors();
    setupEventListeners();
    updateColorInfo(document.getElementById('colorPicker').value);
});

// 색상 정보 업데이트
function updateColorInfo(hexColor) {
    const rgbColor = hexToRgb(hexColor);
    const hslColor = rgbToHsl(rgbColor.r, rgbColor.g, rgbColor.b);
    
    document.getElementById('selectedColorPreview').style.backgroundColor = hexColor;
    document.getElementById('hexValue').textContent = hexColor;
    document.getElementById('rgbValue').textContent = `rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`;
    document.getElementById('hslValue').textContent = `hsl(${Math.round(hslColor.h)}, ${Math.round(hslColor.s)}%, ${Math.round(hslColor.l)}%)`;
}

// 색상 선택기 초기화
function initColorPicker() {
    const colorPicker = document.getElementById('colorPicker');
    
    colorPicker.addEventListener('input', function() {
        updateColorInfo(this.value);
    });
}

// 기본 색상 로드
function loadDefaultColors() {
    const defaultColors = [
        // Basic colors
        { name: '검정색', hex: '#000000' },
        { name: '흰색', hex: '#FFFFFF' },
        { name: '빨간색', hex: '#FF0000' },
        { name: '녹색', hex: '#00FF00' },
        { name: '파란색', hex: '#0000FF' },
        { name: '노란색', hex: '#FFFF00' },
        { name: '시안', hex: '#00FFFF' },
        { name: '마젠타', hex: '#FF00FF' },
        
        // Material Design colors
        { name: '파랑', hex: '#2196F3' },
        { name: '빨강', hex: '#F44336' },
        { name: '초록', hex: '#4CAF50' },
        { name: '보라', hex: '#9C27B0' },
        { name: '핑크', hex: '#E91E63' },
        { name: '진한 주황', hex: '#FF5722' },
        { name: '노랑', hex: '#FFEB3B' },
        { name: '라임', hex: '#CDDC39' },
        
        // Web safe colors
        { name: '오렌지', hex: '#FFA500' },
        { name: '보라', hex: '#800080' },
        { name: '갈색', hex: '#A52A2A' },
        { name: '회색', hex: '#808080' },
        { name: '실버', hex: '#C0C0C0' },
        { name: '골드', hex: '#FFD700' },
        { name: '네이비', hex: '#000080' },
        { name: '올리브', hex: '#808000' }
    ];
    
    // 기본 색상을 그리드에 추가
    defaultColors.forEach(color => {
        addColorToGrid(color.hex, color.name);
    });
}

// 색상을 그리드에 추가
function addColorToGrid(hexColor, colorName = '') {
    const colorGrid = document.getElementById('colorGrid');
    const colorItem = document.createElement('div');
    colorItem.className = 'color-item';
    colorItem.style.backgroundColor = hexColor;
    
    // 색상 이름이 없으면 HEX 값을 사용
    const name = colorName || hexColor;
    
    // 색상 라벨 추가
    const colorLabel = document.createElement('div');
    colorLabel.className = 'color-label';
    colorLabel.textContent = name;
    
    // 제거 버튼 추가
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.innerHTML = '×';
    removeBtn.title = '색상 제거';
    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        colorGrid.removeChild(colorItem);
        
        // 로컬 스토리지에서도 제거
        removeColorFromStorage(hexColor);
    });
    
    // 클릭 시 색상 정보 업데이트
    colorItem.addEventListener('click', function() {
        document.getElementById('colorPicker').value = hexColor;
        updateColorInfo(hexColor);
    });
    
    colorItem.appendChild(colorLabel);
    colorItem.appendChild(removeBtn);
    colorGrid.appendChild(colorItem);
}

// 색상 추가
function addColor() {
    const colorPicker = document.getElementById('colorPicker');
    const hexColor = colorPicker.value;
    
    // 색상이 이미 있는지 확인
    if (!isColorInGrid(hexColor)) {
        addColorToGrid(hexColor);
        saveColorToStorage(hexColor);
        showToast('색상이 추가되었습니다.');
    } else {
        showToast('이미 추가된 색상입니다.');
    }
}

// 그리드에 색상이 이미 있는지 확인
function isColorInGrid(hexColor) {
    const colorItems = document.querySelectorAll('.color-item');
    for (let i = 0; i < colorItems.length; i++) {
        const itemColor = rgb2hex(colorItems[i].style.backgroundColor);
        if (itemColor.toLowerCase() === hexColor.toLowerCase()) {
            return true;
        }
    }
    return false;
}

// 색상 검색
function searchColors() {
    const searchTerm = document.getElementById('colorSearch').value.toLowerCase();
    const colorItems = document.querySelectorAll('.color-item');
    
    colorItems.forEach(item => {
        const label = item.querySelector('.color-label').textContent.toLowerCase();
        const color = rgb2hex(item.style.backgroundColor).toLowerCase();
        
        if (label.includes(searchTerm) || color.includes(searchTerm)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// 색상을 로컬 스토리지에 저장
function saveColorToStorage(hexColor) {
    let savedColors = getSavedColors();
    
    if (!savedColors.includes(hexColor)) {
        savedColors.push(hexColor);
        localStorage.setItem('savedColors', JSON.stringify(savedColors));
    }
}

// 색상을 로컬 스토리지에서 제거
function removeColorFromStorage(hexColor) {
    let savedColors = getSavedColors();
    const index = savedColors.indexOf(hexColor);
    
    if (index !== -1) {
        savedColors.splice(index, 1);
        localStorage.setItem('savedColors', JSON.stringify(savedColors));
    }
}

// 저장된 색상 가져오기
function getSavedColors() {
    const colorsJson = localStorage.getItem('savedColors');
    return colorsJson ? JSON.parse(colorsJson) : [];
}

// 저장된 색상 로드
function loadSavedColors() {
    const savedColors = getSavedColors();
    
    savedColors.forEach(color => {
        addColorToGrid(color);
    });
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 색상 추가 버튼
    document.getElementById('addColorBtn').addEventListener('click', addColor);
    
    // 색상 검색
    document.getElementById('colorSearch').addEventListener('input', searchColors);
    
    // 복사 버튼
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const textToCopy = document.getElementById(targetId).textContent;
            
            copyToClipboard(textToCopy);
            showToast('클립보드에 복사되었습니다: ' + textToCopy);
        });
    });
}

// 클립보드에 복사
function copyToClipboard(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
}

// 토스트 메시지 표시
function showToast(message) {
    let toast = document.querySelector('.toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// HEX를 RGB로 변환
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// RGB를 HSL로 변환
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
        h = s = 0; // 무채색
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6;
    }
    
    return {
        h: h * 360,
        s: s * 100,
        l: l * 100
    };
}

// RGB를 HEX로 변환
function rgb2hex(rgb) {
    if (rgb.startsWith('#')) return rgb;
    
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!rgb) return '#000000';
    
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
} 