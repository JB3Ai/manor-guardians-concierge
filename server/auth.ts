import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { Request } from 'express';
import { HttpError } from './http';
import { getSupabaseAdmin } from './supabase';

export interface AdminIdentity {
  accessToken: string;
  userId: string;
}

export function createPortalToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashPortalToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function requireTeamAdmin(request: Request): Promise<AdminIdentity> {
  const authorization = request.get('authorization') || '';
  const match = /^Bearer\s+([^\s]+)$/i.exec(authorization);
  if (!match) {
    throw new HttpError(401, 'Sign in with a team administrator account to continue.');
  }

  const accessToken = match[1];
  const { data, error } = await getSupabaseAdmin().auth.getUser(accessToken);
  if (error || !data.user) {
    throw new HttpError(401, 'Your team session is invalid or expired. Please sign in again.');
  }
  if (data.user.app_metadata?.role !== 'team_admin') {
    throw new HttpError(403, 'This action is restricted to team administrators.');
  }

  return { accessToken, userId: data.user.id };
}

export async function authorizeStayAccess(
  request: Request,
  storedTokenHash: string | null,
  allowPortalToken: boolean
): Promise<AdminIdentity | null> {
  if (request.get('authorization')) {
    return requireTeamAdmin(request);
  }
  if (!allowPortalToken) {
    throw new HttpError(401, 'Sign in with a team administrator account to continue.');
  }

  const token = request.get('x-portal-token') || '';
  if (!storedTokenHash || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new HttpError(401, 'A valid client portal access token is required.');
  }

  const suppliedHash = Buffer.from(hashPortalToken(token), 'hex');
  const expectedHash = Buffer.from(storedTokenHash, 'hex');
  if (
    expectedHash.length !== suppliedHash.length ||
    !timingSafeEqual(expectedHash, suppliedHash)
  ) {
    throw new HttpError(401, 'The client portal link is invalid or expired.');
  }
  return null;
}
