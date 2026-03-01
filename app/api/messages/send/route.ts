/**
 * ============================================================================
 * API ROUTE: Send Encrypted Message
 * POST /api/messages/send
 * 
 * This endpoint validates and inserts an encrypted message.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase-client';

/**
 * Validate ciphertext format (basic validation)
 */
function validateCiphertext(ciphertext: string): boolean {
  // Should be base64
  if (!ciphertext || typeof ciphertext !== 'string') return false;
  try {
    atob(ciphertext);
    return true;
  } catch {
    return false;
  }
}

/**
 * POST /api/messages/send
 * Send an encrypted message
 *
 * Request body:
 * {
 *   recipientId: string (UUID),
 *   ciphertext: string (base64),
 *   iv: string (base64),
 *   algorithm: "RSA-OAEP" | "AES-GCM"
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
    const { recipientId, ciphertext, iv, algorithm } = body;

    // Validation
    if (!recipientId || !ciphertext || !iv || !algorithm) {
      return NextResponse.json(
        { error: 'Missing required fields: recipientId, ciphertext, iv, algorithm' },
        { status: 400 }
      );
    }

    if (userId === recipientId) {
      return NextResponse.json(
        { error: 'Cannot send message to yourself' },
        { status: 400 }
      );
    }

    if (!validateCiphertext(ciphertext)) {
      return NextResponse.json(
        { error: 'Invalid ciphertext format' },
        { status: 400 }
      );
    }

    if (!validateCiphertext(iv)) {
      return NextResponse.json(
        { error: 'Invalid IV format' },
        { status: 400 }
      );
    }

    if (!['RSA-OAEP', 'AES-GCM'].includes(algorithm)) {
      return NextResponse.json(
        { error: 'Invalid algorithm' },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Check blocking status (double-check, RLS will also enforce)
    const { data: blockedByRecipient } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', recipientId)
      .eq('blocked_id', userId)
      .single();

    if (blockedByRecipient) {
      return NextResponse.json(
        { error: 'Cannot send message: This user has blocked you' },
        { status: 403 }
      );
    }

    const { data: blockedRecipient } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', userId)
      .eq('blocked_id', recipientId)
      .single();

    if (blockedRecipient) {
      return NextResponse.json(
        { error: 'Cannot send message: You have blocked this user' },
        { status: 403 }
      );
    }

    // Insert encrypted message
    // RLS policies will also check blocking status
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        sender_id: userId,
        recipient_id: recipientId,
        ciphertext,
        iv,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting message:', insertError);

      // Check if it's an RLS error
      if (insertError.message.includes('blocked') || insertError.message.includes('RLS')) {
        return NextResponse.json(
          { error: 'Cannot send message: Recipient has blocked you' },
          { status: 403 }
        );
      }

      throw insertError;
    }

    console.log(`[${userId}] Message sent to ${recipientId}:`, message.id);

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent',
        messageId: message.id,
        createdAt: message.created_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/messages/send
 * Fetch encrypted messages in conversation
 *
 * Query params:
 * - recipientId: string (UUID)
 * - limit: number (default: 50, max: 100)
 * - offset: number (default: 0)
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
    const recipientId = searchParams.get('recipientId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!recipientId) {
      return NextResponse.json(
        { error: 'recipientId is required' },
        { status: 400 }
      );
    }

    // Check if recipient exists
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('id', recipientId)
      .single();

    if (recipientError || !recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Check if blocked
    const { data: blockedByRecipient } = await supabase
      .from('blocked_users')
      .select('id')
      .eq('blocker_id', recipientId)
      .eq('blocked_id', userId)
      .single();

    if (blockedByRecipient) {
      return NextResponse.json(
        { error: 'Cannot view messages: This user has blocked you' },
        { status: 403 }
      );
    }

    // Fetch messages (encrypted)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${userId},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${userId})`
      )
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (messagesError) {
      throw messagesError;
    }

    return NextResponse.json(
      {
        success: true,
        messages: messages || [],
        count: messages?.length || 0,
        limit,
        offset,
        hasMore: (messages?.length || 0) >= limit,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
