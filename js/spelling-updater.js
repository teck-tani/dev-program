/**
 * 한글 맞춤법 규칙 업데이트 스크립트
 * 
 * 이 스크립트는 한글 맞춤법 규칙 데이터베이스를 업데이트하는 도구입니다.
 * 새로운 규칙을 추가하거나 기존 규칙을 수정할 수 있습니다.
 */

const fs = require('fs');
const path = require('path');

// 규칙 파일 경로
const RULES_FILE_PATH = path.join(__dirname, '../data/spelling/korean-spelling-rules.json');

/**
 * 현재 규칙 데이터베이스를 로드합니다.
 */
function loadRules() {
  try {
    const data = fs.readFileSync(RULES_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('규칙 파일을 읽는 중 오류가 발생했습니다:', error.message);
    return null;
  }
}

/**
 * 규칙 데이터베이스를 저장합니다.
 * @param {Object} rulesData - 저장할 규칙 데이터
 */
function saveRules(rulesData) {
  try {
    const data = JSON.stringify(rulesData, null, 2);
    fs.writeFileSync(RULES_FILE_PATH, data, 'utf8');
    console.log('규칙 파일이 성공적으로 저장되었습니다.');
    return true;
  } catch (error) {
    console.error('규칙 파일을 저장하는 중 오류가 발생했습니다:', error.message);
    return false;
  }
}

/**
 * 새로운 규칙을 추가합니다.
 * @param {Object} rule - 추가할 규칙 객체
 */
function addRule(rule) {
  const rulesData = loadRules();
  if (!rulesData) return false;

  // 규칙 유효성 검사
  if (!rule.id || !rule.pattern || !rule.correction) {
    console.error('규칙에는 id, pattern, correction이 필요합니다.');
    return false;
  }

  // ID 중복 검사
  const existingRule = rulesData.rules.find(r => r.id === rule.id);
  if (existingRule) {
    console.error(`ID '${rule.id}'를 가진 규칙이 이미 존재합니다.`);
    return false;
  }

  // 규칙 추가
  rulesData.rules.push(rule);
  
  // 버전 및 업데이트 날짜 갱신
  rulesData.updated = new Date().toISOString().split('T')[0];
  
  return saveRules(rulesData);
}

/**
 * 기존 규칙을 수정합니다.
 * @param {string} ruleId - 수정할 규칙의 ID
 * @param {Object} updatedRule - 수정된 규칙 객체
 */
function updateRule(ruleId, updatedRule) {
  const rulesData = loadRules();
  if (!rulesData) return false;

  // 규칙 찾기
  const ruleIndex = rulesData.rules.findIndex(r => r.id === ruleId);
  if (ruleIndex === -1) {
    console.error(`ID '${ruleId}'를 가진 규칙을 찾을 수 없습니다.`);
    return false;
  }

  // ID는 변경하지 않음
  updatedRule.id = ruleId;

  // 규칙 업데이트
  rulesData.rules[ruleIndex] = updatedRule;
  
  // 버전 및 업데이트 날짜 갱신
  rulesData.updated = new Date().toISOString().split('T')[0];
  
  return saveRules(rulesData);
}

/**
 * 규칙을 삭제합니다.
 * @param {string} ruleId - 삭제할 규칙의 ID
 */
function deleteRule(ruleId) {
  const rulesData = loadRules();
  if (!rulesData) return false;

  // 규칙 찾기
  const ruleIndex = rulesData.rules.findIndex(r => r.id === ruleId);
  if (ruleIndex === -1) {
    console.error(`ID '${ruleId}'를 가진 규칙을 찾을 수 없습니다.`);
    return false;
  }

  // 규칙 삭제
  rulesData.rules.splice(ruleIndex, 1);
  
  // 버전 및 업데이트 날짜 갱신
  rulesData.updated = new Date().toISOString().split('T')[0];
  
  return saveRules(rulesData);
}

/**
 * 새로운 정규식 패턴을 추가합니다.
 * @param {Object} pattern - 추가할 패턴 객체
 */
function addPattern(pattern) {
  const rulesData = loadRules();
  if (!rulesData) return false;

  // 패턴 유효성 검사
  if (!pattern.id || !pattern.regex) {
    console.error('패턴에는 id, regex가 필요합니다.');
    return false;
  }

  // ID 중복 검사
  const existingPattern = rulesData.patterns.find(p => p.id === pattern.id);
  if (existingPattern) {
    console.error(`ID '${pattern.id}'를 가진 패턴이 이미 존재합니다.`);
    return false;
  }

  // 패턴 추가
  rulesData.patterns.push(pattern);
  
  // 버전 및 업데이트 날짜 갱신
  rulesData.updated = new Date().toISOString().split('T')[0];
  
  return saveRules(rulesData);
}

/**
 * 버전을 업데이트합니다.
 * @param {string} version - 새 버전 문자열 (예: "1.0.1")
 */
function updateVersion(version) {
  const rulesData = loadRules();
  if (!rulesData) return false;
  
  rulesData.version = version;
  rulesData.updated = new Date().toISOString().split('T')[0];
  
  return saveRules(rulesData);
}

/**
 * 규칙 목록을 조회합니다.
 * @param {string} category - 선택적: 특정 카테고리의 규칙만 필터링
 */
function listRules(category = null) {
  const rulesData = loadRules();
  if (!rulesData) return [];
  
  const rules = rulesData.rules;
  
  if (category) {
    return rules.filter(rule => rule.category === category);
  }
  
  return rules;
}

/**
 * 패턴 목록을 조회합니다.
 */
function listPatterns() {
  const rulesData = loadRules();
  if (!rulesData) return [];
  
  return rulesData.patterns;
}

// 커맨드 라인 인터페이스 구현 (CLI)
function runCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'list':
      console.log('현재 규칙 목록:');
      console.log(JSON.stringify(listRules(), null, 2));
      break;
      
    case 'list-patterns':
      console.log('현재 정규식 패턴 목록:');
      console.log(JSON.stringify(listPatterns(), null, 2));
      break;
      
    case 'add':
      if (args.length < 2) {
        console.error('사용법: node spelling-updater.js add \'{"id":"r031","category":"철자","pattern":"오류패턴","correction":"수정패턴","examples":[{"error":"오류예시","correction":"수정예시"}],"description":"설명"}\'');
        return;
      }
      try {
        const rule = JSON.parse(args[1]);
        if (addRule(rule)) {
          console.log(`규칙 '${rule.id}'가 추가되었습니다.`);
        }
      } catch (error) {
        console.error('규칙 JSON 파싱 오류:', error.message);
      }
      break;
      
    case 'update':
      if (args.length < 3) {
        console.error('사용법: node spelling-updater.js update "ruleId" \'{"pattern":"새패턴","correction":"새수정"}\'');
        return;
      }
      try {
        const ruleId = args[1];
        const updatedRule = JSON.parse(args[2]);
        if (updateRule(ruleId, updatedRule)) {
          console.log(`규칙 '${ruleId}'가 업데이트되었습니다.`);
        }
      } catch (error) {
        console.error('규칙 JSON 파싱 오류:', error.message);
      }
      break;
      
    case 'delete':
      if (args.length < 2) {
        console.error('사용법: node spelling-updater.js delete "ruleId"');
        return;
      }
      const ruleId = args[1];
      if (deleteRule(ruleId)) {
        console.log(`규칙 '${ruleId}'가 삭제되었습니다.`);
      }
      break;
      
    case 'add-pattern':
      if (args.length < 2) {
        console.error('사용법: node spelling-updater.js add-pattern \'{"id":"p003","category":"띄어쓰기","regex":"패턴","examples":[{"error":"오류예시","correction":"수정예시"}],"description":"설명"}\'');
        return;
      }
      try {
        const pattern = JSON.parse(args[1]);
        if (addPattern(pattern)) {
          console.log(`패턴 '${pattern.id}'가 추가되었습니다.`);
        }
      } catch (error) {
        console.error('패턴 JSON 파싱 오류:', error.message);
      }
      break;
      
    case 'version':
      if (args.length < 2) {
        console.error('사용법: node spelling-updater.js version "1.0.1"');
        return;
      }
      const version = args[1];
      if (updateVersion(version)) {
        console.log(`버전이 '${version}'로 업데이트되었습니다.`);
      }
      break;
      
    default:
      console.log(`
맞춤법 규칙 업데이트 도구

사용법:
  node spelling-updater.js <명령어> [매개변수...]

명령어:
  list                 - 모든 규칙 목록을 표시합니다.
  list-patterns        - 모든 정규식 패턴 목록을 표시합니다.
  add <규칙JSON>        - 새 규칙을 추가합니다.
  update <id> <규칙JSON> - 기존 규칙을 업데이트합니다.
  delete <id>          - 규칙을 삭제합니다.
  add-pattern <패턴JSON> - 새 정규식 패턴을 추가합니다.
  version <버전>        - 버전 정보를 업데이트합니다.

예시:
  node spelling-updater.js add '{"id":"r031","category":"철자","pattern":"오류패턴","correction":"수정패턴","examples":[{"error":"오류예시","correction":"수정예시"}],"description":"설명"}'
  node spelling-updater.js update "r001" '{"pattern":"새패턴","correction":"새수정","examples":[{"error":"예시","correction":"수정"}],"description":"설명"}'
  node spelling-updater.js version "1.0.1"
      `);
      break;
  }
}

// CLI 실행
if (require.main === module) {
  runCLI();
}

// 모듈로 사용시 함수 내보내기
module.exports = {
  loadRules,
  saveRules,
  addRule,
  updateRule,
  deleteRule,
  addPattern,
  updateVersion,
  listRules,
  listPatterns
}; 