import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const pool = getPool();
        const [rows] = await pool.execute(
            'SELECT drwNo, drwNoDate, drwtNo1, drwtNo2, drwtNo3, drwtNo4, drwtNo5, drwtNo6, bnusNo, totSellamnt, firstWinamnt, firstPrzwnerCo FROM lotto_rounds ORDER BY drwNo ASC'
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error('DB error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
