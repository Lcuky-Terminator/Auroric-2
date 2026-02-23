import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
    getConversationsByUser,
    getConversationByParticipants,
    createConversation,
    createMessage,
    getUserFull,
    getUserChatStorageBytes,
    getChatStorageLimit,
    enforceStorageQuota,
} from '@/lib/db';

/**
 * GET /api/messages — List all conversations for the current user
 */
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const conversations = await getConversationsByUser(user.id);
        return NextResponse.json(conversations);
    } catch (error: any) {
        console.error('[messages GET] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/messages — Send a message
 * Body: { recipientId: string, text: string }
 * Creates conversation if one doesn't exist between the two users.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { recipientId, text } = await req.json();

        if (!recipientId || !text?.trim()) {
            return NextResponse.json(
                { error: 'recipientId and text are required' },
                { status: 400 }
            );
        }

        if (recipientId === user.id) {
            return NextResponse.json(
                { error: 'Cannot message yourself' },
                { status: 400 }
            );
        }

        // Check recipient exists
        const recipient = await getUserFull(recipientId);
        if (!recipient) {
            return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
        }

        // Check if recipient allows messages
        if (!recipient.settings.allowMessages) {
            return NextResponse.json(
                { error: 'This user has disabled direct messages' },
                { status: 403 }
            );
        }

        // Get current user's full profile for storage limit check
        const fullUser = await getUserFull(user.id);
        if (!fullUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Enforce storage quota before sending (FIFO auto-deletion)
        const storageLimit = getChatStorageLimit(fullUser);
        await enforceStorageQuota(user.id, storageLimit);

        // Find or create conversation
        let conversation = await getConversationByParticipants(user.id, recipientId);
        if (!conversation) {
            conversation = await createConversation([user.id, recipientId]);
        }

        // Create message
        const message = await createMessage(conversation.id, user.id, text.trim());

        return NextResponse.json({ message, conversationId: conversation.id });
    } catch (error: any) {
        console.error('[messages POST] Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
