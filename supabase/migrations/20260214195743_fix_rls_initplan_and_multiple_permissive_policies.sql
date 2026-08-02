-- Fix auth_rls_initplan for custom_systems (insert, update, delete)
DROP POLICY IF EXISTS custom_systems_insert ON public.custom_systems;
DROP POLICY IF EXISTS custom_systems_update ON public.custom_systems;
DROP POLICY IF EXISTS custom_systems_delete ON public.custom_systems;

CREATE POLICY custom_systems_insert ON public.custom_systems
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = ANY (ARRAY['admin'::text, 'bossman'::text])
  ));

CREATE POLICY custom_systems_update ON public.custom_systems
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = ANY (ARRAY['admin'::text, 'bossman'::text])
  ));

CREATE POLICY custom_systems_delete ON public.custom_systems
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = ANY (ARRAY['admin'::text, 'bossman'::text])
  ));

-- Fix auth_rls_initplan for custom_fleets (insert, update, delete)
DROP POLICY IF EXISTS custom_fleets_insert ON public.custom_fleets;
DROP POLICY IF EXISTS custom_fleets_update ON public.custom_fleets;
DROP POLICY IF EXISTS custom_fleets_delete ON public.custom_fleets;

CREATE POLICY custom_fleets_insert ON public.custom_fleets
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = ANY (ARRAY['admin'::text, 'bossman'::text])
  ));

CREATE POLICY custom_fleets_update ON public.custom_fleets
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = ANY (ARRAY['admin'::text, 'bossman'::text])
  ));

CREATE POLICY custom_fleets_delete ON public.custom_fleets
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = (select auth.uid())
    AND profiles.role = ANY (ARRAY['admin'::text, 'bossman'::text])
  ));

-- Fix auth_rls_initplan for audit_logs (insert)
DROP POLICY IF EXISTS audit_logs_insert ON public.audit_logs;

CREATE POLICY audit_logs_insert ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (select auth.uid())
    AND current_user_role() = ANY (ARRAY['admin'::text, 'bossman'::text])
  );

-- Fix auth_rls_initplan + multiple_permissive_policies for profiles
-- Combine profiles_select_own + profiles_select_bossman into one policy
DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_select_bossman ON public.profiles;

CREATE POLICY profiles_select ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = id
    OR (select current_user_role()) = 'bossman'
  );

-- Combine profiles_update_own + profiles_update_bossman into one policy
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_bossman ON public.profiles;

CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE TO authenticated
  USING (
    (select auth.uid()) = id
    OR (select current_user_role()) = 'bossman'
  )
  WITH CHECK (
    ((select auth.uid()) = id AND role = (select current_user_role()))
    OR (select current_user_role()) = 'bossman'
  );
