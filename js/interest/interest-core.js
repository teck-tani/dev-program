// interest-core.js - 이자 계산기를 위한 핵심 자바스크립트 코드

document.addEventListener('DOMContentLoaded', function() {
    console.log('이자 계산기 초기화 시작');
    
    // 공통 헤더와 푸터 로드
    loadCommonElements();
    
    // 초기 설정
    setupEventListeners();
    formatInputFields();
    toggleRegularDepositField(); // 정기 예금/적금 필드 초기 상태 설정
    
    console.log('이자 계산기 초기화 완료');
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 계산 버튼
    const calculateBtn = document.getElementById('calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateInterest);
        console.log('계산 버튼 이벤트 등록 완료');
    } else {
        console.error('계산 버튼 엘리먼트를 찾을 수 없습니다.');
    }
    
    // 입력 필드에 이벤트 리스너 추가
    attachInputListeners('principal');
    attachInputListeners('regular-deposit');
    
    // 이자율 입력 필드
    const rateInput = document.getElementById('rate');
    if (rateInput) rateInput.addEventListener('input', validateRateInput);
    
    // 이자 계산 방식 변경 시 정기 예금/적금 필드 표시 여부 결정
    const interestTypeInputs = document.querySelectorAll('input[name="interest-type"]');
    interestTypeInputs.forEach(input => {
        input.addEventListener('change', toggleRegularDepositField);
    });
    
    // 빠른 금액 추가 버튼
    setupQuickAmountButtons();
}

// 정기 예금/적금 필드 표시 여부 설정
function toggleRegularDepositField() {
    const interestType = document.querySelector('input[name="interest-type"]:checked').value;
    const regularDepositGroup = document.getElementById('regular-deposit-group');
    
    if (interestType === 'compound') {
        regularDepositGroup.style.display = 'block';
    } else {
        regularDepositGroup.style.display = 'none';
    }
}

// 입력 필드 초기 포맷
function formatInputFields() {
    const principalInput = document.getElementById('principal');
    const regularDepositInput = document.getElementById('regular-deposit');
    
    if (principalInput) principalInput.value = '';
    if (regularDepositInput) regularDepositInput.value = '0';
    
    // 정기 예금/적금 필드 초기 상태 설정
    toggleRegularDepositField();
}

// 입력 필드에 이벤트 리스너 추가
function attachInputListeners(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('input', handleCurrencyInput);
        console.log(`${inputId} 입력 필드 이벤트 등록 완료`);
    }
}

// 통화 입력 처리
function handleCurrencyInput(event) {
    const input = event.target;
    
    // 커서 위치 저장
    const cursorPos = input.selectionStart;
    
    // 콤마를 제거하고 숫자만 추출
    let value = input.value.replace(/,/g, '');
    
    // 숫자가 아닌 문자 제거
    value = value.replace(/[^\d]/g, '');
    
    // 숫자를 콤마가 포함된 형식으로 변환
    if (value) {
        const formattedValue = parseInt(value, 10).toLocaleString('ko-KR');
        
        // 입력값 업데이트
        input.value = formattedValue;
        
        // 커서 위치 조정 (포맷팅으로 인한 위치 변화 보정)
        const addedChars = formattedValue.length - value.length;
        const newCursorPos = cursorPos + addedChars;
        input.setSelectionRange(newCursorPos, newCursorPos);
    }
}

// 이자율 입력 유효성 검사
function validateRateInput(event) {
    const input = event.target;
    let value = input.value;
    
    // 이자율은 숫자와 소수점만 허용
    value = value.replace(/[^\d.]/g, '');
    
    // 소수점이 두 개 이상이면 첫 번째만 유지
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) {
        const firstDecimalIndex = value.indexOf('.');
        value = value.substring(0, firstDecimalIndex + 1) + 
               value.substring(firstDecimalIndex + 1).replace(/\./g, '');
    }
    
    // 이자율 최댓값 제한 (100% 이상은 입력 불가)
    if (parseFloat(value) > 100) {
        value = '100';
    }
    
    input.value = value;
}

// 빠른 금액 추가 버튼 설정
function setupQuickAmountButtons() {
    const quickAmountButtons = document.querySelectorAll('.quick-amount-btn');
    
    quickAmountButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const amount = parseInt(this.getAttribute('data-amount'));
            
            // 타겟 입력 필드
            const inputField = document.getElementById(targetId);
            if (!inputField) return;
            
            // 현재 값 가져오기
            let currentValue = inputField.value.replace(/,/g, '');
            currentValue = currentValue ? parseInt(currentValue) : 0;
            
            // 새 값 계산
            const newValue = currentValue + amount;
            
            // 새 값 적용 및 포맷팅
            inputField.value = newValue.toLocaleString('ko-KR');
            
            console.log(`금액 추가: ${targetId}에 ${amount.toLocaleString('ko-KR')}원 추가됨`);
        });
    });
    
    console.log('빠른 금액 추가 버튼 이벤트 등록 완료');
}

// 이자 계산
function calculateInterest() {
    console.log('이자 계산 시작');
    
    try {
        // 입력값 가져오기
        const principalStr = document.getElementById('principal').value;
        const rateStr = document.getElementById('rate').value;
        const periodStr = document.getElementById('period').value;
        const periodType = document.querySelector('input[name="period-type"]:checked').value;
        const interestType = document.querySelector('input[name="interest-type"]:checked').value;
        const taxType = document.querySelector('input[name="tax-type"]:checked').value;
        const regularDepositStr = document.getElementById('regular-deposit').value;
        
        // 입력값 검증
        if (!principalStr || !rateStr || !periodStr) {
            showToast('모든 필드를 입력해주세요.');
            return;
        }
        
        // 값 변환
        const principal = parseFloat(principalStr.replace(/,/g, ''));
        const rate = parseFloat(rateStr) / 100;
        let period = parseFloat(periodStr);
        const regularDeposit = parseFloat(regularDepositStr.replace(/,/g, '')) || 0;
        
        // 기간 단위 변환 (연 기준)
        if (periodType === 'months') {
            period = period / 12;
        } else if (periodType === 'days') {
            period = period / 365;
        }
        
        console.log('입력값:', {
            principal,
            rate,
            period,
            periodType,
            interestType,
            taxType,
            regularDeposit
        });
        
        let totalAmount, interestEarned;
        let timePoints = 0; // 초기화
        
        // 이자 계산 (단리 또는 월복리)
        if (interestType === 'simple') {
            // 단리 계산: 원금 × (1 + 이자율 × 기간)
            totalAmount = principal * (1 + rate * period);
            interestEarned = totalAmount - principal;
        } else {
            // 월복리 계산
            const compoundFrequency = 12; // 월복리는 연 12회
            timePoints = period * compoundFrequency;
            const ratePerPeriod = rate / compoundFrequency;
            
            // 정기 예금/적금이 있는 경우
            if (regularDeposit > 0) {
                // 정기 예금/적금을 포함한 복리 계산
                let amount = principal;
                for (let i = 0; i < timePoints; i++) {
                    amount = amount * (1 + ratePerPeriod) + regularDeposit;
                }
                totalAmount = amount;
                interestEarned = totalAmount - principal - (regularDeposit * timePoints);
            } else {
                // 기본 복리 계산: 원금 × (1 + 이자율/복리주기)^(복리주기×기간)
                totalAmount = principal * Math.pow(1 + ratePerPeriod, timePoints);
                interestEarned = totalAmount - principal;
            }
        }
        
        // 세금 계산
        let taxRate = 0;
        let taxAmount = 0;
        let afterTaxInterest = interestEarned;
        
        switch (taxType) {
            case 'normal':
                // 일반과세: 15.4% (소득세 14% + 지방소득세 1.4%)
                taxRate = 0.154;
                taxAmount = interestEarned * taxRate;
                afterTaxInterest = interestEarned - taxAmount;
                break;
            case 'preferred':
                // 세금우대: 9.5% (소득세 8.7% + 지방소득세 0.8%)
                taxRate = 0.095;
                taxAmount = interestEarned * taxRate;
                afterTaxInterest = interestEarned - taxAmount;
                break;
            case 'exempt':
                // 비과세: 0%
                taxRate = 0;
                taxAmount = 0;
                afterTaxInterest = interestEarned;
                break;
        }
        
        // 세후 만기 금액
        const afterTaxTotalAmount = principal + (regularDeposit * (interestType === 'compound' ? timePoints : 0)) + afterTaxInterest;
        
        // 결과 표시
        document.getElementById('interest-result').textContent = formatNumber(interestEarned) + '원';
        document.getElementById('tax-result').textContent = formatNumber(taxAmount) + '원';
        document.getElementById('after-tax-interest').textContent = formatNumber(afterTaxInterest) + '원';
        document.getElementById('total-result').textContent = formatNumber(afterTaxTotalAmount) + '원';
        document.getElementById('result-container').classList.add('show');
        
        // 그래프 생성
        createInterestChart(principal, rate, period, interestType, regularDeposit, taxType, taxRate);
        
        console.log('이자 계산 결과:', {
            principal,
            rate,
            period,
            interestType,
            regularDeposit,
            taxType,
            taxRate,
            interestEarned,
            taxAmount,
            afterTaxInterest,
            totalAmount
        });
    } catch (error) {
        console.error('이자 계산 오류:', error);
        showToast('계산 중 오류가 발생했습니다: ' + error.message);
    }
}

// 이자 차트 생성
function createInterestChart(principal, rate, period, interestType, regularDeposit, taxType, taxRate) {
    try {
        const ctx = document.getElementById('interest-chart').getContext('2d');
        
        // 차트 데이터 생성
        const labels = [];
        const principalData = [];
        const regularDepositData = [];
        const preTaxInterestData = [];
        const taxData = [];
        const afterTaxInterestData = [];
        
        // 그래프 포인트 계산 (최대 10개 포인트)
        const interval = period > 10 ? period / 10 : period / period;
        const points = period > 10 ? 10 : period;
        let totalRegularDeposit = 0;
        
        for (let i = 0; i <= points; i++) {
            const currentPeriod = i * interval;
            let totalAmount, interestEarned;
            
            // 현재 시점의 정기 예금/적금 총액 (월복리인 경우만)
            if (interestType === 'compound' && regularDeposit > 0) {
                totalRegularDeposit = regularDeposit * 12 * currentPeriod;
            }
            
            // 현재 시점의 이자 계산
            if (interestType === 'simple') {
                // 단리 계산
                totalAmount = principal * (1 + rate * currentPeriod);
                interestEarned = totalAmount - principal;
            } else {
                // 월복리 계산
                if (i === 0) {
                    totalAmount = principal;
                    interestEarned = 0;
                } else {
                    const compoundFrequency = 12;
                    const timePoints = currentPeriod * compoundFrequency;
                    const ratePerPeriod = rate / compoundFrequency;
                    
                    if (regularDeposit > 0) {
                        // 정기 예금/적금을 포함한 복리 계산
                        let tempAmount = principal;
                        for (let j = 0; j < timePoints; j++) {
                            tempAmount = tempAmount * (1 + ratePerPeriod) + regularDeposit;
                        }
                        totalAmount = tempAmount;
                        interestEarned = totalAmount - principal - totalRegularDeposit;
                    } else {
                        // 기본 복리 계산
                        totalAmount = principal * Math.pow(1 + ratePerPeriod, timePoints);
                        interestEarned = totalAmount - principal;
                    }
                }
            }
            
            // 세금 계산
            const taxAmount = interestEarned * taxRate;
            const afterTaxInterest = interestEarned - taxAmount;
            
            // 데이터 추가
            labels.push(currentPeriod.toFixed(1) + '년');
            principalData.push(principal);
            regularDepositData.push(totalRegularDeposit);
            preTaxInterestData.push(interestEarned);
            taxData.push(taxAmount);
            afterTaxInterestData.push(afterTaxInterest);
        }
        
        // 기존 차트 제거
        if (window.interestChart) {
            window.interestChart.destroy();
        }
        
        // 차트 데이터셋 설정
        const datasets = [];
        
        // 기본 데이터셋 (원금)
        datasets.push({
            label: '원금',
            data: principalData,
            backgroundColor: 'rgba(54, 162, 235, 0.5)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        });
        
        // 정기 예금/적금이 있는 경우에만 추가
        if (interestType === 'compound' && regularDeposit > 0) {
            datasets.push({
                label: '정기 예금/적금',
                data: regularDepositData,
                backgroundColor: 'rgba(75, 192, 192, 0.5)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            });
        }
        
        // 비과세가 아닌 경우 세전/세후 이자 표시
        if (taxType === 'exempt') {
            datasets.push({
                label: '이자',
                data: afterTaxInterestData,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            });
        } else {
            datasets.push({
                label: '세후 이자',
                data: afterTaxInterestData,
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1
            });
            
            datasets.push({
                label: '세금',
                data: taxData,
                backgroundColor: 'rgba(255, 206, 86, 0.5)',
                borderColor: 'rgba(255, 206, 86, 1)',
                borderWidth: 1
            });
        }
        
        // 차트 생성
        window.interestChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        ticks: {
                            callback: function(value) {
                                return formatNumber(value) + '원';
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + formatNumber(context.raw) + '원';
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('차트 생성 오류:', error);
    }
}

// 숫자 포맷팅 (천 단위 구분)
function formatNumber(number) {
    return Math.round(number).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// 토스트 메시지 표시
function showToast(message) {
    console.log('토스트 메시지:', message);
    
    let toast = document.querySelector('.toast');
    
    if (!toast) {
        toast = document.createElement('div');
        toast.className = 'toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '4px';
        toast.style.zIndex = '1000';
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-in-out';
        document.body.appendChild(toast);
    }
    
    toast.textContent = message;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
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