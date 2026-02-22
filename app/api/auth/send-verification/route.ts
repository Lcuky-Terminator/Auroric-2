import { NextResponse } from 'next/server';
import { getCurrentUser, createToken } from '@/lib/auth';
import { getUserFull } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/resend';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * POST /api/auth/send-verification
 *
 * Generates a verification token and sends a verification email
 * via Resend to the currently logged-in user.
 */
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const full = await getUserFull(user.id);
        if (!full) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (full.emailVerified) {
            return NextResponse.json({ message: 'Already verified', alreadyVerified: true });
        }

        // Generate a verification token (expires in 24 hours)
        const verificationToken = jwt.sign(
            { userId: user.id, email: full.email, purpose: 'email-verification' },
            JWT_SECRET,
            { expiresIn: '24h' },
        );

        // Build the verification URL
        const origin = request.headers.get('origin')
            || request.headers.get('x-forwarded-host')
            ? `https://${request.headers.get('x-forwarded-host')}`
            : 'http://localhost:3002';

        const verifyUrl = `${origin}/verify?token=${verificationToken}`;

        // Send the email via Resend
        await sendVerificationEmail(full.email, full.displayName, verifyUrl);

        return NextResponse.json({ sent: true, message: 'Verification email sent!' });
    } catch (err: any) {
        console.error('[send-verification] Error:', err?.message || err);
        return NextResponse.json(
            { error: err?.message || 'Failed to send verification email' },
            { status: 500 },
        );
    }
}
