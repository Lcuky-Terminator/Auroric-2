import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getConversation, getMessages } from '@/lib/db';

/**
 * GET /api/messages/[id] — Get messages for a conversation
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Verify user is a participant
        const conversation = await getConversation(id);
        if (!conversation) {
            return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
        }

        if (!conversation.participantIds.includes(user.id)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const messages = await getMessages(id);
        return NextResponse.json(messages);
    } catch (error: any) {
        console.error('[messages/[id] GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
