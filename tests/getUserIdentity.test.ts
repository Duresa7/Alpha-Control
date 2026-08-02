import { describe, expect, it } from 'vitest';
import type { Session } from '@supabase/supabase-js';

import type { UserProfile } from '@/types';
import { getUserIdentity } from '@/utils/getUserIdentity';

function createSession(email?: string, displayName?: string): Session {
  return {
    access_token: 'token',
    refresh_token: 'refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: 9999999999,
    user: {
      id: 'user-1',
      app_metadata: {},
      user_metadata: displayName ? { display_name: displayName } : {},
      aud: 'authenticated',
      created_at: '2026-03-11T00:00:00.000Z',
      email,
    },
  } as Session;
}

function createProfile(displayName: string): UserProfile {
  return {
    id: 'user-1',
    email: 'clone@example.com',
    display_name: displayName,
    role: 'user',
    galaxy_map_requested: false,
    created_at: '2026-03-11T00:00:00.000Z',
    updated_at: '2026-03-11T00:00:00.000Z',
  };
}

describe('getUserIdentity', () => {
  it('prefers the saved profile display name', () => {
    expect(
      getUserIdentity(
        createSession('clone@example.com', 'Metadata Name'),
        createProfile('Captain Rex'),
      ),
    ).toEqual({
      displayName: 'Captain Rex',
      email: 'clone@example.com',
    });
  });

  it('falls back to auth metadata when no profile exists', () => {
    expect(getUserIdentity(createSession('clone@example.com', 'Commander Cody'), null)).toEqual({
      displayName: 'Commander Cody',
      email: 'clone@example.com',
    });
  });

  it('falls back to the email prefix before the provided default', () => {
    expect(getUserIdentity(createSession('clone@example.com'), null)).toEqual({
      displayName: 'clone',
      email: 'clone@example.com',
    });
  });

  it('uses the provided default when no identity data exists', () => {
    expect(getUserIdentity(null, null, 'Signed In')).toEqual({
      displayName: 'Signed In',
      email: null,
    });
  });
});
