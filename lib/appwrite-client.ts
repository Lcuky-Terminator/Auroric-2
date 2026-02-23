/**
 * Client-side Appwrite SDK configuration.
 *
 * This file initialises the **browser** SDK (`appwrite` package) which is used
 * for operations that require a user session on the client, such as email
 * verification via `account.createVerification()`.
 *
 * The *server* SDK (`node-appwrite`) lives in `./appwrite.ts` and is used in
 * API routes / server components only.
 */

import { Client, Account } from 'appwrite';
import { createClient } from '@supabase/supabase-js';

const client = new Client()
  .setEndpoint(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
      'https://nyc.cloud.appwrite.io/v1',
  )
  .setProject(
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '',
  );

/** Browser-side Appwrite Account service */
export const account = new Account(client);

/** Supabase client for E2EE messaging - only initialize if credentials are available */
export const supabase = 
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
    : // Placeholder for build time - will be replaced at runtime
      ({
        from: () => ({
          select: () => ({ eq: () => Promise.reject(new Error('Supabase not configured')) }),
          insert: () => Promise.reject(new Error('Supabase not configured')),
          update: () => ({ eq: () => Promise.reject(new Error('Supabase not configured')) }),
          delete: () => Promise.reject(new Error('Supabase not configured')),
        }),
        channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) }),
        removeChannel: () => {},
      } as any);

export default client;
