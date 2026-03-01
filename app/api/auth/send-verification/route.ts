import { NextResponse } from 'next/server';

/**
 * POST /api/auth/send-verification
 *
 * DEPRECATED: Verification emails are now sent via Appwrite's built-in
 * email system using `account.createVerification()` on the client side.
 *
 * This route is kept as a stub for backward compatibility.
 * The actual verification flow now happens in:
 *   - Client: app-context.tsx → account.createVerification(url)
 *   - Client: verify-email/page.tsx → account.createVerification(url)
 *   - Callback: verify/page.tsx → account.updateVerification(userId, secret)
 */
export async function POST() {
    return NextResponse.json({
        sent: false,
        message: 'Verification emails are now handled by Appwrite. Use the Resend button on the verify-email page.',
    });
}
