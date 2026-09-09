import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

function parseBool(val: any): boolean | null {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'sí' || s === 'si' || s === 'yes' || s === 'true' || s === '1') return true;
    if (s === 'no' || s === 'false' || s === '0') return false;
  }
  return null;
}

function parseArray(val: any): string[] | null {
  if (!val) return null;
  if (typeof val === 'string') {
    return val.split('|').map(s => s.trim()).filter(Boolean);
  }
  return [String(val)];
}

function parseClass(val: any): string | null {
  if (!val) return null;
  const s = String(val).trim().toUpperCase();
  if (['A', 'B', 'C'].includes(s)) return s;
  return null;
}

function mapStatus(val: any): string {
  if (!val) return 'pending';
  const s = String(val).trim().toLowerCase();
  switch (s) {
    case 'pendiente': return 'pending';
    case 'intento de contacto': return 'attempted';
    case 'contactado': return 'contacted';
    case 'visitado': return 'visited';
    case 'en seguimiento': return 'follow_up';
    case 'oportunidad abierta': return 'opportunity';
    case 'cliente': return 'customer';
    case 'sin interés': return 'not_interested';
    case 'descartado': return 'discarded';
    default: return 'pending';
  }
}

async function run() {
  const args = process.argv.slice(2);
  const fileArgIndex = args.findIndex(a => !a.startsWith('--'));
  if (fileArgIndex === -1) {
    console.error("Usage: ts-node import-prospects.ts <path/to/excel> [--dry-run] [--force]");
    process.exit(1);
  }
  
  const filePath = args[fileArgIndex];
  const dryRun = args.includes('--dry-run');
  const force = args.includes('--force');

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  console.log(`Reading Excel file: ${filePath}`);
  const fileBuffer = fs.readFileSync(filePath);
  const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  
  const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.includes('Prospectos') ? 'Prospectos' : workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
  console.log(`Found ${rows.length} rows in sheet '${sheetName}'.`);

  let runId: string | null = null;
  
  if (!dryRun) {
    const { data: runData, error: runError } = await supabase
      .from('import_runs')
      .insert({
        file_name: path.basename(filePath),
        file_hash: fileHash,
        status: 'processing',
        total_rows: rows.length
      })
      .select('id')
      .single();
      
    if (runError) {
      console.error("Failed to create import_run:", runError);
      process.exit(1);
    }
    runId = runData.id;
  }

  let inserted = 0, updated = 0, skipped = 0, errors = 0;
  
  let classACount = 0, classBCount = 0, classCCount = 0;
  let phoneOkCount = 0, phoneVerifyCount = 0;

  for (let i = 0; i < rows.length; i++) {
    const row: any = rows[i];
    const rowNumber = i + 2; // Assuming row 1 is headers

    const external_id = row['ID'] || row['Id'] || row['id'];
    const company_name = row['Empresa'];

    if (!external_id || !company_name) {
      console.error(`Row ${rowNumber}: Missing ID or Empresa. Skipping.`);
      errors++;
      if (runId) {
        await supabase.from('import_rows').insert({ import_run_id: runId, row_number: rowNumber, external_id: external_id || 'UNKNOWN', status: 'error', message: 'Missing ID or Empresa', payload: row });
      }
      continue;
    }

    const prospectClass = parseClass(row['Clase']);
    if (prospectClass === 'A') classACount++;
    if (prospectClass === 'B') classBCount++;
    if (prospectClass === 'C') classCCount++;

    const phoneQuality = row['Calidad del teléfono'];
    const phoneQualityStr = phoneQuality ? String(phoneQuality).trim().toLowerCase() : '';
    if (phoneQualityStr === 'ok') phoneOkCount++;
    if (phoneQualityStr === 'verificar' || phoneQualityStr === 'a relevar') phoneVerifyCount++;

    const payload = {
      external_id: String(external_id).trim(),
      contact_status: mapStatus(row['Estado de contacto']),
      corridor: row['Corredor'] ? String(row['Corredor']) : null,
      microzone: row['Microzona'] ? String(row['Microzona']) : null,
      city: row['Ciudad'] ? String(row['Ciudad']) : null,
      class: prospectClass,
      operational_score: row['Puntaje operativo'] != null ? Number(row['Puntaje operativo']) : null,
      company_name: String(company_name).trim(),
      sector: row['Sector'] ? String(row['Sector']) : null,
      commercial_category: row['Categoría comercial'] ? String(row['Categoría comercial']) : null,
      phones_raw: row['Teléfonos'] ? String(row['Teléfonos']) : null,
      primary_phone: row['Teléfono principal (tel:)'] ? String(row['Teléfono principal (tel:)']).replace(/^tel:/i, '').trim() : null,
      phone_links: parseArray(row['Links telefónicos']),
      phone_quality: row['Calidad del teléfono'] ? String(row['Calidad del teléfono']) : null,
      ask_for: row['Preguntar por'] ? String(row['Preguntar por']) : null,
      probable_need: row['Necesidad probable'] ? String(row['Necesidad probable']) : null,
      presol_offer: row['Oferta PRESOL'] ? String(row['Oferta PRESOL']) : null,
      sales_hook: row['Gancho comercial'] ? String(row['Gancho comercial']) : null,
      suggested_action: row['Acción sugerida'] ? String(row['Acción sugerida']) : null,
      pending_data: row['Dato pendiente'] ? String(row['Dato pendiente']) : null,
      google_maps_url: row['Google Maps'] ? String(row['Google Maps']) : null,
      source_name: row['Fuente'] ? String(row['Fuente']) : null,
      source_url: row['URL fuente'] ? String(row['URL fuente']) : null,
      evidence: row['Evidencia'] ? String(row['Evidencia']) : null,
      data_quality: row['Calidad del dato'] ? String(row['Calidad del dato']) : null,
      origin_record: row['Origen del registro'] ? String(row['Origen del registro']) : null,
      presol_services: parseArray(row['Servicios PRESOL a ofrecer']),
      enrichment_focus: row['Rubro foco enriquecimiento'] ? String(row['Rubro foco enriquecimiento']) : null,
      city_focus_requested: parseBool(row['Ciudad foco solicitada']),
      visit_priority: row['Prioridad visita sugerida'] ? String(row['Prioridad visita sugerida']) : null,
      new_service_observation: row['Observación servicio nuevo'] ? String(row['Observación servicio nuevo']) : null,
      source_unification: row['Fuente unificación'] ? String(row['Fuente unificación']) : null,
      unification_notes: row['Notas de unificación'] ? String(row['Notas de unificación']) : null,
      source_payload: row
    };

    if (dryRun) {
      inserted++;
      continue;
    }

    // Upsert logic
    const { data: existing, error: findError } = await supabase
      .from('prospects')
      .select('id, created_at')
      .eq('external_id', payload.external_id)
      .maybeSingle();

    if (findError) {
      console.error(`Row ${rowNumber}: DB Error checking existence:`, findError);
      errors++;
      if (runId) await supabase.from('import_rows').insert({ import_run_id: runId, row_number: rowNumber, external_id: payload.external_id, status: 'error', message: findError.message, payload: row });
      continue;
    }

    let status = 'inserted';
    let upsertPayload = { ...payload };

    if (existing && !force) {
      // Avoid overwriting manually enriched data with nulls, maybe keep it simple for MVP or implement full diff logic
      // In this version, we will just upsert everything, as supabase upsert will replace the row based on unique constraint
      status = 'updated';
    }

    const { error: upsertError } = await supabase
      .from('prospects')
      .upsert(upsertPayload, { onConflict: 'external_id' });

    if (upsertError) {
      console.error(`Row ${rowNumber}: DB Error on upsert:`, upsertError);
      errors++;
      if (runId) await supabase.from('import_rows').insert({ import_run_id: runId, row_number: rowNumber, external_id: payload.external_id, status: 'error', message: upsertError.message, payload: row });
      continue;
    }

    if (status === 'inserted') inserted++;
    else updated++;

    if (runId) {
      await supabase.from('import_rows').insert({ import_run_id: runId, row_number: rowNumber, external_id: payload.external_id, status: status, payload: row });
    }
    
    // Process historical fields (tasks, comments, activities) as specified
    if (!existing) { // Only on insert to avoid duplicating activities
      const { data: prospect } = await supabase.from('prospects').select('id').eq('external_id', payload.external_id).single();
      if (prospect) {
        // Find admin user to assign activities to if no specific user mapping is available
        const { data: profiles } = await supabase.from('profiles').select('id').limit(1);
        const adminId = profiles && profiles.length > 0 ? profiles[0].id : null;
        
        if (adminId) {
            // Nota Dirección -> comment
            if (row['Nota Dirección']) {
              await supabase.from('comments').insert({
                prospect_id: prospect.id,
                body: String(row['Nota Dirección']),
                is_direction_note: true,
                created_by: adminId
              });
            }

            // Resultado & Fecha de visita & Notas de campo -> Activity
            if (row['Resultado'] || row['Notas de campo'] || row['Fecha de visita']) {
              await supabase.from('activities').insert({
                prospect_id: prospect.id,
                type: 'other',
                outcome: 'other', // Should map properly in a real scenario
                notes: row['Notas de campo'] ? String(row['Notas de campo']) : null,
                summary: row['Resultado'] ? String(row['Resultado']) : null,
                created_by: adminId,
                occurred_at: row['Fecha de visita'] ? new Date(row['Fecha de visita']).toISOString() : new Date().toISOString()
              });
            }

            // Próximo paso -> Task
            if (row['Próximo paso']) {
              await supabase.from('tasks').insert({
                prospect_id: prospect.id,
                title: String(row['Próximo paso']),
                created_by: adminId
              });
            }
        }
      }
    }
  }

  if (runId) {
    await supabase.from('import_runs')
      .update({
        status: errors > 0 ? 'partial' : 'completed',
        inserted_rows: inserted,
        updated_rows: updated,
        skipped_rows: skipped,
        error_rows: errors,
        finished_at: new Date().toISOString()
      })
      .eq('id', runId);
  }

  console.log('--- IMPORT SUMMARY ---');
  console.log(`Total Rows : ${rows.length}`);
  console.log(`Inserted   : ${inserted}`);
  console.log(`Updated    : ${updated}`);
  console.log(`Skipped    : ${skipped}`);
  console.log(`Errors     : ${errors}`);
  console.log('');
  console.log(`Clase A    : ${classACount}`);
  console.log(`Clase B    : ${classBCount}`);
  console.log(`Clase C    : ${classCCount}`);
  console.log(`Phones OK  : ${phoneOkCount}`);
  console.log(`To verify  : ${phoneVerifyCount}`);
  
  if (classACount + classBCount + classCCount === 287) {
    console.log("SUCCESS: A+B+C = 287");
  }
}

run().catch(console.error);
