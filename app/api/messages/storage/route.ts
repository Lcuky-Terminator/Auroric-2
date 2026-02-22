import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserFull, getUserChatStorageBytes, getChatStorageLimit } from '@/lib/db';

/**
 * GET /api/messages/storage — Get current user's chat storage usage
 * Returns { usedBytes, limitBytes, percentage }
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const fullUser = await getUserFull(user.id);
        if (!fullUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const usedBytes = await getUserChatStorageBytes(user.id);
        const limitBytes = getChatStorageLimit(fullUser);
        const percentage = limitBytes > 0 ? Math.round((usedBytes / limitBytes) * 100) : 0;

        return NextResponse.json({
            usedBytes,
            limitBytes,
            percentage: Math.min(percentage, 100),
            isVerified: fullUser.isVerified,
        });
    } catch (error: any) {
        console.error('[messages/storage GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
