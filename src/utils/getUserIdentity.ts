import type { Session } from '@supabase/supabase-js';

import type { UserProfile } from '@/types';

export interface UserIdentity {
  displayName: string;
  email: string | null;
}

export function getUserIdentity(
  session: Session | null,
  profile: UserProfile | null,
  fallbackDisplayName = 'Guest',
): UserIdentity {
  const email = session?.user?.email ?? null;
  const metadataDisplayName =
    typeof session?.user?.user_metadata?.display_name === 'string'
      ? session.user.user_metadata.display_name.trim()
      : '';

  return {
    displayName:
      profile?.display_name?.trim() ||
      metadataDisplayName ||
      email?.split('@')[0] ||
      fallbackDisplayName,
    email,
  };
}
