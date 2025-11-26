/**
 * 로또 데이터 업데이트 스크립트
 * 
 * 1000회부터 현재까지의 로또 당첨 번호를 동행복권 API에서 가져와서
 * lottoData.json 파일에 저장합니다.
 * 
 * 사용법: 
 * 1. Node.js 환경에서 실행
 * 2. 터미널에서 node lotto-update.js 명령어로 실행
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 설정값
const JSON_FILE_PATH = path.join(__dirname, '../data/lotto/lottoData.json');
const START_ROUND = 1000; // 시작 회차
const DELAY_MS = 300; // API 호출 간 지연 시간 (밀리초)

/**
 * 현재 로또 회차 계산 (첫 회차 2002-12-07 기준)
 */
function calculateCurrentRound() {
    const firstDrawDate = new Date('2002-12-07');
    const today = new Date();
    
    // 첫 회부터 지금까지의 주 수 계산
    const weeksElapsed = Math.floor((today - firstDrawDate) / (7 * 24 * 60 * 60 * 1000));
    
    // 첫 회차가 1회였으므로 +1
    return weeksElapsed + 1;
}

/**
 * 로또 API에서 특정 회차 데이터 가져오기
 */
async function fetchRoundData(round) {
    return new Promise((resolve, reject) => {
        const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    
                    if (jsonData.returnValue === 'success') {
                        // 날짜 형식 변환
                        const drawDate = new Date(jsonData.drwNoDate);
                        const formattedDate = drawDate.toISOString().split('T')[0];
                        
                        // 번호 추출 및 정렬
                        const numbers = [
                            jsonData.drwtNo1, jsonData.drwtNo2, jsonData.drwtNo3,
                            jsonData.drwtNo4, jsonData.drwtNo5, jsonData.drwtNo6
                        ].sort((a, b) => a - b);
                        
                        resolve({
                            round: jsonData.drwNo,
                            date: formattedDate,
                            numbers: numbers,
                            bonus: jsonData.bnusNo
                        });
                    } else {
                        resolve(null); // 성공적인 응답이 아니면 null 반환
                    }
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * 지연 함수 (API 요청 사이의 간격 조절)
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * JSON 파일에 데이터 저장
 */
function saveToJson(data) {
    const dirPath = path.dirname(JSON_FILE_PATH);
    
    // 디렉토리가 없으면 생성
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // 파일에 데이터 쓰기
    fs.writeFileSync(JSON_FILE_PATH, JSON.stringify(data, null, 2));
    console.log(`데이터가 성공적으로 저장되었습니다: ${JSON_FILE_PATH}`);
}

/**
 * 기존 JSON 파일 읽기
 */
function readExistingData() {
    try {
        if (fs.existsSync(JSON_FILE_PATH)) {
            const data = fs.readFileSync(JSON_FILE_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('기존 데이터 읽기 실패:', error);
    }
    
    return [];
}

/**
 * 메인 함수: 로또 데이터 업데이트
 */
async function updateLottoData() {
    try {
        console.log('로또 데이터 업데이트를 시작합니다...');
        
        // 현재 회차 계산
        const currentRound = calculateCurrentRound();
        console.log(`현재 회차: ${currentRound}`);
        
        // 기존 데이터 읽기
        let existingData = readExistingData();
        console.log(`기존 데이터 ${existingData.length}개 로드 완료`);
        
        // 빠진 회차 확인 (START_ROUND부터 현재까지)
        const missingRounds = [];
        for (let i = START_ROUND; i <= currentRound; i++) {
            if (!existingData.some(item => item.round === i)) {
                missingRounds.push(i);
            }
        }
        
        console.log(`업데이트 필요한 회차: ${missingRounds.length}개`);
        
        // 빠진 회차 데이터 가져오기
        let updatedCount = 0;
        
        for (let i = 0; i < missingRounds.length; i++) {
            const round = missingRounds[i];
            
            try {
                const newData = await fetchRoundData(round);
                if (newData) {
                    existingData.push(newData);
                    updatedCount++;
                    console.log(`${round}회 데이터 추가 완료 (${i + 1}/${missingRounds.length})`);
                } else {
                    console.log(`${round}회 데이터 없음 (아직 추첨 전)`);
                }
            } catch (error) {
                console.error(`${round}회 데이터 가져오기 실패:`, error);
            }
            
            // API 호출 사이에 지연 시간 추가
            if (i < missingRounds.length - 1) {
                await delay(DELAY_MS);
            }
        }
        
        // 회차 번호로 내림차순 정렬
        existingData.sort((a, b) => b.round - a.round);
        
        // 파일에 저장
        saveToJson(existingData);
        
        console.log(`\n작업 완료: ${updatedCount}개 회차 업데이트됨`);
        console.log(`총 ${existingData.length}개 회차 데이터 저장됨`);
        
    } catch (error) {
        console.error('데이터 업데이트 중 오류 발생:', error);
    }
}

// 스크립트 실행
updateLottoData(); 