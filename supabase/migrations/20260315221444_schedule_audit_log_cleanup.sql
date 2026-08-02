CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '14 days';
$$;

SELECT cron.schedule(
  'cleanup-old-audit-logs',
  '0 3 * * *',
  $$SELECT public.cleanup_old_audit_logs()$$
);
