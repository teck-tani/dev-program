import { NextRequest, NextResponse } from 'next/server';

function isPrivateIp(ip: string): boolean {
    if (!ip) return true;
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;
    if (ip.startsWith('10.')) return true;
    if (ip.startsWith('192.168.')) return true;
    // 172.16.0.0 – 172.31.255.255
    const m = ip.match(/^172\.(\d+)\./);
    if (m && Number(m[1]) >= 16 && Number(m[1]) <= 31) return true;
    return false;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const targetIp = searchParams.get('ip');

    let ip: string;

    if (targetIp) {
        ip = targetIp.trim();
    } else {
        // Vercel sets x-forwarded-for with the real client IP
        const forwarded = request.headers.get('x-forwarded-for');
        const realIp = request.headers.get('x-real-ip');
        ip = forwarded?.split(',')[0]?.trim() || realIp || '';

        // Dev (localhost): no forwarded headers → private IP → fetch external IP server-side
        if (isPrivateIp(ip)) {
            try {
                const ipRes = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
                const ipData = await ipRes.json();
                ip = ipData.ip;
            } catch {
                return NextResponse.json({ status: 'fail', message: 'Could not determine IP' }, { status: 400 });
            }
        }
    }

    if (!ip) {
        return NextResponse.json({ status: 'fail', message: 'Could not determine IP' }, { status: 400 });
    }

    try {
        // ip-api.com free tier only supports HTTP — must be called server-side
        const res = await fetch(
            `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,reverse,proxy,hosting,query`,
            { cache: 'no-store' }
        );

        if (!res.ok) {
            throw new Error(`ip-api.com responded with ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('IP info fetch error:', error);
        return NextResponse.json({ status: 'fail', message: 'Failed to fetch IP information' }, { status: 502 });
    }
}
