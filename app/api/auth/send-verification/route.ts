import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserFull } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/resend';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'auroric-super-secret-jwt-key-2024-change-in-production'
);

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

        // Generate a verification token (expires in 24 hours) using jose
        const verificationToken = await new SignJWT({
            userId: user.id,
            email: full.email,
            purpose: 'email-verification',
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(JWT_SECRET);

        // Build the verification URL
        const forwardedHost = request.headers.get('x-forwarded-host');
        const origin = request.headers.get('origin')
            || (forwardedHost ? `https://${forwardedHost}` : 'http://localhost:3002');

        const verifyUrl = `${origin}/verify?token=${verificationToken}`;

        // ── Dev mode: skip Resend, log the link to terminal ──
        if (process.env.NODE_ENV === 'development') {
            console.log('\n' + '='.repeat(60));
            console.log('📧 DEV MODE — VERIFICATION EMAIL BYPASSED');
            console.log(`   User: ${full.displayName} (${full.email})`);
            console.log(`   TEST VERIFICATION LINK:`);
            console.log(`   ${verifyUrl}`);
            console.log('='.repeat(60) + '\n');
            return NextResponse.json({ sent: true, message: 'Verification link logged to console (dev mode)' });
        }

        // ── Production: send the email via Resend ──
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
