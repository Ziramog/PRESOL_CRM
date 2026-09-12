-- Add data quality fields
ALTER TABLE public.prospects
ADD COLUMN data_status text DEFAULT 'incomplete' CHECK (data_status IN ('incomplete', 'enriched', 'verified')),
ADD COLUMN data_completeness integer DEFAULT 0 CHECK (data_completeness >= 0 AND data_completeness <= 100),
ADD COLUMN enrichment_status text DEFAULT 'idle' CHECK (enrichment_status IN ('idle', 'processing', 'completed', 'failed'));

-- Create enrichment_runs table to lay groundwork for AI enrichment
CREATE TABLE public.enrichment_runs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    prospect_id uuid NOT NULL REFERENCES public.prospects(id) ON DELETE CASCADE,
    run_type text NOT NULL DEFAULT 'ai' CHECK (run_type IN ('ai', 'manual_assisted')),
    status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'success', 'failed')),
    started_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz,
    found_data jsonb DEFAULT '{}'::jsonb,
    applied_data jsonb DEFAULT '{}'::jsonb,
    error_message text,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX enrichment_runs_prospect_idx ON public.enrichment_runs(prospect_id);

-- Trigger to calculate data_completeness
CREATE OR REPLACE FUNCTION public.calculate_data_completeness()
RETURNS TRIGGER AS $$
DECLARE
    score integer := 0;
    total_fields integer := 5;
BEGIN
    -- 1. company_name
    IF NEW.company_name IS NOT NULL AND trim(NEW.company_name) <> '' THEN
        score := score + 1;
    END IF;

    -- 2. phone (primary_phone or phones_raw)
    IF (NEW.primary_phone IS NOT NULL AND trim(NEW.primary_phone) <> '') OR 
       (NEW.phones_raw IS NOT NULL AND trim(NEW.phones_raw) <> '') THEN
        score := score + 1;
    END IF;

    -- 3. city
    IF NEW.city IS NOT NULL AND trim(NEW.city) <> '' THEN
        score := score + 1;
    END IF;

    -- 4. sector or category
    IF (NEW.sector IS NOT NULL AND trim(NEW.sector) <> '') OR 
       (NEW.commercial_category IS NOT NULL AND trim(NEW.commercial_category) <> '') THEN
        score := score + 1;
    END IF;

    -- 5. class
    IF NEW.class IS NOT NULL AND trim(NEW.class) <> '' THEN
        score := score + 1;
    END IF;

    NEW.data_completeness := (score * 100) / total_fields;
    
    -- Auto-update data_status based on completeness
    IF NEW.data_completeness = 100 THEN
        IF NEW.data_status = 'incomplete' THEN
            NEW.data_status := 'enriched';
        END IF;
    ELSE
        NEW.data_status := 'incomplete';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prospect_data_completeness
BEFORE INSERT OR UPDATE ON public.prospects
FOR EACH ROW EXECUTE PROCEDURE public.calculate_data_completeness();

-- Backfill data completeness for existing prospects
UPDATE public.prospects SET id = id; -- This will trigger the calculation
