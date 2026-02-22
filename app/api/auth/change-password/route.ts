import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { getUserFull, updateUser } from '@/lib/db';
import { PASSWORD_CHANGE_MAX_ATTEMPTS, PASSWORD_CHANGE_LOCKOUT_DAYS } from '@/lib/types';

export async function POST(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { currentPassword, newPassword } = await req.json();

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Both currentPassword and newPassword are required' },
                { status: 400 }
            );
        }

        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'New password must be at least 8 characters' },
                { status: 400 }
            );
        }

        // Get full user with passwordHash
        const fullUser = await getUserFull(currentUser.id);
        if (!fullUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // ── Check lockout ──
        if (fullUser.passwordChangeLockUntil) {
            const lockUntil = new Date(fullUser.passwordChangeLockUntil);
            const now = new Date();
            if (now < lockUntil) {
                const remainingMs = lockUntil.getTime() - now.getTime();
                const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
                const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

                return NextResponse.json(
                    {
                        error: 'Password change is temporarily locked',
                        lockedUntil: fullUser.passwordChangeLockUntil,
                        remainingHours,
                        remainingDays,
                        message: `You've changed your password too many times. Try again in ${remainingDays > 1 ? `${remainingDays} days` : `${remainingHours} hours`}.`,
                    },
                    { status: 423 }
                );
            }

            // Lockout expired — reset counter
            await updateUser(currentUser.id, {
                passwordChangeCount: 0,
                passwordChangeLockUntil: undefined,
            });
            fullUser.passwordChangeCount = 0;
        }

        // ── Verify current password ──
        const isValid = verifyPassword(currentPassword, fullUser.passwordHash);
        if (!isValid) {
            return NextResponse.json(
                { error: 'Current password is incorrect' },
                { status: 403 }
            );
        }

        // ── Check rate limit ──
        const currentCount = fullUser.passwordChangeCount ?? 0;
        if (currentCount >= PASSWORD_CHANGE_MAX_ATTEMPTS) {
            // Lock for 3 days
            const lockUntil = new Date();
            lockUntil.setDate(lockUntil.getDate() + PASSWORD_CHANGE_LOCKOUT_DAYS);

            await updateUser(currentUser.id, {
                passwordChangeLockUntil: lockUntil.toISOString(),
                passwordChangeCount: 0,
            });

            return NextResponse.json(
                {
                    error: 'Too many password changes',
                    lockedUntil: lockUntil.toISOString(),
                    message: `You've reached the maximum of ${PASSWORD_CHANGE_MAX_ATTEMPTS} password changes. This feature is locked for ${PASSWORD_CHANGE_LOCKOUT_DAYS} days.`,
                },
                { status: 429 }
            );
        }

        // ── Update password ──
        const newHash = hashPassword(newPassword);
        await updateUser(currentUser.id, {
            passwordHash: newHash,
            passwordChangeCount: currentCount + 1,
        });

        return NextResponse.json({
            ok: true,
            message: 'Password changed successfully',
            attemptsRemaining: PASSWORD_CHANGE_MAX_ATTEMPTS - (currentCount + 1),
        });
    } catch (error: any) {
        console.error('[change-password] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
