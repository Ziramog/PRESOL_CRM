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
    return;
  }
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  console.log(`Processing ${data.length - 3} rows (ignoring headers)...`);
  
  let updatedCount = 0;

  for (let i = 3; i < data.length; i++) {
    const row: any = data[i];
    const externalId = row['PRESOL — Prospectos | Resumen Ejecutivo'];
    const notes = row['__EMPTY_9'];

    if (externalId && typeof externalId === 'string' && notes && typeof notes === 'string' && notes.trim() !== '') {
      console.log(`Updating ${externalId} with notes: ${notes.substring(0, 30)}...`);
      
      const { error } = await supabase
        .from('prospects')
        .update({ pending_data: notes.trim() })
        .eq('external_id', externalId);

      if (error) {
        console.error(`Failed to update ${externalId}:`, error);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Finished. Updated ${updatedCount} prospects.`);
}

main();
