import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DELAY_MS = 2000;

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

interface LottoData {
    drwNo: number;
    drwNoDate: string;
    drwtNo1: number;
    drwtNo2: number;
    drwtNo3: number;
    drwtNo4: number;
    drwtNo5: number;
    drwtNo6: number;
    bnusNo: number;
    totSellamnt: number;
    firstWinamnt: number;
    firstPrzwnerCo: number;
    firstAccumamnt: number;
}

async function fetchLottoRound(drwNo: number): Promise<LottoData | null> {
    const url = `https://pyony.com/lotto/rounds/${drwNo}/`;
    try {
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TeckTani/1.0)' }
        });
        if (!res.ok) return null;
        const html = await res.text();

        // Extract winning numbers from numberCircle elements
        const numberMatches = html.match(/numberCircle[^>]*><strong>(\d+)<\/strong>/g);
        if (!numberMatches || numberMatches.length < 7) return null;

        const numbers = numberMatches.map(m => {
            const match = m.match(/<strong>(\d+)<\/strong>/);
            return match ? parseInt(match[1], 10) : 0;
        });

        // First 6 are main numbers, 7th is bonus
        const [drwtNo1, drwtNo2, drwtNo3, drwtNo4, drwtNo5, drwtNo6, bnusNo] = numbers;

        // Extract 1st prize winners count and amount from the table
        // Pattern: <th>1등</th> <td>count</td> <td><a>amount</a> 원</td>
        const prizeMatch = html.match(
            /1등<\/th>\s*<td[^>]*>(\d[\d,]*)<\/td>\s*<td[^>]*><a[^>]*>([\d,]+)<\/a>\s*원/
        );
        const firstPrzwnerCo = prizeMatch ? parseInt(prizeMatch[1].replace(/,/g, ''), 10) : 0;
        const firstWinamnt = prizeMatch ? parseInt(prizeMatch[2].replace(/,/g, ''), 10) : 0;
        const firstAccumamnt = firstPrzwnerCo * firstWinamnt;

        // Extract draw date from page title or content
        // Title format: "로또 1211회 당첨번호"
        // We calculate the date: round 1 was 2002-12-07, each round is +7 days
        const baseDate = new Date('2002-12-07');
        const drawDate = new Date(baseDate.getTime() + (drwNo - 1) * 7 * 24 * 60 * 60 * 1000);
        const drwNoDate = drawDate.toISOString().split('T')[0];

        return {
            drwNo, drwNoDate,
            drwtNo1, drwtNo2, drwtNo3, drwtNo4, drwtNo5, drwtNo6, bnusNo,
            totSellamnt: 0, firstWinamnt, firstPrzwnerCo, firstAccumamnt,
        };
    } catch (error) {
        console.error(`Error fetching round ${drwNo}:`, error);
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const forceStart = searchParams.get('start');
    const count = parseInt(searchParams.get('count') || '5', 10);

    try {
        const pool = getPool();

        const [lastRows] = await pool.execute(
            'SELECT MAX(drwNo) as lastRound FROM lotto_rounds'
        ) as [Array<{ lastRound: number | null }>, unknown];
        const lastRound = lastRows[0]?.lastRound || 0;

        const startRound = forceStart ? parseInt(forceStart, 10) : (lastRound + 1);

        const newItems: LottoData[] = [];
        let currentRound = startRound;

        for (let i = 0; i < count; i++) {
            console.log(`Fetching Lotto Round: ${currentRound}`);
            const data = await fetchLottoRound(currentRound);

            if (!data) {
                console.log(`Round ${currentRound} returned no data. Stopping.`);
                break;
            }

            newItems.push(data);
            currentRound++;

            if (i < count - 1) await wait(DELAY_MS);
        }

        if (newItems.length > 0) {
            for (const item of newItems) {
                await pool.execute(
                    `INSERT IGNORE INTO lotto_rounds
                     (drwNo, drwNoDate, drwtNo1, drwtNo2, drwtNo3, drwtNo4, drwtNo5, drwtNo6, bnusNo, totSellamnt, firstWinamnt, firstPrzwnerCo, firstAccumamnt)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        item.drwNo, item.drwNoDate,
                        item.drwtNo1, item.drwtNo2, item.drwtNo3, item.drwtNo4, item.drwtNo5, item.drwtNo6,
                        item.bnusNo,
                        item.totSellamnt, item.firstWinamnt,
                        item.firstPrzwnerCo, item.firstAccumamnt,
                    ]
                );
            }

            return NextResponse.json({
                status: 'success',
                processed: newItems.length,
                lastProcessedRound: currentRound - 1,
                nextRound: currentRound,
                message: `Successfully processed ${newItems.length} rounds.`
            });
        }

        return NextResponse.json({
            status: 'done',
            message: 'No new rounds to fetch.',
            lastRound,
        });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ status: 'error', message: String(error) }, { status: 500 });
    }
}
