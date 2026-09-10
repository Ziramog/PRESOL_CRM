const xlsx = require('xlsx');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const filePath = 'C:\\Users\\ingju\\Downloads\\PRESOL_prospectos_OLIVA_TIO_PUJIO_2026-09-09.xlsx';

async function main() {
  if (!fs.existsSync(filePath)) {
    console.error('File does not exist:', filePath);
    process.exit(1);
  }
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  console.log(`Processing file with ${data.length} rows...`);
  
  const prospects = [];
  
  // Data seems to start at index 6 after headers at 5
  for (let i = 6; i < data.length; i++) {
    const row = data[i];
    
    // Some rows might be empty or totals, so check external_id
    const externalId = row['PRESOL — Prospectos | Resumen Ejecutivo'];
    if (!externalId || typeof externalId !== 'string' || !externalId.includes('-')) {
      continue;
    }
    
    const pClass = row['__EMPTY'] || null;
    const companyName = row['__EMPTY_1'];
    const category = row['__EMPTY_2'];
    const corridor = row['__EMPTY_3'] || null;
    const city = row['__EMPTY_4'] || null;
    const phonesRaw = row['__EMPTY_5'] || null;
    const askFor = row['__EMPTY_6'] || null;
    const probableNeed = row['__EMPTY_7'] || null;
    const visitPriority = row['__EMPTY_8'] || null;
    const pendingData = row['__EMPTY_9'] || null;
    
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
      primary_phone: phonesRaw ? phonesRaw.toString().split('/')[0].trim() : null,
      ask_for: askFor,
      probable_need: probableNeed,
      visit_priority: visitPriority,
      pending_data: pendingData
    });
  }

  console.log(`Found ${prospects.length} valid prospects to import.`);

  let insertedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;
  
  for (const p of prospects) {
    const { data: existing } = await supabase
      .from('prospects')
      .select('id')
      .eq('external_id', p.external_id)
      .single();
      
    if (existing) {
      // Update
      const { error } = await supabase
        .from('prospects')
        .update(p)
        .eq('id', existing.id);
        
      if (error) {
        console.error(`Error updating ${p.external_id}:`, error.message);
        errorCount++;
      } else {
        updatedCount++;
      }
    } else {
      // Insert
      const { error } = await supabase
        .from('prospects')
        .insert(p);
        
      if (error) {
        console.error(`Error inserting ${p.external_id}:`, error.message);
        errorCount++;
      } else {
        insertedCount++;
      }
    }
  }

  console.log(`Finished! Inserted: ${insertedCount}, Updated: ${updatedCount}, Errors: ${errorCount}`);
  process.exit(0);
}

main().catch(console.error);
