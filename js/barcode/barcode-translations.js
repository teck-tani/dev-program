// 다국어 번역 데이터
const translations = {
    // 한국어 (기본값)
    ko: {
        title: "무료 바코드생성기 & QR코드 생성",
        description: "다양한 형식의 바코드와 QR코드를 무료로 생성하고 엑셀 데이터 일괄 변환을 지원합니다.",
        barcodeType: "바코드 종류:",
        code128: "CODE128 (기본)",
        code39: "CODE39",
        ean13: "EAN-13",
        ean8: "EAN-8",
        upc: "UPC",
        itf14: "ITF-14",
        itf: "ITF",
        msi: "MSI",
        msi10: "MSI10",
        msi11: "MSI11",
        msi1010: "MSI1010",
        msi1110: "MSI1110",
        pharmacode: "Pharmacode",
        qrcode: "QR 코드",
        barcodeValue: "바코드 값:",
        barcodeValuePlaceholder: "바코드/QR코드 값을 입력하세요",
        addButton: "추가",
        excelData: "Excel 데이터 (한 줄에 하나의 값):",
        excelDataPlaceholder: "엑셀에서 복사한 데이터를 붙여넣으세요",
        generateButton: "일괄 생성",
        clearButton: "모두 지우기",
        errorEmptyInput: "바코드 값을 입력해주세요",
        errorEAN: "EAN 바코드는 12자리 또는 13자리 숫자여야 합니다",
        errorEAN8: "EAN-8 바코드는 7자리 또는 8자리 숫자여야 합니다",
        errorUPC: "UPC 바코드는 11자리 또는 12자리 숫자여야 합니다",
        errorMaxBarcodes: "최대 바코드 개수에 도달했습니다",
        moreInfo: "바코드 생성 도구 더 알아보기",
        // 방명록 관련 번역
        guestbookTitle: "방명록",
        guestbookDescription: "바코드생성기 사용 후기나 의견을 남겨주세요!",
        guestName: "이름",
        guestMessage: "메시지를 남겨주세요",
        submitGuestbook: "등록하기",
        noEntries: "아직 방명록이 없습니다. 첫 번째 방명록을 남겨보세요!",
        admin: "관리자",
        adminReplyPlaceholder: "관리자 답변을 입력하세요",
        submitReply: "답변 등록",
        deleteEntry: "삭제",
        confirmDelete: "정말 이 방명록을 삭제하시겠습니까?",
        emptyInputError: "이름과 메시지를 모두 입력해주세요."
    },
    
    // 영어
    en: {
        title: "Free Barcode & QR Code Generator",
        description: "Create various types of barcodes and QR codes for free, with Excel data batch conversion support.",
        barcodeType: "Barcode Type:",
        code128: "CODE128 (Default)",
        code39: "CODE39",
        ean13: "EAN-13",
        ean8: "EAN-8",
        upc: "UPC",
        itf14: "ITF-14",
        itf: "ITF",
        msi: "MSI",
        msi10: "MSI10",
        msi11: "MSI11",
        msi1010: "MSI1010",
        msi1110: "MSI1110",
        pharmacode: "Pharmacode",
        qrcode: "QR Code",
        barcodeValue: "Barcode Value:",
        barcodeValuePlaceholder: "Enter barcode/QR code value",
        addButton: "Add",
        excelData: "Excel Data (one value per line):",
        excelDataPlaceholder: "Paste data copied from Excel",
        generateButton: "Generate All",
        clearButton: "Clear All",
        errorEmptyInput: "Please enter a barcode value",
        errorEAN: "EAN barcode must be 12 or 13 digits",
        errorEAN8: "EAN-8 barcode must be 7 or 8 digits",
        errorUPC: "UPC barcode must be 11 or 12 digits",
        errorMaxBarcodes: "Maximum number of barcodes reached",
        moreInfo: "Learn more about barcode generator",
        // Guestbook translations
        guestbookTitle: "Guestbook",
        guestbookDescription: "Please leave your feedback or comments about the barcode generator!",
        guestName: "Name",
        guestMessage: "Leave a message",
        submitGuestbook: "Submit",
        noEntries: "No entries yet. Be the first to leave a message!",
        admin: "Admin",
        adminReplyPlaceholder: "Enter admin reply",
        submitReply: "Post Reply",
        deleteEntry: "Delete",
        confirmDelete: "Are you sure you want to delete this entry?",
        emptyInputError: "Please enter both name and message."
    },
    
    // 일본어
    ja: {
        title: "無料バーコード・QRコード生成ツール",
        description: "様々な種類のバーコードとQRコードを無料で生成し、Excelデータの一括変換もサポートします。",
        barcodeType: "バーコードの種類:",
        code128: "CODE128 (デフォルト)",
        code39: "CODE39",
        ean13: "EAN-13",
        ean8: "EAN-8",
        upc: "UPC",
        itf14: "ITF-14",
        itf: "ITF",
        msi: "MSI",
        msi10: "MSI10",
        msi11: "MSI11",
        msi1010: "MSI1010",
        msi1110: "MSI1110",
        pharmacode: "Pharmacode",
        qrcode: "QRコード",
        barcodeValue: "バーコードの値:",
        barcodeValuePlaceholder: "バーコード/QRコードの値を入力してください",
        addButton: "追加",
        excelData: "Excelデータ (1行に1つの値):",
        excelDataPlaceholder: "Excelからコピーしたデータを貼り付けてください",
        generateButton: "一括生成",
        clearButton: "すべて削除",
        errorEmptyInput: "バーコードの値を入力してください",
        errorEAN: "EANバーコードは12桁または13桁の数字である必要があります",
        errorEAN8: "EAN-8バーコードは7桁または8桁の数字である必要があります",
        errorUPC: "UPCバーコードは11桁または12桁の数字である必要があります",
        errorMaxBarcodes: "バーコードの最大数に達しました",
        moreInfo: "バーコード生成ツールについてもっと知る",
        // ゲストブック翻訳
        guestbookTitle: "ゲストブック",
        guestbookDescription: "バーコード生成ツールについてのご意見やご感想をお寄せください！",
        guestName: "お名前",
        guestMessage: "メッセージを残す",
        submitGuestbook: "送信",
        noEntries: "まだ投稿はありません。最初のメッセージを残してください！",
        admin: "管理者",
        adminReplyPlaceholder: "管理者の返信を入力",
        submitReply: "返信を投稿",
        deleteEntry: "削除",
        confirmDelete: "この投稿を削除してもよろしいですか？",
        emptyInputError: "名前とメッセージの両方を入力してください。"
    },
    
    // 중국어
    zh: {
        title: "免费条形码和二维码生成器",
        description: "免费创建各种类型的条形码和二维码，支持Excel数据批量转换。",
        barcodeType: "条形码类型:",
        code128: "CODE128 (默认)",
        code39: "CODE39",
        ean13: "EAN-13",
        ean8: "EAN-8",
        upc: "UPC",
        itf14: "ITF-14",
        itf: "ITF",
        msi: "MSI",
        msi10: "MSI10",
        msi11: "MSI11",
        msi1010: "MSI1010",
        msi1110: "MSI1110",
        pharmacode: "Pharmacode",
        qrcode: "二维码",
        barcodeValue: "条形码值:",
        barcodeValuePlaceholder: "请输入条形码/二维码值",
        addButton: "添加",
        excelData: "Excel数据 (每行一个值):",
        excelDataPlaceholder: "粘贴从Excel复制的数据",
        generateButton: "批量生成",
        clearButton: "全部清除",
        errorEmptyInput: "请输入条形码值",
        errorEAN: "EAN条形码必须是12位或13位数字",
        errorEAN8: "EAN-8条形码必须是7位或8位数字",
        errorUPC: "UPC条形码必须是11位或12位数字",
        errorMaxBarcodes: "已达到条形码的最大数量",
        moreInfo: "了解更多关于条形码生成器",
        // 留言板翻译
        guestbookTitle: "留言板",
        guestbookDescription: "请留下您对条形码生成器的反馈或意见！",
        guestName: "姓名",
        guestMessage: "留言",
        submitGuestbook: "提交",
        noEntries: "暂无留言。成为第一个留言的人！",
        admin: "管理员",
        adminReplyPlaceholder: "输入管理员回复",
        submitReply: "发布回复",
        deleteEntry: "删除",
        confirmDelete: "您确定要删除这条留言吗？",
        emptyInputError: "请输入姓名和留言内容。"
    }
};

// 현재 선택된 언어 저장 변수
let currentLanguage = 'ko';

// 언어 변경 함수
function changeLanguage(lang) {
    if (!translations[lang]) {
        console.error('지원하지 않는 언어입니다:', lang);
        return;
    }
    
    currentLanguage = lang;
    
    // HTML 태그 lang 속성 업데이트
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-lang', lang);
    
    // 페이지 제목 업데이트
    document.title = lang === 'ko' 
        ? '바코드생성기 | QR코드 생성기 - 무료 바코드 생성 | Tani DevTool' 
        : `${translations[lang].title} - Tani DevTool`;
    
    // data-i18n 속성을 가진 모든 요소에 번역 적용
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });
    
    // placeholder 번역 적용
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[lang][key]) {
            element.setAttribute('placeholder', translations[lang][key]);
        }
    });
    
    // 오류 메시지 초기화
    document.getElementById('error').textContent = '';
    
    // 로컬 스토리지에 언어 설정 저장
    localStorage.setItem('preferredLanguage', lang);
    
    // 방명록 항목 다시 렌더링 (다국어 적용을 위해)
    if (typeof guestbookManager !== 'undefined') {
        guestbookManager.renderEntries();
    }
}

// 오류 메시지 표시 함수
function showError(errorKey) {
    const errorDiv = document.getElementById('error');
    if (errorDiv) {
        errorDiv.textContent = translations[currentLanguage][errorKey] || errorKey;
    }
}

// 페이지 로드 시 저장된 언어 설정 불러오기
document.addEventListener('DOMContentLoaded', function() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && translations[savedLang]) {
        document.getElementById('languageSelect').value = savedLang;
        changeLanguage(savedLang);
    } else {
        // 브라우저 언어 감지
        const userLang = navigator.language || navigator.userLanguage;
        const langCode = userLang.split('-')[0]; // ko-KR -> ko
        
        // 지원하는 언어인지 확인
        if (translations[langCode]) {
            document.getElementById('languageSelect').value = langCode;
            changeLanguage(langCode);
        }
    }
}); 