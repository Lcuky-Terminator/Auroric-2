import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createDeletionRequest, getDeletionRequest, updateUser } from '@/lib/db';

/**
 * POST /api/account/delete — Request account deletion
 * Body: { reason?: string }
 *
 * Instead of hard-deleting, creates a ticket for Customer Care
 * and sets accountStatus to 'pending_deletion'.
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if there's already a pending request
        const existing = await getDeletionRequest(user.id);
        if (existing) {
            return NextResponse.json(
                {
                    error: 'You already have a pending deletion request',
                    requestId: existing.id,
                    createdAt: existing.createdAt,
                },
                { status: 409 }
            );
        }

        const { reason } = await req.json();

        // Create the deletion request ticket
        const request = await createDeletionRequest(
            user.id,
            reason || 'No reason provided'
        );

        // Mark user as pending deletion
        await updateUser(user.id, {
            accountStatus: 'pending_deletion',
        });

        return NextResponse.json({
            ok: true,
            message: 'Your account deletion request has been submitted. Our Customer Care team will process it within 3-5 business days. You will receive an email confirmation.',
            requestId: request.id,
        });
    } catch (error: any) {
        console.error('[account/delete POST] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
