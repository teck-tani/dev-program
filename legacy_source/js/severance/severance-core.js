// severance-core.js - 퇴직금 계산기를 위한 핵심 자바스크립트 코드

document.addEventListener('DOMContentLoaded', function() {
    console.log('퇴직금 계산기 초기화 시작');
    
    // 공통 헤더와 푸터 로드
    loadCommonElements();
    
    // 초기 설정
    setupEventListeners();
    setDefaultDates();
    
    console.log('퇴직금 계산기 초기화 완료');
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 계산 버튼
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateSeverance);
        console.log('계산 버튼 이벤트 등록 완료');
    } else {
        console.error('계산 버튼 엘리먼트를 찾을 수 없습니다.');
    }
    
    // 입력 필드 유효성 검사
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const monthlySalaryInput = document.getElementById('monthlySalary');
    
    if (startDateInput) startDateInput.addEventListener('change', validateDates);
    if (endDateInput) endDateInput.addEventListener('change', validateDates);
    if (monthlySalaryInput) monthlySalaryInput.addEventListener('input', handleMonthlySalaryInput);
    
    console.log('입력 필드 이벤트 등록 완료');
}

// 기본 날짜 설정
function setDefaultDates() {
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);
    
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (startDateInput) startDateInput.value = formatDate(oneYearAgo);
    if (endDateInput) endDateInput.value = formatDate(today);
    
    console.log('기본 날짜 설정 완료');
}

// 날짜 형식 변환 (YYYY-MM-DD)
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 날짜 유효성 검사
function validateDates() {
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    
    if (!startDateInput || !endDateInput) return;
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    if (startDate > endDate) {
        showToast('퇴사일은 입사일보다 이후여야 합니다.');
        endDateInput.value = formatDate(startDate);
    }
}

// 월 급여 입력 처리
function handleMonthlySalaryInput(event) {
    console.log('월 급여 입력 처리 시작');
    const input = event.target;
    
    // 커서 위치 저장
    const cursorPos = input.selectionStart;
    
    // 콤마를 제거하고 숫자만 추출
    let value = input.value.replace(/,/g, '');
    
    // 숫자가 아닌 문자 제거
    value = value.replace(/[^\d]/g, '');
    
    // 숫자를 콤마가 포함된 형식으로 변환
    if (value) {
        const formattedValue = parseInt(value).toLocaleString('ko-KR');
        console.log(`입력값 변환: ${value} -> ${formattedValue}`);
        
        // 입력값 업데이트
        input.value = formattedValue;
        
        // 커서 위치 조정
        const newCursorPos = cursorPos + (input.value.length - value.length - (input.value.length - cursorPos));
        input.setSelectionRange(newCursorPos, newCursorPos);
    } else {
        input.value = '';
    }
}

// 급여 유효성 검사
function validateSalary() {
    const salaryInput = document.getElementById('monthlySalary');
    if (!salaryInput) return;
    
    // 콤마 제거 후 숫자만 추출
    const salary = salaryInput.value.replace(/,/g, '');
    
    if (salary && parseInt(salary) < 0) {
        salaryInput.value = '0';
        showToast('급여는 0 이상이어야 합니다.');
    }
}

// 퇴직금 계산
function calculateSeverance() {
    console.log('퇴직금 계산 시작');
    
    // 입력값 가져오기
    const startDateInput = document.getElementById('startDate');
    const endDateInput = document.getElementById('endDate');
    const monthlySalaryInput = document.getElementById('monthlySalary');
    const workDaysSelect = document.getElementById('workDays');
    
    if (!startDateInput || !endDateInput || !monthlySalaryInput || !workDaysSelect) {
        console.error('필수 입력 필드를 찾을 수 없습니다.');
        return;
    }
    
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    const monthlySalaryStr = monthlySalaryInput.value;
    const monthlySalary = parseFloat(monthlySalaryStr.replace(/,/g, ''));
    const workDaysPerWeek = parseInt(workDaysSelect.value);
    
    console.log('입력값:', {
        startDate: startDateInput.value,
        endDate: endDateInput.value,
        monthlySalaryStr,
        monthlySalary,
        workDaysPerWeek
    });
    
    // 입력값 검증
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || isNaN(monthlySalary) || monthlySalary <= 0) {
        showToast('모든 필드를 올바르게 입력해주세요.');
        console.log('입력값 오류:', {
            startDateValid: !isNaN(startDate.getTime()),
            endDateValid: !isNaN(endDate.getTime()),
            monthlySalaryValid: !isNaN(monthlySalary) && monthlySalary > 0
        });
        return;
    }
    
    // 근무일수 계산
    const workDays = calculateWorkDays(startDate, endDate, workDaysPerWeek);
    
    // 일 평균임금 계산
    const dailySalary = calculateDailySalary(monthlySalary, workDaysPerWeek);
    
    // 퇴직금 계산
    const severancePay = calculateSeverancePay(dailySalary, workDays);
    
    console.log('계산 결과:', {
        workDays,
        dailySalary,
        severancePay
    });
    
    // 결과 표시
    displayResults(workDays, dailySalary, severancePay);
}

// 근무일수 계산
function calculateWorkDays(startDate, endDate, workDaysPerWeek) {
    let workDays = 0;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        
        // 주말 제외 (토요일: 6, 일요일: 0)
        if (workDaysPerWeek === 5 && (dayOfWeek === 0 || dayOfWeek === 6)) {
            // 5일제 근무인 경우 주말 제외
        } else if (workDaysPerWeek === 6 && dayOfWeek === 0) {
            // 6일제 근무인 경우 일요일만 제외
        } else {
            workDays++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workDays;
}

// 일 평균임금 계산
function calculateDailySalary(monthlySalary, workDaysPerWeek) {
    // 월 평균 근무일수 계산
    const avgWorkDaysPerMonth = (workDaysPerWeek * 52) / 12;
    
    // 일 평균임금 계산
    return Math.round(monthlySalary / avgWorkDaysPerMonth);
}

// 퇴직금 계산
function calculateSeverancePay(dailySalary, workDays) {
    // 근속연수 계산 (1년 미만은 1년으로 계산)
    const yearsOfService = Math.max(1, Math.ceil(workDays / 365));
    
    // 퇴직금 계산: 1일 평균임금 × 30일 × (근속연수 + 1)
    return dailySalary * 30 * (yearsOfService + 1);
}

// 결과 표시
function displayResults(workDays, dailySalary, severancePay) {
    const resultContainer = document.getElementById('resultContainer');
    const workDaysResult = document.getElementById('workDaysResult');
    const dailySalaryResult = document.getElementById('dailySalaryResult');
    const severanceResult = document.getElementById('severanceResult');
    
    if (!resultContainer || !workDaysResult || !dailySalaryResult || !severanceResult) {
        console.error('결과 표시를 위한 엘리먼트를 찾을 수 없습니다.');
        return;
    }
    
    workDaysResult.textContent = formatNumber(workDays) + '일';
    dailySalaryResult.textContent = formatNumber(dailySalary) + '원';
    severanceResult.textContent = formatNumber(severancePay) + '원';
    
    resultContainer.classList.add('show');
    console.log('결과 표시 완료');
}

// 숫자 포맷팅 (천 단위 구분)
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 토스트 메시지 표시
function showToast(message) {
    console.log('토스트 메시지:', message);
    
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

// 공통 헤더와 푸터 로드
function loadCommonElements() {
    try {
        // common.js에 정의된 loadLayout 함수 호출
        if (typeof loadLayout === 'function') {
            loadLayout();
        } else {
            console.error('loadLayout 함수를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('공통 요소 로드 오류:', error);
    }
} 