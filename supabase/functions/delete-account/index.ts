import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const DEFAULT_ALLOWED_ORIGINS = ['https://alphasecunited.com', 'https://www.alphasecunited.com'];
const CORS_ALLOWED_HEADERS = 'authorization, x-client-info, apikey, content-type';
const CORS_ALLOWED_METHODS = 'POST, OPTIONS';

function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  const parsed = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return parsed.length > 0 ? parsed : DEFAULT_ALLOWED_ORIGINS;
}

const ALLOWED_ORIGINS = parseAllowedOrigins(Deno.env.get('ALLOWED_ORIGINS'));

function isAllowedOrigin(origin: string | null): origin is string {
  return !!origin && ALLOWED_ORIGINS.includes(origin);
}

function buildCorsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    'Access-Control-Allow-Headers': CORS_ALLOWED_HEADERS,
    'Access-Control-Allow-Methods': CORS_ALLOWED_METHODS,
    Vary: 'Origin',
  });

  if (isAllowedOrigin(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return headers;
}

function jsonResponse(origin: string | null, status: number, body: unknown): Response {
  const headers = buildCorsHeaders(origin);
  headers.set('Content-Type', 'application/json');
  return new Response(JSON.stringify(body), { status, headers });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');

  if (!isAllowedOrigin(origin)) {
    return jsonResponse(origin, 403, { error: 'Origin not allowed' });
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: buildCorsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse(origin, 405, { error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse(origin, 401, { error: 'Missing authorization header' });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabasePublishableKey = Deno.env.get('EDGE_PUBLISHABLE_KEY');
    const supabaseSecretKey = Deno.env.get('EDGE_SECRET_KEY');

    if (!supabaseUrl || !supabasePublishableKey || !supabaseSecretKey) {
      return jsonResponse(origin, 500, {
        error: 'Missing required Supabase environment variables',
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');

    const userClient = createClient(supabaseUrl, supabasePublishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser(token);

    if (userError || !user) {
      return jsonResponse(origin, 401, { error: 'Invalid or expired token' });
    }

    const adminClient = createClient(supabaseUrl, supabaseSecretKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const cleanupSteps: Array<{ table: string; column: string }> = [
      { table: 'audit_logs', column: 'user_id' },
      { table: 'custom_systems', column: 'created_by' },
      { table: 'custom_fleets', column: 'created_by' },
      { table: 'custom_factions', column: 'created_by' },
      { table: 'app_settings', column: 'updated_by' },
    ];

    for (const step of cleanupSteps) {
      const { error } = await adminClient
        .from(step.table)
        .update({ [step.column]: null })
        .eq(step.column, user.id);

      if (error) {
        console.error(`Failed to clean up ${step.table}.${step.column}:`, error.message);
        return jsonResponse(origin, 500, {
          error: 'Failed to delete account. Please try again or contact support.',
        });
      }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('Account deletion failed:', deleteError.message);
      return jsonResponse(origin, 500, {
        error: 'Failed to delete account. Please try again or contact support.',
      });
    }

    return jsonResponse(origin, 200, { success: true });
  } catch (err) {
    console.error('Unexpected error in delete-account:', err);
    return jsonResponse(origin, 500, {
      error: 'An unexpected error occurred. Please try again or contact support.',
    });
  }
});
