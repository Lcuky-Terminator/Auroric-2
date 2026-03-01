import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { users } from '@/lib/appwrite';
import { Query } from 'node-appwrite';

/**
 * POST /api/auth/resend-verification
 *
 * Server-side endpoint to resend Appwrite verification email.
 * Uses the Appwrite **server SDK** (admin key) so it works even when
 * the browser has no Appwrite client session (e.g. different device).
 *
 * Flow:
 *  1. Identify current user from JWT cookie (our auth system)
 *  2. Look up the corresponding Appwrite Auth user by email
 *  3. Use server SDK to send a verification email
 */
export async function POST(request: Request) {
    try {
        // Get current user from JWT cookie
        const user = await getCurrentUser();
        if (!user || !user.email) {
            return NextResponse.json(
                { error: 'Not authenticated. Please log in first.' },
                { status: 401 },
            );
        }

        // Parse optional verifyUrl from body (fallback to Referer or default)
        let verifyUrl = '';
        try {
            const body = await request.json();
            verifyUrl = body.verifyUrl || '';
        } catch {
            // Body may be empty
        }

        if (!verifyUrl) {
            const referer = request.headers.get('referer') || request.headers.get('origin') || '';
            const origin = referer ? new URL(referer).origin : 'https://v0-auroric.vercel.app';
            verifyUrl = `${origin}/verify`;
        }

        // Find the Appwrite Auth user by email
        let appwriteUserId: string | null = null;
        try {
            const result = await users.list([Query.equal('email', user.email)]);
            if (result.users.length > 0) {
                appwriteUserId = result.users[0].$id;
            }
        } catch (searchErr: any) {
            console.error('[ResendVerification] User search failed:', searchErr?.message);
        }

        if (!appwriteUserId) {
            return NextResponse.json(
                { error: 'Could not find your auth account. Please contact support.' },
                { status: 404 },
            );
        }

        // Send verification email using server SDK
        await users.createVerification(appwriteUserId, verifyUrl);

        return NextResponse.json({ sent: true, message: 'Verification email sent!' });
    } catch (err: any) {
        console.error('[ResendVerification] Error:', err?.message, err?.code);

        if (err?.code === 409) {
            return NextResponse.json(
                { sent: false, message: 'Email is already verified!' },
                { status: 409 },
            );
        }

        return NextResponse.json(
            { error: err?.message || 'Failed to send verification email' },
            { status: 500 },
        );
    }
}
