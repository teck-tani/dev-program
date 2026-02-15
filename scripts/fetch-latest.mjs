import mysql from 'mysql2/promise';

async function main() {
    const conn = await mysql.createConnection({
        host: 'teck-tani.iptime.org', port: 60336,
        user: 'admin', password: 'dream5895!', database: 'teck-tani'
    });

    const [rows] = await conn.execute('SELECT MAX(drwNo) as last FROM lotto_rounds');
    console.log('Last round in DB:', rows[0].last);

    let round = rows[0].last + 1;
    let count = 0;

    while (true) {
        const res = await fetch(`https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const text = await res.text();
        let data;
        try { data = JSON.parse(text); } catch { console.log(`Round ${round}: invalid response. Stopping.`); break; }
        if (data.returnValue !== 'success') {
            console.log(`Round ${round} not available yet. Stopping.`);
            break;
        }
        await conn.execute(
            'INSERT IGNORE INTO lotto_rounds (drwNo,drwNoDate,drwtNo1,drwtNo2,drwtNo3,drwtNo4,drwtNo5,drwtNo6,bnusNo,totSellamnt,firstWinamnt,firstPrzwnerCo,firstAccumamnt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [data.drwNo, data.drwNoDate, data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6, data.bnusNo, data.totSellamnt || 0, data.firstWinamnt || 0, data.firstPrzwnerCo || 0, data.firstAccumamnt || 0]
        );
        console.log(`Inserted #${data.drwNo} (${data.drwNoDate}): ${[data.drwtNo1, data.drwtNo2, data.drwtNo3, data.drwtNo4, data.drwtNo5, data.drwtNo6].join(',')} + ${data.bnusNo}`);
        round++;
        count++;
        await new Promise(r => setTimeout(r, 1500));
    }

    console.log(`Done! Inserted ${count} new rounds.`);
    const [total] = await conn.execute('SELECT COUNT(*) as cnt, MAX(drwNo) as last FROM lotto_rounds');
    console.log(`Total: ${total[0].cnt} rows | Latest: #${total[0].last}`);
    await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
