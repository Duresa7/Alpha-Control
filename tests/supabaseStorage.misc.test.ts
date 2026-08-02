import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = {
    customFactions: [] as Array<Record<string, unknown>>,
    rpcData: null as unknown,
    rpcError: null as { message: string } | null,
    authGetUserResult: {
      data: { user: { id: 'user-1' } },
      error: null,
    } as { data: { user: { id: string } | null }; error: { message: string } | null },
  };

  const customFactionsOrder = vi.fn(async () => ({ data: state.customFactions, error: null }));
  const customFactionsSelect = vi.fn(() => ({
    order: customFactionsOrder,
  }));
  const customFactionsUpsert = vi.fn(async () => ({ error: null }));
  const customFactionsUpdateEq = vi.fn(async () => ({ error: null }));
  const customFactionsUpdate = vi.fn(() => ({
    eq: customFactionsUpdateEq,
  }));
  const customFactionsDeleteEq = vi.fn(async () => ({ error: null }));
  const customFactionsDelete = vi.fn(() => ({
    eq: customFactionsDeleteEq,
  }));

  return {
    state,
    customFactionsOrder,
    customFactionsSelect,
    customFactionsUpsert,
    customFactionsUpdate,
    customFactionsUpdateEq,
    customFactionsDelete,
    customFactionsDeleteEq,
    from: vi.fn((table: string) => {
      if (table === 'custom_factions') {
        return {
          select: customFactionsSelect,
          upsert: customFactionsUpsert,
          update: customFactionsUpdate,
          delete: customFactionsDelete,
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
    rpc: vi.fn(async () => ({ data: state.rpcData, error: state.rpcError })),
    authGetUser: vi.fn(async () => state.authGetUserResult),
  };
});

vi.mock('@/lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    from: mocks.from,
    rpc: mocks.rpc,
    auth: {
      getUser: mocks.authGetUser,
    },
  },
}));

import {
  deleteFactionFromDb,
  fetchAuditLogTotal,
  getAuthenticatedUserId,
  loadFactions,
  updateFactionInDb,
  upsertFaction,
} from '@/data/supabaseStorage';

describe('supabaseStorage misc behavior', () => {
  beforeEach(() => {
    mocks.state.customFactions = [];
    mocks.state.rpcData = null;
    mocks.state.rpcError = null;
    mocks.state.authGetUserResult = {
      data: { user: { id: 'user-1' } },
      error: null,
    };

    mocks.from.mockClear();
    mocks.rpc.mockClear();
    mocks.authGetUser.mockClear();
    mocks.customFactionsOrder.mockClear();
    mocks.customFactionsSelect.mockClear();
    mocks.customFactionsUpsert.mockClear();
    mocks.customFactionsUpdate.mockClear();
    mocks.customFactionsUpdateEq.mockClear();
    mocks.customFactionsDelete.mockClear();
    mocks.customFactionsDeleteEq.mockClear();
  });

  it('returns the authenticated user id when auth lookup succeeds', async () => {
    await expect(getAuthenticatedUserId()).resolves.toBe('user-1');
  });

  it('returns null when auth lookup reports an error', async () => {
    mocks.state.authGetUserResult = {
      data: { user: null },
      error: { message: 'bad auth' },
    };

    await expect(getAuthenticatedUserId()).resolves.toBeNull();
  });

  it('maps faction rows into app config shape', async () => {
    mocks.state.customFactions = [
      {
        id: 'new_faction',
        label: 'New Faction',
        marker_color: '#111111',
        bar_color: '#222222',
        sort_order: 7,
        is_builtin: false,
      },
    ];

    await expect(loadFactions()).resolves.toEqual([
      {
        id: 'new_faction',
        label: 'New Faction',
        markerColor: '#111111',
        barColor: '#222222',
        sortOrder: 7,
        isBuiltin: false,
      },
    ]);
    expect(mocks.customFactionsOrder).toHaveBeenCalledWith('sort_order', { ascending: true });
  });

  it('serializes faction upserts with snake_case db fields', async () => {
    await upsertFaction(
      {
        id: 'new_faction',
        label: 'New Faction',
        markerColor: '#111111',
        barColor: '#222222',
        sortOrder: 7,
        isBuiltin: false,
      },
      'user-1',
    );

    expect(mocks.customFactionsUpsert).toHaveBeenCalledWith(
      {
        id: 'new_faction',
        label: 'New Faction',
        marker_color: '#111111',
        bar_color: '#222222',
        sort_order: 7,
        is_builtin: false,
        created_by: 'user-1',
      },
      { onConflict: 'id' },
    );
  });

  it('updates only the provided faction fields', async () => {
    await updateFactionInDb('new_faction', {
      label: 'Updated Faction',
      barColor: '#abcdef',
    });

    expect(mocks.customFactionsUpdate).toHaveBeenCalledWith({
      label: 'Updated Faction',
      bar_color: '#abcdef',
    });
    expect(mocks.customFactionsUpdateEq).toHaveBeenCalledWith('id', 'new_faction');
  });

  it('deletes factions by id', async () => {
    await deleteFactionFromDb('obsolete');

    expect(mocks.customFactionsDelete).toHaveBeenCalledTimes(1);
    expect(mocks.customFactionsDeleteEq).toHaveBeenCalledWith('id', 'obsolete');
  });

  it('parses audit totals from rpc results and normalizes query input', async () => {
    mocks.state.rpcData = [{ total_count: '12' }];

    await expect(fetchAuditLogTotal('  faction  ', '2026-03-01', 'faction_updated')).resolves.toBe(
      12,
    );
    expect(mocks.rpc).toHaveBeenCalledWith('fetch_audit_logs_total', {
      p_query: 'faction',
      p_since: '2026-03-01',
      p_action: 'faction_updated',
    });
  });

  it('returns zero when audit totals are invalid or the rpc fails', async () => {
    mocks.state.rpcData = [{ total_count: 'not-a-number' }];
    await expect(fetchAuditLogTotal()).resolves.toBe(0);

    mocks.state.rpcError = { message: 'rpc failed' };
    await expect(fetchAuditLogTotal()).resolves.toBe(0);
  });
});
