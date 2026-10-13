-- Migration: Two-layer prospect status (contact_status + commercial_stage)
-- 1. Columnas nuevas
ALTER TABLE public.prospects
  ADD COLUMN IF NOT EXISTS commercial_stage text NOT NULL DEFAULT 'unqualified',
  ADD COLUMN IF NOT EXISTS discard_reason text,
  ADD COLUMN IF NOT EXISTS discard_notes text,
  ADD COLUMN IF NOT EXISTS discarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS paused_until date,
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz;

-- 2. Backfill etapa desde el estado plano actual
UPDATE public.prospects SET commercial_stage = CASE contact_status
  WHEN 'interested'  THEN 'interested'
  WHEN 'opportunity' THEN 'opportunity'
  WHEN 'quote'       THEN 'quote'
  WHEN 'customer'    THEN 'customer'
  ELSE 'unqualified' END;

-- 3. Elevar etapa con evidencia (nunca bajar) — recupera la etapa de los descartados
--    a) actividades con interés
UPDATE public.prospects p SET commercial_stage = 'interested'
WHERE commercial_stage = 'unqualified' AND EXISTS (
  SELECT 1 FROM public.activities a WHERE a.prospect_id = p.id AND a.deleted_at IS NULL
    AND coalesce(a.result, a.outcome) IN ('interested','wants_call','schedule_meeting','schedule_visit'));

--    b) actividades con pedido de cotización
UPDATE public.prospects p SET commercial_stage = 'quote'
WHERE commercial_stage IN ('unqualified','interested','opportunity') AND EXISTS (
  SELECT 1 FROM public.activities a WHERE a.prospect_id = p.id AND a.deleted_at IS NULL
    AND coalesce(a.result, a.outcome) IN ('requested_quote','proposal_required'));

--    c) oportunidades
UPDATE public.prospects p SET commercial_stage = 'opportunity'
WHERE commercial_stage IN ('unqualified','interested') AND EXISTS (
  SELECT 1 FROM public.opportunities o WHERE o.prospect_id = p.id AND o.deleted_at IS NULL);

--    d) cotizaciones
UPDATE public.prospects p SET commercial_stage = 'quote'
WHERE commercial_stage IN ('unqualified','interested','opportunity') AND EXISTS (
  SELECT 1 FROM public.quotes q WHERE q.client_id = p.id);

--    e) clientes
UPDATE public.prospects p SET commercial_stage = 'customer'
WHERE commercial_stage <> 'customer' AND (
  EXISTS (SELECT 1 FROM public.opportunities o WHERE o.prospect_id = p.id AND o.stage = 'won' AND o.deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM public.quotes q WHERE q.client_id = p.id AND q.status = 'accepted'));

-- 4. Colapsar contact_status a gestión
ALTER TABLE public.prospects DROP CONSTRAINT IF EXISTS prospects_contact_status_check;
UPDATE public.prospects SET contact_status = 'in_progress'
WHERE contact_status IN ('interested','opportunity','quote','customer','visited','contacted','attempted','follow_up');
UPDATE public.prospects SET contact_status = 'discarded', discard_reason = 'other',
  discard_notes = 'Migrado (motivo desconocido)', discarded_at = coalesce(updated_at, now())
WHERE contact_status IN ('discarded','not_interested','duplicate');
UPDATE public.prospects SET contact_status = 'pending'
WHERE contact_status NOT IN ('pending','in_progress','discarded');

-- 5. Constraints
ALTER TABLE public.prospects ADD CONSTRAINT prospects_contact_status_check
  CHECK (contact_status IN ('pending','in_progress','paused','discarded'));
ALTER TABLE public.prospects ADD CONSTRAINT prospects_commercial_stage_check
  CHECK (commercial_stage IN ('unqualified','interested','opportunity','quote','customer'));
ALTER TABLE public.prospects ADD CONSTRAINT prospects_discard_reason_check
  CHECK (discard_reason IS NULL OR discard_reason IN
    ('price','no_need','competitor','no_response','invalid_data','out_of_zone','other'));
ALTER TABLE public.prospects ADD CONSTRAINT prospects_discard_requires_reason
  CHECK (contact_status <> 'discarded' OR discard_reason IS NOT NULL);

CREATE INDEX IF NOT EXISTS prospects_stage_idx ON public.prospects(commercial_stage);

-- 6. Historial
CREATE TABLE IF NOT EXISTS public.prospect_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
  layer text NOT NULL CHECK (layer IN ('management','stage')),
  from_value text,
  to_value text NOT NULL,
  reason text,
  notes text,
  source text NOT NULL CHECK (source IN
    ('manual','activity','opportunity','quote','trip','migration','system')),
  source_id uuid,
  changed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS psh_prospect_idx ON public.prospect_status_history(prospect_id, created_at DESC);
CREATE INDEX IF NOT EXISTS psh_layer_to_idx ON public.prospect_status_history(layer, to_value, created_at);

ALTER TABLE public.prospect_status_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'prospect_status_history'
      AND policyname = 'Allow authenticated full access to prospect_status_history'
  ) THEN
    CREATE POLICY "Allow authenticated full access to prospect_status_history"
      ON public.prospect_status_history
      FOR ALL
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- 7. Snapshot inicial
INSERT INTO public.prospect_status_history (prospect_id, layer, from_value, to_value, source)
SELECT id, 'management', NULL, contact_status, 'migration' FROM public.prospects;
INSERT INTO public.prospect_status_history (prospect_id, layer, from_value, to_value, source)
SELECT id, 'stage', NULL, commercial_stage, 'migration' FROM public.prospects WHERE commercial_stage <> 'unqualified';
