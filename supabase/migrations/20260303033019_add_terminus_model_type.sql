DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'custom_fleets_model_type_check'
  ) THEN
    ALTER TABLE public.custom_fleets
      DROP CONSTRAINT custom_fleets_model_type_check;
  END IF;
  ALTER TABLE public.custom_fleets
    ADD CONSTRAINT custom_fleets_model_type_check
    CHECK (model_type IN ('sith', 'republic', 'venator', 'valor', 'terminus'));
END
$$;
