import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'src/data/lotto-history.json');

export async function GET() {
    if (!fs.existsSync(DATA_FILE_PATH)) {
        return NextResponse.json([]);
    }
    const fileContent = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    try {
        const data = JSON.parse(fileContent);
        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json([]);
    }
}
