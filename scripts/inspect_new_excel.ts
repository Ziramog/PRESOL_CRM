const xlsx = require('xlsx');

const workbook = xlsx.readFile('C:\\Users\\ingju\\Downloads\\PRESOL_prospectos_OLIVA_TIO_PUJIO_2026-09-09.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet);

console.log(`Found ${data.length} rows.`);
console.log('Rows 5-15:', JSON.stringify(data.slice(5, 15), null, 2));
