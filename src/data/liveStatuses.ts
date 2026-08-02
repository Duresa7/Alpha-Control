import { supabase, supabaseConfigured } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import pkg from '../../package.json';

export interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'degraded' | 'offline';
  description: string;
  metric?: string;
  metricLabel?: string;
}

type StatusLevel = ServiceStatus['status'];

function indicatorToStatus(indicator: string): StatusLevel {
  if (indicator === 'none') return 'online';
  if (indicator === 'minor') return 'degraded';
  return 'offline';
}

async function fetchMemberCount(): Promise<ServiceStatus> {
  const base: ServiceStatus = {
    id: 'members',
    name: 'Members',
    status: 'online',
    description: 'Registered members across all roles.',
  };

  if (!supabaseConfigured) return base;

  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (error || count === null) {
    logger.error('Failed to fetch member count:', error);
    return base;
  }

  return { ...base, metric: count.toLocaleString(), metricLabel: 'Members' };
}

async function fetchExternalStatus(id: string, name: string, url: string): Promise<ServiceStatus> {
  const base: ServiceStatus = {
    id,
    name,
    status: 'online',
    description: 'All Systems Operational',
  };

  try {
    const res = await fetch(url);
    if (!res.ok) return base;
    const data = await res.json();
    return {
      ...base,
      status: indicatorToStatus(data.status.indicator),
      description: data.status.description,
    };
  } catch {
    return base;
  }
}

function getAppVersion(): ServiceStatus {
  return {
    id: 'version',
    name: 'AlphaSec United',
    status: 'online',
    description: 'Current release version.',
    metric: `v${pkg.version}`,
    metricLabel: 'Latest Release',
  };
}

export async function fetchLiveStatuses(): Promise<ServiceStatus[]> {
  const [members, vercel, supabaseStatus] = await Promise.all([
    fetchMemberCount(),
    fetchExternalStatus(
      'vercel',
      'Vercel Hosting',
      'https://www.vercel-status.com/api/v2/status.json',
    ),
    fetchExternalStatus(
      'supabase',
      'Supabase Database',
      'https://status.supabase.com/api/v2/status.json',
    ),
  ]);

  return [members, vercel, supabaseStatus, getAppVersion()];
}
