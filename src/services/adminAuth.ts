import { apiRequest } from './httpApi';

export interface TeamAdminSession {
  access_token: string;
  expires_at: number;
}

const SESSION_STORAGE_KEY = 'manor-guardians:team-admin-session';

export async function signInTeamAdmin(password: string): Promise<TeamAdminSession> {
  const session = await apiRequest<TeamAdminSession>('/api/admin/login', {
    body: JSON.stringify({ password }),
  });
  window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getTeamAdminSession(): TeamAdminSession | null {
  const stored = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!stored) return null;
  try {
    const session = JSON.parse(stored) as TeamAdminSession;
    if (
      typeof session.access_token !== 'string' ||
      typeof session.expires_at !== 'number' ||
      session.expires_at <= Date.now() / 1000
    ) {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export function signOutTeamAdmin(): void {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
