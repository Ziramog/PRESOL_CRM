import * as xlsx from 'xlsx';
import * as fs from 'fs';

const filePath = 'C:\\Users\\ingju\\Documents\\Wolfim\\CLIENTES\\PRESOL\\contactos Lucas.xlsx';

function main() {
  if (!fs.existsSync(filePath)) {
    console.error('File does not exist:', filePath);
    return;
  }
  
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const data = xlsx.utils.sheet_to_json(worksheet);
  
  console.log(`Found ${data.length} rows.`);
  
  const categories = new Set<string>();

  for (let i = 3; i < data.length; i++) {
    const row: any = data[i];
    const cat = row['__EMPTY_2']; // "Categoría comercial" is __EMPTY_2 based on my previous reading
    if (cat && typeof cat === 'string') {
      categories.add(cat.trim().toUpperCase());
    }
  }

  console.log('Distinct Categories in Excel:');
  console.log(Array.from(categories).sort());
}

main();
