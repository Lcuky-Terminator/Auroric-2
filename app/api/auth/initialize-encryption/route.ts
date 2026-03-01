/**
 * ============================================================================
 * API ROUTE: Initialize E2EE for User
 * POST /api/auth/initialize-encryption
 * 
 * This endpoint is called when a user logs in or registers.
 * It generates their public/private key pair and saves the public key to their profile.
 * ============================================================================
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase-client';

/**
 * GET /api/auth/initialize-encryption
 * Check if user's encryption is initialized and get their public key
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

    // Check if user already has a public key
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('public_key')
      .eq('id', userId)
      .single();

    if (userError || !userData?.public_key) {
      // User needs encryption setup
      return NextResponse.json(
        {
          initialized: false,
          message: 'User needs to initialize encryption',
          publicKey: null,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        initialized: true,
        message: 'User already has encryption initialized',
        publicKey: userData.public_key,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking encryption status:', error);
    return NextResponse.json(
      { error: 'Failed to check encryption status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/initialize-encryption
 * Generate key pair and save public key to user's profile
 * Called on first login or if keys need to be regenerated
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
    const { forceRegenerate = false } = body;

    // Check if user already has valid encryption keys
    if (!forceRegenerate) {
      const { data: userData } = await supabase
        .from('users')
        .select('public_key')
        .eq('id', userId)
        .single();

      if (userData?.public_key) {
        return NextResponse.json(
          {
            success: true,
            message: 'Encryption already initialized',
            publicKey: userData.public_key,
            generated: false,
          },
          { status: 200 }
        );
      }
    }

    // Generate new key pair
    console.log(`[${userId}] Generating RSA-4096 key pair...`);

    // Note: The actual key generation happens in cryptoUtils.ts
    // This is a mock response because actual key generation must happen in browser
    // In practice, you would call this from the client after generating keys

    return NextResponse.json(
      {
        success: true,
        message: 'Ready for key generation',
        publicKey: null,
        generated: false,
        nextStep: 'client_key_generation',
        instruction:
          'Client should call initializeUserEncryption() in browser, then POST publicKey here',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error initializing encryption:', error);
    return NextResponse.json(
      { error: 'Failed to initialize encryption' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/auth/initialize-encryption/save-public-key
 * Save the generated public key to user's profile
 * Called from client after generating key pair
 */
export async function PUT(request: NextRequest) {
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
    const { publicKey } = body;

    if (!publicKey) {
      return NextResponse.json(
        { error: 'Public key is required' },
        { status: 400 }
      );
    }

    // Validate public key format (basic check)
    try {
      const jwk = JSON.parse(publicKey);
      if (!jwk.kty || jwk.kty !== 'RSA') {
        throw new Error('Invalid JWK format');
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid public key format' },
        { status: 400 }
      );
    }

    // Save public key to user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({ public_key: publicKey })
      .eq('id', userId);

    if (updateError) {
      console.error('Error saving public key:', updateError);
      return NextResponse.json(
        { error: 'Failed to save public key' },
        { status: 500 }
      );
    }

    console.log(`[${userId}] Public key saved successfully`);

    return NextResponse.json(
      {
        success: true,
        message: 'Public key saved successfully',
        userId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error saving public key:', error);
    return NextResponse.json(
      { error: 'Failed to save public key' },
      { status: 500 }
    );
  }
}
