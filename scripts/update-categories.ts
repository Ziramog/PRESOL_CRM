import * as xlsx from 'xlsx';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const filePath = 'C:\\Users\\ingju\\Documents\\Wolfim\\CLIENTES\\PRESOL\\contactos Lucas.xlsx';

async function main() {
  if (!fs.existsSync(filePath)) {
    console.error('File does not exist:', filePath);
    process.exit(1);
  }
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  console.log(`Processing ${data.length - 3} rows for sector updates...`);
  
  const updates: any[] = [];
  
  for (let i = 3; i < data.length; i++) {
    const row: any = data[i];
    const externalId = row['PRESOL — Prospectos | Resumen Ejecutivo'];
    const category = row['__EMPTY_2']; // "Categoría comercial"

    if (externalId && typeof externalId === 'string' && category && typeof category === 'string' && category.trim() !== 'Categoría comercial') {
      const cleanCategory = category.trim().toUpperCase();
      updates.push({ externalId, cleanCategory });
    }
  }

  console.log(`Found ${updates.length} updates. Sending to DB...`);

  let successCount = 0;
  
  for (let i = 0; i < updates.length; i += 20) {
    const chunk = updates.slice(i, i + 20);
    console.log(`Processing chunk ${i} to ${i + chunk.length}...`);
    
    await Promise.all(chunk.map(async (u) => {
      const { error } = await supabase
        .from('prospects')
        .update({ sector: u.cleanCategory })
        .eq('external_id', u.externalId);
        
      if (error) {
        console.error(`Failed to update ${u.externalId}:`, error);
      } else {
        successCount++;
      }
    }));
  }

  console.log(`Finished. Updated ${successCount} prospects.`);
  process.exit(0);
}

main().catch(console.error);
