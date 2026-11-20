import { createClient, Session, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonymousKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  client = url && anonymousKey
    ? createClient(url, anonymousKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : null;
  return client;
}

export async function signInTeamAdmin(
  email: string,
  password: string
): Promise<Session> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Supabase browser authentication is not configured.');
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) {
    throw new Error(error?.message || 'Supabase did not return an authenticated session.');
  }
  if (data.user.app_metadata?.role !== 'team_admin') {
    await supabase.auth.signOut();
    throw new Error('This Supabase account is not authorized as a team administrator.');
  }
  return data.session;
}

export async function getTeamAdminSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  if (data.session?.user.app_metadata?.role !== 'team_admin') {
    if (data.session) await supabase.auth.signOut();
    return null;
  }
  return data.session;
}

export async function signOutTeamAdmin(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}
