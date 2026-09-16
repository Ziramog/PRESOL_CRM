import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('c:/Projects/PRESOL_CRM', '.env.local') });
dotenv.config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE config");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function processFile(filePath: string) {
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  let newCount = 0;
  let updateCount = 0;

  console.log(`\n--- Processing ${path.basename(filePath)} ---`);
  console.log(`Total rows in excel: ${data.length}`);
  // Data starts at row 14 (index 13)
  for (let i = 13; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0 || !row[0]) continue;
    console.log(`Processing row ${i}: ${row[0]}`);

    const external_id = row[0]?.toString().trim();
    const area = row[1]?.toString().trim() || null;
    const city = row[2]?.toString().trim() || 'San Francisco';
    let p_class = row[3]?.toString().trim() || null;
    if (p_class === 'A+') p_class = 'A';
    if (p_class === 'B+') p_class = 'B';
    if (p_class === 'C+') p_class = 'C';
    
    const operational_score = row[4] ? Number(row[4]) : null;
    const company_name = row[5]?.toString().trim();
    const commercial_category = row[6]?.toString().trim() || null;
    let phones_raw = row[7]?.toString().trim() || null;
    if (phones_raw && phones_raw.toLowerCase().includes('verificar')) {
      phones_raw = null;
    }
    const primary_phone = phones_raw ? phones_raw.split('/')[0].trim() : null;
    const base_microzone = row[8]?.toString().trim() || null;
    const microzone = area && base_microzone ? `[${area}] ${base_microzone}` : base_microzone;
    
    const suggested_action = row[9]?.toString().trim() || null;
    const google_maps_url = row[10]?.toString().trim() || null;
    const status_verif = row[11]?.toString().trim() || null;
    const probable_need = status_verif ? `Estado/verif: ${status_verif}` : null;

    if (!company_name) continue;

    const { data: existing, error: errFetch } = await supabase
      .from('prospects')
      .select('*')
      .or(`external_id.eq."${external_id}",company_name.eq."${company_name}"`)
      .limit(1)
      .single();

    if (existing) {
      const updates: any = {};
      if (!existing.class && p_class) updates.class = p_class;
      if (!existing.operational_score && operational_score !== null) updates.operational_score = operational_score;
      if (!existing.commercial_category && commercial_category) updates.commercial_category = commercial_category;
      if (!existing.city && city) updates.city = city;
      if (!existing.phones_raw && phones_raw) updates.phones_raw = phones_raw;
      if (!existing.primary_phone && primary_phone) updates.primary_phone = primary_phone;
      if (!existing.microzone && microzone) updates.microzone = microzone;
      if (!existing.suggested_action && suggested_action) updates.suggested_action = suggested_action;
      if (!existing.google_maps_url && google_maps_url) updates.google_maps_url = google_maps_url;
      if (!existing.probable_need && probable_need) updates.probable_need = probable_need;

      if (Object.keys(updates).length > 0) {
        const { error: errUpdate } = await supabase
          .from('prospects')
          .update(updates)
          .eq('id', existing.id);
        if (errUpdate) {
          console.error(`Failed to update ${company_name}:`, errUpdate);
        } else {
          updateCount++;
          console.log(`Updated ${company_name} with fields:`, Object.keys(updates));
        }
      }
    } else {
      const { error: errInsert } = await supabase
        .from('prospects')
        .insert({
          external_id,
          class: p_class,
          operational_score,
          company_name,
          commercial_category,
          city,
          phones_raw,
          primary_phone,
          microzone,
          suggested_action,
          google_maps_url,
          probable_need,
          source_name: 'San Francisco Rastrillaje 2026-09-15'
        });

      if (errInsert) {
        console.error(`Failed to insert ${company_name}:`, errInsert);
      } else {
        newCount++;
        console.log(`Inserted new: ${company_name}`);
      }
    }
  }

  console.log(`Finished ${path.basename(filePath)}. Inserted: ${newCount}, Updated: ${updateCount}`);
}

async function main() {
  const files = [
    'temp_data/PRESOL_LAS_VARILLAS_ENRIQUECIDO_MAQUINARIA_CONSTRUCCION_2026-09-15.xlsx'
  ];
  for (const f of files) {
    await processFile(path.resolve('c:/Projects/PRESOL_CRM', f));
  }
}

main().catch(console.error);

