import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/lotto-history.json');
const DELAY_MS = 2000; // 2 seconds delay to avoid IP block

async function wait(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchLottoRound(drwNo: number) {
    const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch round ${drwNo}`);
        const data = await res.json();
        return data.returnValue === 'success' ? data : null;
    } catch (error) {
        console.error(`Error fetching round ${drwNo}:`, error);
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    // Optional: manually specify start round, otherwise auto-detect
    const forceStart = searchParams.get('start');
    const count = parseInt(searchParams.get('count') || '5', 10); // Process 5 at a time by default

    // 1. Load existing data
    let history: any[] = [];
    if (fs.existsSync(DATA_FILE_PATH)) {
        const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
        try {
            history = JSON.parse(fileContent);
        } catch (e) {
            history = [];
        }
    }

    // 2. Determine start round
    // If we have history, start from (last round + 1). If empty, start from 1.
    const lastRound = history.length > 0 ? history[history.length - 1].drwNo : 0;
    let startRound = forceStart ? parseInt(forceStart, 10) : (lastRound + 1);
    
    // Safety: prevent infinite loop if startRound is ridiculously high without data
    // (Lotto is around 1200 as of late 2025? No, as of 2025 it's around 1150-1200)
    // We'll trust the logic for now.

    const newItems = [];
    let currentRound = startRound;
    
    // 3. Loop and fetch
    for (let i = 0; i < count; i++) {
        // If we are just starting this batch, or subsequent items
        console.log(`Fetching Lotto Round: ${currentRound}`);
        
        const data = await fetchLottoRound(currentRound);
        
        // If data is null or fail (e.g. future round), we stop
        if (!data) {
            console.log(`Round ${currentRound} returned no data (possibly future). Stopping.`);
            break;
        }

        newItems.push(data);
        currentRound++;

        // Delay if we are not at the last item
        if (i < count - 1) {
            await wait(DELAY_MS);
        }
    }

    // 4. Save if we have new items
    if (newItems.length > 0) {
        // Merge and Sort just in case
        const updatedHistory = [...history, ...newItems].sort((a, b) => a.drwNo - b.drwNo);
        // Deduplicate based on drwNo
        const uniqueHistory = Array.from(new Map(updatedHistory.map(item => [item.drwNo, item])).values());
        
        fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(uniqueHistory, null, 2), 'utf-8');
        
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
        lastRound: lastRound
    });
}
