const xlsx = require('xlsx');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const filePath = 'C:\\Users\\ingju\\Downloads\\PRESOL_prospectos_OLIVA_TIO_PUJIO_2026-09-09.xlsx';

async function main() {
  const workbook = xlsx.readFile(filePath);
  const sheetName = 'Oliva - Tío Pujio';
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
  
  const prospects = [];
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const externalId = row['ID'];
    if (!externalId || typeof externalId !== 'string' || !externalId.includes('-')) continue;
    
    const pClass = row['Clase'] || null;
    const companyName = row['Empresa'];
    const category = row['Categoría comercial'];
    const corridor = row['Corredor'] || null;
    const city = row['Ciudad'] || null;
    const phonesRaw = row['Teléfonos'] || null;
    const askFor = row['Preguntar por'] || null;
    const probableNeed = row['Necesidad probable'] || null;
    const visitPriority = row['Prioridad visita sugerida'] || null;
    const pendingData = row['Dato pendiente'] || null;
    
    if (!companyName) continue;
    
    prospects.push({
      external_id: externalId,
      class: ['A', 'B', 'C'].includes(pClass) ? pClass : null,
      company_name: companyName,
      sector: category ? category.trim().toUpperCase() : null,
      commercial_category: category || null,
      corridor,
      city,
      phones_raw: phonesRaw ? phonesRaw.toString() : null,
      primary_phone: row['Teléfono principal (tel:)'] ? row['Teléfono principal (tel:)'].replace('tel:', '') : (phonesRaw ? phonesRaw.toString().split('/')[0].trim() : null),
      ask_for: askFor,
      probable_need: probableNeed,
      visit_priority: visitPriority,
      pending_data: pendingData,
      google_maps_url: row['Google Maps'] || null
    });
  }

  // UPSERT
  const { data: result, error } = await supabase
    .from('prospects')
    .upsert(prospects, { onConflict: 'external_id' });
    
  if (error) {
    console.error('Error in upsert:', error.message);
  } else {
    console.log(`Upserted ${prospects.length} prospects successfully.`);
  }
}

main().catch(console.error);
