import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

if (!supabaseUrlMatch || !supabaseKeyMatch) {
  console.log('Keys not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function exportCSV() {
  const { data: prospects, error } = await supabase
    .from('prospects')
    .select('id, external_id, company_name, website, address, city, source_payload')
    .order('company_name');

  if (error) {
    console.error('Error fetching prospects:', error);
    return;
  }

  // Build CSV
  const header = ['ID', 'Codigo', 'Nombre', 'Web', 'Direccion', 'Ciudad', 'Latitud', 'Longitud'].join(',');
  const rows = [header];

  for (const p of prospects) {
    const id = p.id;
    const codigo = p.external_id || '';
    
    // Escapar comas en los textos
    const nombre = `"${(p.company_name || '').replace(/"/g, '""')}"`;
    const web = `"${(p.website || '').replace(/"/g, '""')}"`;
    const direccion = `"${(p.address || '').replace(/"/g, '""')}"`;
    const ciudad = `"${(p.city || '').replace(/"/g, '""')}"`;
    
    const lat = p.source_payload?.lat || '';
    const lng = p.source_payload?.lng || '';

    rows.push([id, codigo, nombre, web, direccion, ciudad, lat, lng].join(','));
  }

  const csvContent = rows.join('\n');
  const outPath = path.join('C:', 'Users', 'ingju', '.gemini', 'antigravity', 'brain', '274b8944-ea0f-4fd9-b3e4-054e8d3e0331', 'scratch', 'prospectos_export.csv');
  
  // Make sure scratch dir exists
  const scratchDir = path.dirname(outPath);
  if (!fs.existsSync(scratchDir)) {
    fs.mkdirSync(scratchDir, { recursive: true });
  }

  fs.writeFileSync(outPath, csvContent, 'utf-8');
  console.log(`Exported ${prospects.length} prospects to ${outPath}`);
}

exportCSV();
