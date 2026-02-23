/**
 * ============================================================================
 * API ROUTE: User Blocking
 * POST /api/blocking/block
 * DELETE /api/blocking/unblock
 * GET /api/blocking/status
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/appwrite-client';
import type { BlockingStatus } from '@/types/e2ee-types';

/**
 * GET /api/blocking/status?userId=<uuid>
 * Check blocking status between current user and another user
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (userId === targetUserId) {
      return NextResponse.json(
        { error: 'Cannot check blocking status with yourself' },
        { status: 400 }
      );
    }

    // Check if current user is blocked by target user
    const { data: isBlockedData } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', targetUserId)
      .eq('blocked_id', userId)
      .single();

    // Check if current user has blocked target user
    const { data: hasBlockedData } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', userId)
      .eq('blocked_id', targetUserId)
      .single();

    const status: BlockingStatus = {
      isBlockedByUser: !!isBlockedData,
      hasBlockedUser: !!hasBlockedData,
    };

    return NextResponse.json(status, { status: 200 });
  } catch (error) {
    console.error('Error checking blocking status:', error);
    return NextResponse.json(
      { error: 'Failed to check blocking status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/blocking/block
 * Block a user
 *
 * Request body:
 * {
 *   blockUserId: string (UUID of user to block)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const body = await request.json();
    const { blockUserId } = body;

    if (!blockUserId) {
      return NextResponse.json(
        { error: 'blockUserId is required' },
        { status: 400 }
      );
    }

    if (userId === blockUserId) {
      return NextResponse.json(
        { error: 'Cannot block yourself' },
        { status: 400 }
      );
    }

    // Verify target user exists
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id')
      .eq('id', blockUserId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already blocked
    const { data: existingBlock } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', userId)
      .eq('blocked_id', blockUserId)
      .single();

    if (existingBlock) {
      return NextResponse.json(
        { error: 'User already blocked' },
        { status: 400 }
      );
    }

    // Insert block
    const { data: block, error: insertError } = await supabase
      .from('blocked_users')
      .insert({
        blocker_id: userId,
        blocked_id: blockUserId,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error blocking user:', insertError);
      throw insertError;
    }

    console.log(`[${userId}] Blocked user ${blockUserId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'User blocked',
        blockId: block.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { error: 'Failed to block user' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/blocking/unblock?userId=<uuid>
 * Unblock a user
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = user.id;
    const { searchParams } = new URL(request.url);
    const unblockUserId = searchParams.get('userId');

    if (!unblockUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (userId === unblockUserId) {
      return NextResponse.json(
        { error: 'Cannot unblock yourself' },
        { status: 400 }
      );
    }

    // Delete block relationship
    const { error: deleteError } = await supabase
      .from('blocked_users')
      .delete()
      .eq('blocker_id', userId)
      .eq('blocked_id', unblockUserId);

    if (deleteError) {
      console.error('Error unblocking user:', deleteError);
      throw deleteError;
    }

    console.log(`[${userId}] Unblocked user ${unblockUserId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'User unblocked',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}
