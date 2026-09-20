import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import xlsx from 'xlsx';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function runImport() {
  const workbook = xlsx.readFile('C:\\Projects\\PRESOL_CRM\\temp_data\\PRESOL_prospectos_enriquecidos_web_2026-09-20.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const { data: prospects } = await supabase.from('prospects').select('id, source_payload, address, website');
  
  let updatedCount = 0;

  for (const p of prospects) {
    const excelRow = data.find(r => r.ID === p.id);
    
    // Wipe lat and lng from source_payload to remove simulated locations
    const newPayload = { ...p.source_payload };
    delete newPayload.lat;
    delete newPayload.lng;
    
    let newAddress = p.address;
    let newWeb = p.website;
    
    if (excelRow) {
      const eAddr = excelRow.Direccion_usable || excelRow.Direccion_verificada;
      const eWeb = excelRow.Web_usable || excelRow.Web_verificada;
      
      if (eAddr && eAddr.trim().length > 0) newAddress = eAddr;
      if (eWeb && eWeb.trim().length > 0) newWeb = eWeb;
    }

    await supabase.from('prospects').update({
      source_payload: newPayload,
      address: newAddress,
      website: newWeb
    }).eq('id', p.id);
    
    updatedCount++;
    if (updatedCount % 50 === 0) console.log(`Processed ${updatedCount}...`);
  }
  
  console.log(`Done processing ${updatedCount} prospects. All simulated locations deleted and new addresses imported.`);
}

runImport();
