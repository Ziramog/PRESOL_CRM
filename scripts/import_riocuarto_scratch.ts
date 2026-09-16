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

async function main() {
  const filePath = path.resolve('c:/Projects/PRESOL_CRM', 'temp_data/PRESOL_VILLA_MARIA_ENRIQUECIDO_AGRO_CONSTRUCTORAS_2026-09-15.xlsx');
  const wb = xlsx.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json<any[]>(sheet, { header: 1 });

  let newCount = 0;
  let updateCount = 0;

  console.log(`Total rows in excel: ${data.length}`);
  // Data starts at row 11 (index 11)
  for (let i = 11; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0 || !row[0]) continue;
    console.log(`Processing row ${i}: ${row[0]}`);

    const external_id = row[0]?.toString().trim();
    let p_class = row[1]?.toString().trim() || null;
    if (p_class === 'A+') p_class = 'A';
    if (p_class === 'B+') p_class = 'B';
    if (p_class === 'C+') p_class = 'C';
    
    const operational_score = row[2] ? Number(row[2]) : null;
    const company_name = row[3]?.toString().trim();
    const commercial_category = row[4]?.toString().trim() || null;
    const phones_raw = row[5]?.toString().trim() || null;
    const primary_phone = phones_raw ? phones_raw.split('/')[0].trim() : null;
    const microzone = row[6]?.toString().trim() || null;
    const probable_need = row[7]?.toString().trim() || null;
    const presol_offer = row[8]?.toString().trim() || null;
    const suggested_action = row[9]?.toString().trim() || null;
    const google_maps_url = row[10]?.toString().trim() || null;
    const city = 'Villa María';

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
      if (!existing.city) updates.city = city;
      if (!existing.phones_raw && phones_raw) updates.phones_raw = phones_raw;
      if (!existing.primary_phone && primary_phone) updates.primary_phone = primary_phone;
      if (!existing.microzone && microzone) updates.microzone = microzone;
      if (!existing.probable_need && probable_need) updates.probable_need = probable_need;
      if (!existing.presol_offer && presol_offer) updates.presol_offer = presol_offer;
      if (!existing.suggested_action && suggested_action) updates.suggested_action = suggested_action;
      if (!existing.google_maps_url && google_maps_url) updates.google_maps_url = google_maps_url;

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
          probable_need,
          presol_offer,
          suggested_action,
          google_maps_url,
          source_name: 'Villa María Enriquecido 2026-09-15'
        });

      if (errInsert) {
        console.error(`Failed to insert ${company_name}:`, errInsert);
      } else {
        newCount++;
        console.log(`Inserted new: ${company_name}`);
      }
    }
  }

  console.log(`Finished. Inserted: ${newCount}, Updated: ${updateCount}`);
}

main().catch(console.error);

