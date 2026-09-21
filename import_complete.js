import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import xlsx from 'xlsx';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
const supabaseKeyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);

const supabase = createClient(supabaseUrlMatch[1].trim(), supabaseKeyMatch[1].trim());

async function runImport() {
  const workbook = xlsx.readFile('C:\\Projects\\PRESOL_CRM\\temp_data\\PRESOL_prospectos_enriquecidos_COMPLETO_2026-09-20.xlsx');
  const sheetName = workbook.SheetNames[0];
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  const { data: prospects } = await supabase.from('prospects').select('id, source_payload, address, website');
  
  let updatedCount = 0;

  for (const p of prospects) {
    const excelRow = data.find(r => r.ID === p.id);
    
    // Solo procedemos si el excel dice que lo importemos y no es un "Falso positivo" o a depurar.
    // La accion dice "Importar verificados; revisar notas si confianza Media"
    if (excelRow && excelRow.Accion_importacion && excelRow.Accion_importacion.includes('Importar')) {
      const newPayload = { ...p.source_payload };
      
      // Wipe fake lat/lng
      delete newPayload.lat;
      delete newPayload.lng;

      // Save Place ID for later use
      if (excelRow.Google_Place_ID) {
        newPayload.google_place_id = excelRow.Google_Place_ID;
      }
      if (excelRow.Maps_URL) {
        newPayload.maps_url = excelRow.Maps_URL;
      }
      
      let newAddress = p.address;
      let newWeb = p.website;
      
      const eAddr = excelRow.Direccion_usable;
      const eWeb = excelRow.Web_usable;
      
      if (eAddr && eAddr.trim().length > 0) newAddress = eAddr;
      if (eWeb && eWeb.trim().length > 0) newWeb = eWeb;

      await supabase.from('prospects').update({
        source_payload: newPayload,
        address: newAddress,
        website: newWeb
      }).eq('id', p.id);
      
      updatedCount++;
    }
  }
  
  console.log(`Finalizado. Se importaron los datos verificados de ${updatedCount} empresas, sin simular coordenadas.`);
}

runImport();
