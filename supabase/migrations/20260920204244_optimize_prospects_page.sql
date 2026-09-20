-- Create computed column for open tasks
CREATE OR REPLACE FUNCTION open_tasks(p prospects)
RETURNS bigint AS $$
  SELECT count(*) FROM tasks WHERE prospect_id = p.id AND status = 'pending';
$$ LANGUAGE sql STABLE;

-- Create computed column for direction notes
CREATE OR REPLACE FUNCTION has_direction_note(p prospects)
RETURNS boolean AS $$
  SELECT EXISTS(
    SELECT 1 FROM comments 
    WHERE prospect_id = p.id AND is_direction_note = true AND deleted_at IS NULL
  );
$$ LANGUAGE sql STABLE;

-- RPC for distinct cities
CREATE OR REPLACE FUNCTION get_distinct_cities()
RETURNS TABLE (city text) AS $$
  SELECT DISTINCT p.city FROM prospects p WHERE p.city IS NOT NULL ORDER BY p.city;
$$ LANGUAGE sql STABLE;

-- RPC for distinct sectors
CREATE OR REPLACE FUNCTION get_distinct_sectors()
RETURNS TABLE (sector text) AS $$
  SELECT DISTINCT p.sector FROM prospects p WHERE p.sector IS NOT NULL ORDER BY p.sector;
$$ LANGUAGE sql STABLE;
