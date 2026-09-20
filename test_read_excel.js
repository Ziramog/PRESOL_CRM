import xlsx from 'xlsx';

const workbook = xlsx.readFile('C:\\Projects\\PRESOL_CRM\\temp_data\\PRESOL_prospectos_enriquecidos_web_2026-09-20.xlsx');
const sheetName = workbook.SheetNames[0];
const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

console.log('Headers:', Object.keys(data[0] || {}));
console.log('First row sample:', data[0]);
