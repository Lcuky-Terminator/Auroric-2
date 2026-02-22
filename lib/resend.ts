/**
 * Resend email utility for Auroric.
 *
 * Sends verification emails using the Resend API.
 * Requires RESEND_API_KEY environment variable.
 */

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Auroric <onboarding@resend.dev>';

/**
 * Send a verification email with a clickable link.
 */
export async function sendVerificationEmail(
    to: string,
    displayName: string,
    verifyUrl: string,
) {
    const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: 'Verify your Auroric email',
        html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #f97316, #ea580c); border-radius: 12px; line-height: 48px; font-size: 24px; font-weight: bold; color: white;">A</div>
        </div>
        <h1 style="text-align: center; font-size: 24px; color: #f5f5f5; margin-bottom: 8px;">Verify your email</h1>
        <p style="text-align: center; color: #a3a3a3; font-size: 16px; margin-bottom: 32px;">
          Hi <strong style="color: #f5f5f5;">${displayName}</strong>, click the button below to verify your email and unlock all Auroric features.
        </p>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f97316, #ea580c); color: white; font-weight: 600; font-size: 16px; text-decoration: none; border-radius: 12px;">
            Verify Email
          </a>
        </div>
        <p style="text-align: center; color: #737373; font-size: 13px;">
          This link expires in 24 hours. If you didn't create an Auroric account, ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #333; margin: 32px 0;" />
        <p style="text-align: center; color: #525252; font-size: 12px;">
          © Auroric — Share what inspires you
        </p>
      </div>
    `,
    });

    if (error) {
        console.error('[Resend] Failed to send verification email:', error);
        throw new Error(error.message || 'Failed to send verification email');
    }

    return data;
}
