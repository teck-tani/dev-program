// 방명록 관련 기능

// LocalStorage에 방명록 데이터 저장/불러오기
const GUESTBOOK_STORAGE_KEY = 'barcode_guestbook_entries';

// 방명록 데이터 모델
class GuestbookEntry {
    constructor(name, message, date = new Date()) {
        this.id = Date.now(); // 고유 ID (타임스탬프)
        this.name = name;
        this.message = message;
        this.date = date;
        this.adminReply = null;
    }
}

// 관리자 답변 모델
class AdminReply {
    constructor(message, date = new Date()) {
        this.name = '관리자'; // 번역은 표시할 때 적용됨
        this.message = message;
        this.date = date;
    }
}

// 방명록 관리자
class GuestbookManager {
    constructor() {
        this.entries = [];
        this.loadEntries();
        this.initEventListeners();
    }

    // LocalStorage에서 방명록 항목 불러오기
    loadEntries() {
        const savedEntries = localStorage.getItem(GUESTBOOK_STORAGE_KEY);
        if (savedEntries) {
            try {
                this.entries = JSON.parse(savedEntries);
                // 문자열로 저장된 날짜를 Date 객체로 변환
                this.entries.forEach(entry => {
                    entry.date = new Date(entry.date);
                    if (entry.adminReply && entry.adminReply.date) {
                        entry.adminReply.date = new Date(entry.adminReply.date);
                    }
                });
            } catch (error) {
                console.error('방명록 데이터 로드 오류:', error);
                this.entries = [];
            }
        }
        this.renderEntries();
    }

    // 방명록 항목 저장
    saveEntries() {
        localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(this.entries));
    }

    // 새 방명록 추가
    addEntry(name, message) {
        if (!name || !message) return false;

        const newEntry = new GuestbookEntry(name, message);
        this.entries.unshift(newEntry); // 새 항목을 맨 앞에 추가
        this.saveEntries();
        this.renderEntries();
        return true;
    }

    // 관리자 답변 추가
    addAdminReply(entryId, replyMessage) {
        if (!replyMessage) return false;

        const entry = this.entries.find(entry => entry.id === entryId);
        if (!entry) return false;

        entry.adminReply = new AdminReply(replyMessage);
        this.saveEntries();
        this.renderEntries();
        return true;
    }

    // 방명록 항목 삭제 (관리자 기능)
    deleteEntry(entryId) {
        const index = this.entries.findIndex(entry => entry.id === entryId);
        if (index === -1) return false;

        this.entries.splice(index, 1);
        this.saveEntries();
        this.renderEntries();
        return true;
    }

    // 다국어 지원을 위한 번역 텍스트 가져오기
    getTranslation(key) {
        // 전역 변수로 정의된 translations와 currentLanguage 사용
        if (typeof translations !== 'undefined' && typeof currentLanguage !== 'undefined') {
            return translations[currentLanguage][key] || key;
        }
        // 번역 객체가 없는 경우 기본값 반환
        const defaultTranslations = {
            noEntries: "아직 방명록이 없습니다. 첫 번째 방명록을 남겨보세요!",
            admin: "관리자",
            adminReplyPlaceholder: "관리자 답변을 입력하세요",
            submitReply: "답변 등록",
            deleteEntry: "삭제",
            confirmDelete: "정말 이 방명록을 삭제하시겠습니까?",
            emptyInputError: "이름과 메시지를 모두 입력해주세요."
        };
        return defaultTranslations[key] || key;
    }

    // 방명록 목록 렌더링
    renderEntries() {
        const guestbookContainer = document.getElementById('guestbookEntries');
        if (!guestbookContainer) return;

        guestbookContainer.innerHTML = '';

        if (this.entries.length === 0) {
            guestbookContainer.innerHTML = `<p class="no-entries">${this.getTranslation('noEntries')}</p>`;
            return;
        }

        this.entries.forEach(entry => {
            const entryElement = document.createElement('div');
            entryElement.className = 'guestbook-entry';
            entryElement.dataset.entryId = entry.id;

            const entryDate = this.formatDate(entry.date);
            
            let adminReplyHTML = '';
            if (entry.adminReply) {
                const replyDate = this.formatDate(entry.adminReply.date);
                adminReplyHTML = `
                    <div class="admin-reply">
                        <div class="admin-reply-header">
                            <span class="admin-name">${this.getTranslation('admin')}</span>
                            <span class="admin-date">${replyDate}</span>
                        </div>
                        <p class="admin-message">${this.escapeHTML(entry.adminReply.message)}</p>
                    </div>
                `;
            }

            // 관리자 모드일 때만 답변 폼 표시
            const isAdmin = this.checkAdminMode();
            let adminReplyForm = '';
            if (isAdmin && !entry.adminReply) {
                adminReplyForm = `
                    <div class="admin-reply-form">
                        <textarea class="admin-reply-textarea" placeholder="${this.getTranslation('adminReplyPlaceholder')}"></textarea>
                        <button class="admin-reply-button" data-entry-id="${entry.id}">${this.getTranslation('submitReply')}</button>
                    </div>
                `;
            }

            let adminControls = '';
            if (isAdmin) {
                adminControls = `
                    <div class="admin-controls">
                        <button class="delete-entry-button" data-entry-id="${entry.id}">${this.getTranslation('deleteEntry')}</button>
                    </div>
                `;
            }

            entryElement.innerHTML = `
                <div class="guestbook-info">
                    <span class="guest-name">${this.escapeHTML(entry.name)}</span>
                    <span class="guest-date">${entryDate}</span>
                </div>
                <p class="guest-message">${this.escapeHTML(entry.message)}</p>
                ${adminReplyHTML}
                ${adminReplyForm}
                ${adminControls}
            `;

            guestbookContainer.appendChild(entryElement);
        });

        // 관리자 모드일 때 이벤트 리스너 추가
        if (this.checkAdminMode()) {
            this.addAdminEventListeners();
        }
    }

    // 관리자 모드 확인
    checkAdminMode() {
        // URL 파라미터에서 admin=true 있는지 확인
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('admin') === 'true';
    }

    // 관리자 버튼에 이벤트 리스너 추가
    addAdminEventListeners() {
        // 관리자 답변 버튼에 이벤트 추가
        document.querySelectorAll('.admin-reply-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const entryId = parseInt(e.target.dataset.entryId);
                const textarea = e.target.parentElement.querySelector('.admin-reply-textarea');
                const replyMessage = textarea.value.trim();
                
                if (replyMessage) {
                    this.addAdminReply(entryId, replyMessage);
                }
            });
        });

        // 삭제 버튼에 이벤트 추가
        document.querySelectorAll('.delete-entry-button').forEach(button => {
            button.addEventListener('click', (e) => {
                if (confirm(this.getTranslation('confirmDelete'))) {
                    const entryId = parseInt(e.target.dataset.entryId);
                    this.deleteEntry(entryId);
                }
            });
        });
    }

    // 이벤트 리스너 초기화
    initEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            const submitButton = document.getElementById('submitGuestbook');
            if (submitButton) {
                submitButton.addEventListener('click', () => {
                    const nameInput = document.getElementById('guestName');
                    const messageInput = document.getElementById('guestMessage');
                    
                    const name = nameInput.value.trim();
                    const message = messageInput.value.trim();
                    
                    if (name && message) {
                        if (this.addEntry(name, message)) {
                            // 폼 초기화
                            nameInput.value = '';
                            messageInput.value = '';
                        }
                    } else {
                        alert(this.getTranslation('emptyInputError'));
                    }
                });
            }
        });
    }

    // 날짜 포맷팅 (YYYY-MM-DD)
    formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    }

    // HTML 특수문자 이스케이프 (XSS 방지)
    escapeHTML(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// 방명록 매니저 인스턴스 생성
const guestbookManager = new GuestbookManager();

// 관리자 모드 전환 함수 (콘솔에서 사용 가능)
function toggleAdminMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdmin = urlParams.get('admin') === 'true';
    
    if (isAdmin) {
        // 관리자 모드 끄기
        urlParams.delete('admin');
    } else {
        // 관리자 모드 켜기
        urlParams.set('admin', 'true');
    }
    
    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.location.href = newUrl;
} 