import xlsx from 'xlsx';

const workbook = xlsx.readFile('C:\\Projects\\PRESOL_CRM\\temp_data\\PRESOL_prospectos_enriquecidos_web_2026-09-20.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

const enriched = data.filter(r => r.Direccion_usable || r.Direccion_verificada);
console.log(`Enriched rows: ${enriched.length}`);
if (enriched.length > 0) {
  console.log('Sample enriched:', enriched[0]);
}
