import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isBlocked, blockUser, unblockUser } from '@/lib/db';

// POST /api/users/[id]/block
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

        const { id: targetUserId } = await params;

        // Check current block status
        const blockedData = await isBlocked(currentUser.id, targetUserId);

        if (blockedData) {
            // It is currently blocked -> Unblock
            await unblockUser(currentUser.id, targetUserId);
            return NextResponse.json({ blocked: false });
        } else {
            // It is not blocked -> Block
            await blockUser(currentUser.id, targetUserId);
            return NextResponse.json({ blocked: true });
        }
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

        const { id: targetUserId } = await params;
        const blockedData = await isBlocked(currentUser.id, targetUserId);

        return NextResponse.json({ blocked: !!blockedData });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
