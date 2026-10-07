import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLES = [
  'prospects',
  'activities',
  'contacts',
  'tasks',
  'opportunities',
  'profiles',
  'trips',
  'trip_stops',
  'interaction_threads',
  'interaction_events'
];

async function fetchAll(table: string) {
  let allData: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .range(from, from + step - 1);

    if (error) {
      // 42P01 is undefined table in postgres
      if (error.code === '42P01') {
        console.warn(`Table ${table} does not exist, skipping.`);
        return [];
      }
      console.error(`Error fetching from ${table}:`, error);
      throw error;
    }

    if (data && data.length > 0) {
      allData = allData.concat(data);
      from += step;
      if (data.length < step) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  return allData;
}

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups', `backup_${timestamp}`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  console.log(`Starting backup to ${backupDir}...`);

  for (const table of TABLES) {
    console.log(`Backing up ${table}...`);
    try {
      const data = await fetchAll(table);
      if (data.length > 0) {
        fs.writeFileSync(
          path.join(backupDir, `${table}.json`),
          JSON.stringify(data, null, 2)
        );
        console.log(`  -> Saved ${data.length} records for ${table}`);
      } else {
        console.log(`  -> Table ${table} is empty or doesn't exist`);
      }
    } catch (e) {
      console.error(`  -> Failed to backup ${table}`);
    }
  }

  console.log('\nBackup completed successfully!');
  console.log(`Files saved in: ${backupDir}`);
}

runBackup();
