/**
 * Supabase client for E2EE messaging.
 * 
 * Separated from appwrite-client.ts since Supabase is ONLY used
 * for encrypted messaging, not for authentication.
 */

import { createClient } from '@supabase/supabase-js';

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
            channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => { } }) }) }),
            removeChannel: () => { },
        } as any);
