const fs = require('fs');
const path = require('path');

const lockFilePath = path.join(__dirname, 'yarn.lock');

try {
    let content = fs.readFileSync(lockFilePath, 'utf8');

    // 내부 저장소 URL을 공개 레지스트리 URL로 치환
    // 예: https://nexus.hankooktech.com/repository/mc-lib-group/ -> https://registry.npmjs.org/
    const newContent = content.replace(/https:\/\/nexus\.hankooktech\.com\/repository\/mc-lib-group\//g, 'https://registry.npmjs.org/');

    fs.writeFileSync(lockFilePath, newContent, 'utf8');
    console.log('Successfully replaced private registry URLs in yarn.lock');
} catch (err) {
    console.error('Error processing yarn.lock:', err);
    process.exit(1);
}
