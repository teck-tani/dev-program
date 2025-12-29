const fs = require('fs');
const path = require('path');
const https = require('https');

const DATA_FILE_PATH = path.join(__dirname, '../src/data/lotto-history.json');
const DELAY_MS = 1000; // 1 second delay
const MAX_ROUND = 1204;

// Helper to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper to fetch
const fetchLotto = (drwNo) => {
    return new Promise((resolve, reject) => {
        const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.returnValue === 'success') {
                        resolve(json);
                    } else {
                        resolve(null);
                    }
                } catch (e) {
                    console.error(`\nError parsing round ${drwNo}:`, e);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error(`\nNetwork error round ${drwNo}:`, err);
            resolve(null);
        });
    });
};

const main = async () => {
    console.log("========================================");
    console.log("   Lotto Data Fetch Script Started");
    console.log("   Target: Round 1 ~ " + MAX_ROUND);
    console.log("========================================");
    
    // 1. Load existing
    let history = [];
    if (fs.existsSync(DATA_FILE_PATH)) {
        try {
            history = JSON.parse(fs.readFileSync(DATA_FILE_PATH, 'utf-8'));
            console.log(`> Found existing data: ${history.length} rounds loaded.`);
        } catch (e) {
            console.log("> starting fresh.");
        }
    } else {
        // Ensure directory exists
        const dir = path.dirname(DATA_FILE_PATH);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
    }

    // 2. Loop
    let newCount = 0;
    for (let round = 1; round <= MAX_ROUND; round++) {
        // Check if exists
        const exists = history.find(h => h.drwNo === round);
        if (exists) {
            // Optional: Skip log for speed or just verify
            // process.stdout.write(`\r[Checking] Round ${round}/${MAX_ROUND} - Exists`);
            continue;
        }

        // Fetch
        process.stdout.write(`\r[Fetching] Round ${round}/${MAX_ROUND} ... `);
        const data = await fetchLotto(round);
        
        if (data) {
            history.push(data);
            newCount++;
            process.stdout.write("Success! (Total: " + history.length + ")");
            
            // Save frequently (every 10 rounds)
            if (newCount % 5 === 0) {
                history.sort((a, b) => a.drwNo - b.drwNo);
                fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(history, null, 2), 'utf-8');
            }
        } else {
            process.stdout.write("Failed (or No Data).");
        }

        // Delay
        await wait(DELAY_MS);
    }

    // Final Save
    history.sort((a, b) => a.drwNo - b.drwNo);
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(history, null, 2), 'utf-8');
    
    console.log("\n\n========================================");
    console.log("   All Done!");
    console.log(`   Total Rounds: ${history.length}`);
    console.log("========================================");
};

main();
