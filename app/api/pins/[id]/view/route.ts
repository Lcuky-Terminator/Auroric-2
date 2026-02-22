import { NextRequest, NextResponse } from 'next/server';
import { incrementPinViews } from '@/lib/db';

/**
 * POST /api/pins/[id]/view — Increment view count for a pin.
 * Called by the client after the user has been on the pin page for 2+ seconds.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const newViews = await incrementPinViews(id);
        return NextResponse.json({ views: newViews });
    } catch (error: any) {
        console.error('[pin/view] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
