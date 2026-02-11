export const runtime = 'edge';

export async function GET() {
    const timestamp = Date.now();
    return new Response(
        JSON.stringify({ timestamp }),
        {
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
        }
    );
}
