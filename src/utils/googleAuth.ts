import type { SupabaseClient } from '@supabase/supabase-js';
import { withTimeout } from '@/utils/withTimeout';

const PENDING_GOOGLE_AUTH_STORAGE_KEY = 'auth.pending-google';
const PENDING_GOOGLE_AUTH_VERSION = 1;
const PENDING_GOOGLE_AUTH_MAX_AGE_MS = 15 * 60_000;

export type GoogleAuthMode = 'login' | 'signup';
export type GoogleProfileFetchMode = 'initial' | 'background';

export interface GoogleUserMetadata extends Record<string, unknown> {
  display_name?: string;
  full_name?: string;
  name?: string;
  galaxy_map_requested?: boolean;
}

export interface GoogleUserAppMetadata extends Record<string, unknown> {
  provider?: string;
  providers?: string[];
}

export interface GoogleAuthUserLike {
  id: string;
  email?: string | null;
  user_metadata?: GoogleUserMetadata;
  app_metadata?: GoogleUserAppMetadata;
}

export interface GoogleAuthSessionLike {
  user?: GoogleAuthUserLike | null;
}

export interface PendingGoogleAuthIntent {
  version: typeof PENDING_GOOGLE_AUTH_VERSION;
  mode: GoogleAuthMode;
  displayName: string | null;
  galaxyMapRequested: boolean;
  createdAt: number;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function normalizeString(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? '';
}

function getGoogleAuthStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.sessionStorage;
}

function getEmailLocalPart(email: string | null | undefined): string {
  if (!email) return '';
  const [localPart = ''] = email.split('@');
  return localPart.trim();
}

export function createPendingGoogleAuthIntent({
  mode,
  displayName,
  galaxyMapRequested,
  createdAt = Date.now(),
}: {
  mode: GoogleAuthMode;
  displayName?: string | null;
  galaxyMapRequested?: boolean;
  createdAt?: number;
}): PendingGoogleAuthIntent {
  return {
    version: PENDING_GOOGLE_AUTH_VERSION,
    mode,
    displayName: displayName?.trim() || null,
    galaxyMapRequested: Boolean(galaxyMapRequested),
    createdAt,
  };
}

export function parsePendingGoogleAuthIntent(
  raw: string | null,
  {
    now = Date.now(),
    maxAgeMs = PENDING_GOOGLE_AUTH_MAX_AGE_MS,
  }: { now?: number; maxAgeMs?: number } = {},
): PendingGoogleAuthIntent | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingGoogleAuthIntent>;

    if (parsed.version !== PENDING_GOOGLE_AUTH_VERSION) return null;
    if (parsed.mode !== 'login' && parsed.mode !== 'signup') return null;
    if (typeof parsed.createdAt !== 'number' || !Number.isFinite(parsed.createdAt)) return null;
    if (now - parsed.createdAt > maxAgeMs) return null;

    const displayName = typeof parsed.displayName === 'string' ? parsed.displayName.trim() : '';
    if (parsed.mode === 'signup' && !displayName) return null;

    return {
      version: PENDING_GOOGLE_AUTH_VERSION,
      mode: parsed.mode,
      displayName: displayName || null,
      galaxyMapRequested: Boolean(parsed.galaxyMapRequested),
      createdAt: parsed.createdAt,
    };
  } catch {
    return null;
  }
}

export function readPendingGoogleAuthIntent(
  storage?: StorageLike,
  options?: { now?: number; maxAgeMs?: number },
): PendingGoogleAuthIntent | null {
  const authStorage = getGoogleAuthStorage(storage);
  if (!authStorage) return null;
  const raw = authStorage.getItem(PENDING_GOOGLE_AUTH_STORAGE_KEY);
  const parsed = parsePendingGoogleAuthIntent(raw, options);
  if (!parsed && raw) {
    authStorage.removeItem(PENDING_GOOGLE_AUTH_STORAGE_KEY);
  }
  return parsed;
}

export function writePendingGoogleAuthIntent(
  intent: PendingGoogleAuthIntent,
  storage?: StorageLike,
) {
  const authStorage = getGoogleAuthStorage(storage);
  if (!authStorage) return;
  authStorage.setItem(PENDING_GOOGLE_AUTH_STORAGE_KEY, JSON.stringify(intent));
}

export function clearPendingGoogleAuthIntent(storage?: StorageLike) {
  const authStorage = getGoogleAuthStorage(storage);
  if (!authStorage) return;
  authStorage.removeItem(PENDING_GOOGLE_AUTH_STORAGE_KEY);
}

function getAuthProviders(session: GoogleAuthSessionLike | null): string[] {
  const providers = session?.user?.app_metadata?.providers;
  const provider = session?.user?.app_metadata?.provider;
  const normalized = new Set<string>();

  if (Array.isArray(providers)) {
    providers.forEach((value) => {
      if (typeof value === 'string' && value.trim()) {
        normalized.add(value.trim().toLowerCase());
      }
    });
  }

  if (typeof provider === 'string' && provider.trim()) {
    normalized.add(provider.trim().toLowerCase());
  }

  return [...normalized];
}

export function isGoogleOnlyAccount(session: GoogleAuthSessionLike | null): boolean {
  const providers = getAuthProviders(session);
  return providers.length > 0 && providers.every((provider) => provider === 'google');
}

function getUserMetadataNameCandidates(user: GoogleAuthUserLike | null | undefined): string[] {
  if (!user) return [];

  const candidates = [
    user.user_metadata?.display_name,
    user.user_metadata?.full_name,
    user.user_metadata?.name,
  ];

  return candidates
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .map((value) => value.trim());
}

export function canApplyPendingGoogleSignupProfile({
  intent,
  currentDisplayName,
  email,
  user,
}: {
  intent: PendingGoogleAuthIntent | null;
  currentDisplayName: string | null | undefined;
  email: string | null | undefined;
  user: GoogleAuthUserLike | null | undefined;
}): boolean {
  if (!intent || intent.mode !== 'signup' || !intent.displayName) {
    return false;
  }

  const normalizedCurrent = normalizeString(currentDisplayName);
  if (!normalizedCurrent) {
    return true;
  }

  const normalizedDesired = normalizeString(intent.displayName);
  if (normalizedCurrent === normalizedDesired) {
    return true;
  }

  const defaults = new Set<string>();
  const emailLocalPart = normalizeString(getEmailLocalPart(email));
  if (emailLocalPart) {
    defaults.add(emailLocalPart);
  }

  getUserMetadataNameCandidates(user).forEach((candidate) => {
    defaults.add(normalizeString(candidate));
  });

  return defaults.has(normalizedCurrent);
}

interface GoogleProfileRecord {
  display_name: string | null;
  galaxy_map_requested: boolean;
}

export async function finalizePendingGoogleSignup({
  session,
  supabase,
  resolvedProfileUserId,
  fetchProfile,
  authOperationTimeoutMs,
  logger,
}: {
  session: GoogleAuthSessionLike | null;
  supabase: SupabaseClient;
  resolvedProfileUserId: string | null;
  fetchProfile: (userId: string, mode: GoogleProfileFetchMode) => Promise<void> | void;
  authOperationTimeoutMs: number;
  logger: { error: (...args: unknown[]) => void };
}): Promise<void> {
  const user = session?.user;
  if (!user) return;

  const intent = readPendingGoogleAuthIntent();
  if (!intent) return;

  if (!getAuthProviders(session).includes('google')) return;

  if (intent.mode === 'login') {
    clearPendingGoogleAuthIntent();
    return;
  }

  try {
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('display_name, galaxy_map_requested')
      .eq('id', user.id)
      .maybeSingle();

    const currentProfile = (data as GoogleProfileRecord | null) ?? null;

    if (profileError) {
      logger.error('Failed to read profile after Google sign-in:', profileError);
      return;
    }

    if (
      !canApplyPendingGoogleSignupProfile({
        intent,
        currentDisplayName: currentProfile?.display_name,
        email: user.email,
        user,
      })
    ) {
      clearPendingGoogleAuthIntent();
      return;
    }

    const desiredDisplayName = intent.displayName!.trim();
    const currentMetadataName =
      typeof user.user_metadata?.display_name === 'string'
        ? user.user_metadata.display_name.trim()
        : '';
    const currentMetadataGalaxyRequest = Boolean(user.user_metadata?.galaxy_map_requested);

    if (
      currentMetadataName !== desiredDisplayName ||
      currentMetadataGalaxyRequest !== intent.galaxyMapRequested
    ) {
      const { error: userError } = await withTimeout(
        supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            display_name: desiredDisplayName,
            galaxy_map_requested: intent.galaxyMapRequested,
          },
        }),
        authOperationTimeoutMs,
        'Google profile sync timed out. Please try again.',
      );

      if (userError) {
        logger.error('Failed to update Google user metadata:', userError);
        return;
      }
    }

    if (
      currentProfile?.display_name !== desiredDisplayName ||
      currentProfile?.galaxy_map_requested !== intent.galaxyMapRequested
    ) {
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({
          display_name: desiredDisplayName,
          galaxy_map_requested: intent.galaxyMapRequested,
        })
        .eq('id', user.id);

      if (updateProfileError) {
        logger.error('Failed to update profile after Google sign-in:', updateProfileError);
        return;
      }
    }

    clearPendingGoogleAuthIntent();
    const profileFetchMode: GoogleProfileFetchMode =
      resolvedProfileUserId === user.id ? 'background' : 'initial';
    void fetchProfile(user.id, profileFetchMode);
  } catch (error) {
    logger.error('Failed to finalize pending Google auth:', error);
  }
}
