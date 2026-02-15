import mysql from 'mysql2/promise';

const ROUNDS = [
    {
        drwNo: 1205, drwNoDate: '2026-01-03',
        drwtNo1: 1, drwtNo2: 4, drwtNo3: 16, drwtNo4: 23, drwtNo5: 31, drwtNo6: 41, bnusNo: 2,
        totSellamnt: 0, firstWinamnt: 3226386263, firstPrzwnerCo: 10, firstAccumamnt: 32263862630
    },
    {
        drwNo: 1206, drwNoDate: '2026-01-10',
        drwtNo1: 1, drwtNo2: 3, drwtNo3: 17, drwtNo4: 26, drwtNo5: 27, drwtNo6: 42, bnusNo: 23,
        totSellamnt: 0, firstWinamnt: 1868807000, firstPrzwnerCo: 15, firstAccumamnt: 28032105000
    },
    {
        drwNo: 1207, drwNoDate: '2026-01-17',
        drwtNo1: 10, drwtNo2: 22, drwtNo3: 24, drwtNo4: 27, drwtNo5: 38, drwtNo6: 45, bnusNo: 11,
        totSellamnt: 0, firstWinamnt: 1730000000, firstPrzwnerCo: 17, firstAccumamnt: 29460000000
    },
    {
        drwNo: 1208, drwNoDate: '2026-01-24',
        drwtNo1: 6, drwtNo2: 27, drwtNo3: 30, drwtNo4: 36, drwtNo5: 38, drwtNo6: 42, bnusNo: 25,
        totSellamnt: 0, firstWinamnt: 5000000000, firstPrzwnerCo: 6, firstAccumamnt: 30010000000
    },
    {
        drwNo: 1209, drwNoDate: '2026-01-31',
        drwtNo1: 2, drwtNo2: 17, drwtNo3: 20, drwtNo4: 35, drwtNo5: 37, drwtNo6: 39, bnusNo: 24,
        totSellamnt: 0, firstWinamnt: 1370000000, firstPrzwnerCo: 22, firstAccumamnt: 30180000000
    },
    {
        drwNo: 1210, drwNoDate: '2026-02-07',
        drwtNo1: 1, drwtNo2: 7, drwtNo3: 9, drwtNo4: 17, drwtNo5: 27, drwtNo6: 38, bnusNo: 31,
        totSellamnt: 0, firstWinamnt: 1100000000, firstPrzwnerCo: 24, firstAccumamnt: 26460000000
    },
    {
        drwNo: 1211, drwNoDate: '2026-02-14',
        drwtNo1: 23, drwtNo2: 26, drwtNo3: 27, drwtNo4: 35, drwtNo5: 38, drwtNo6: 40, bnusNo: 10,
        totSellamnt: 0, firstWinamnt: 2370000000, firstPrzwnerCo: 14, firstAccumamnt: 33190000000
    },
];

async function main() {
    const conn = await mysql.createConnection({
        host: 'teck-tani.iptime.org', port: 60336,
        user: 'admin', password: 'dream5895!', database: 'teck-tani'
    });

    const [rows] = await conn.execute('SELECT MAX(drwNo) as last FROM lotto_rounds');
    console.log('Last round in DB:', rows[0].last);

    let inserted = 0;
    for (const r of ROUNDS) {
        await conn.execute(
            'INSERT IGNORE INTO lotto_rounds (drwNo,drwNoDate,drwtNo1,drwtNo2,drwtNo3,drwtNo4,drwtNo5,drwtNo6,bnusNo,totSellamnt,firstWinamnt,firstPrzwnerCo,firstAccumamnt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
            [r.drwNo, r.drwNoDate, r.drwtNo1, r.drwtNo2, r.drwtNo3, r.drwtNo4, r.drwtNo5, r.drwtNo6, r.bnusNo, r.totSellamnt, r.firstWinamnt, r.firstPrzwnerCo, r.firstAccumamnt]
        );
        console.log(`Inserted #${r.drwNo} (${r.drwNoDate}): ${[r.drwtNo1, r.drwtNo2, r.drwtNo3, r.drwtNo4, r.drwtNo5, r.drwtNo6].join(',')} + ${r.bnusNo}`);
        inserted++;
    }

    console.log(`Done! Inserted ${inserted} rounds.`);
    const [total] = await conn.execute('SELECT COUNT(*) as cnt, MAX(drwNo) as last FROM lotto_rounds');
    console.log(`Total: ${total[0].cnt} rows | Latest: #${total[0].last}`);
    await conn.end();
}

main().catch(e => { console.error(e); process.exit(1); });
