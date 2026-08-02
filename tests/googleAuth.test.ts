import { describe, expect, it } from 'vitest';
import {
  type GoogleAuthSessionLike,
  type GoogleAuthUserLike,
  canApplyPendingGoogleSignupProfile,
  createPendingGoogleAuthIntent,
  isGoogleOnlyAccount,
  parsePendingGoogleAuthIntent,
} from '../src/utils/googleAuth';

function createGoogleUser(overrides?: Partial<GoogleAuthUserLike>): GoogleAuthUserLike {
  return {
    id: 'user-1',
    email: 'clone@example.com',
    user_metadata: {},
    app_metadata: {},
    ...overrides,
  };
}

describe('parsePendingGoogleAuthIntent', () => {
  it('round-trips a valid signup intent', () => {
    const createdAt = Date.UTC(2026, 2, 11, 16, 0, 0);
    const intent = createPendingGoogleAuthIntent({
      mode: 'signup',
      displayName: 'Captain Rex',
      galaxyMapRequested: true,
      createdAt,
    });

    expect(
      parsePendingGoogleAuthIntent(JSON.stringify(intent), { now: createdAt + 60_000 }),
    ).toEqual(intent);
  });

  it('rejects expired intents', () => {
    const createdAt = Date.UTC(2026, 2, 11, 16, 0, 0);
    const intent = createPendingGoogleAuthIntent({
      mode: 'login',
      createdAt,
    });

    expect(
      parsePendingGoogleAuthIntent(JSON.stringify(intent), {
        now: createdAt + 16 * 60_000,
      }),
    ).toBeNull();
  });

  it('requires display name for signup intents', () => {
    const intent = {
      version: 1,
      mode: 'signup',
      displayName: '',
      galaxyMapRequested: false,
      createdAt: Date.UTC(2026, 2, 11, 16, 0, 0),
    };

    expect(
      parsePendingGoogleAuthIntent(JSON.stringify(intent), { now: intent.createdAt + 1_000 }),
    ).toBeNull();
  });
});

describe('isGoogleOnlyAccount', () => {
  it('returns true when google is the only linked provider', () => {
    const session: GoogleAuthSessionLike = {
      user: createGoogleUser({
        app_metadata: {
          provider: 'google',
          providers: ['google'],
        },
      }),
    };

    expect(isGoogleOnlyAccount(session)).toBe(true);
  });

  it('returns false when multiple providers are linked', () => {
    const session: GoogleAuthSessionLike = {
      user: createGoogleUser({
        app_metadata: {
          provider: 'google',
          providers: ['google', 'email'],
        },
      }),
    };

    expect(isGoogleOnlyAccount(session)).toBe(false);
  });
});

describe('canApplyPendingGoogleSignupProfile', () => {
  const intent = createPendingGoogleAuthIntent({
    mode: 'signup',
    displayName: 'Commander Cody',
    galaxyMapRequested: true,
    createdAt: Date.UTC(2026, 2, 11, 16, 0, 0),
  });

  it('allows replacing default email-prefix display names', () => {
    expect(
      canApplyPendingGoogleSignupProfile({
        intent,
        currentDisplayName: 'commander.cody',
        email: 'commander.cody@example.com',
        user: createGoogleUser({
          email: 'commander.cody@example.com',
        }),
      }),
    ).toBe(true);
  });

  it('allows replacing provider-seeded names', () => {
    expect(
      canApplyPendingGoogleSignupProfile({
        intent,
        currentDisplayName: 'Commander Google',
        email: 'clone@example.com',
        user: createGoogleUser({
          user_metadata: {
            full_name: 'Commander Google',
          },
        }),
      }),
    ).toBe(true);
  });

  it('refuses to overwrite an unrelated existing display name', () => {
    expect(
      canApplyPendingGoogleSignupProfile({
        intent,
        currentDisplayName: 'Existing Custom Name',
        email: 'clone@example.com',
        user: createGoogleUser({
          user_metadata: {
            full_name: 'Commander Google',
          },
        }),
      }),
    ).toBe(false);
  });
});
