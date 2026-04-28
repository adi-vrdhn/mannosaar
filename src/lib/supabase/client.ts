import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

declare global {
  // Reuse the same browser client across components to avoid duplicate auth stores.
  // eslint-disable-next-line no-var
  var __supabaseBrowserClient: SupabaseClient | undefined;
}

export const createClient = () => {
  if (!globalThis.__supabaseBrowserClient) {
    globalThis.__supabaseBrowserClient = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }

  return globalThis.__supabaseBrowserClient;
};
