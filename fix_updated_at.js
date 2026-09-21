const { createClient } = require('@supabase/supabase-js'); 
const fs = require('fs'); 
const env = fs.readFileSync('.env.local', 'utf8'); 
const sb = createClient(
  env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)[1].trim(), 
  env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)[1].trim()
); 

async function run() { 
  console.log('Fetching prospects...');
  const { data: p } = await sb.from('prospects').select('id, created_at, updated_at'); 
  let count = 0;
  
  const toUpdate = [];
  for (const row of p) { 
    if (row.updated_at.startsWith('2026-09-21T02:')) { 
      toUpdate.push({ id: row.id, created_at: row.created_at });
    } 
  } 
  
  console.log('Need to reset ' + toUpdate.length + ' prospects');
  const batchSize = 50;
  for (let i = 0; i < toUpdate.length; i += batchSize) {
    const batch = toUpdate.slice(i, i + batchSize);
    await Promise.all(batch.map(row => sb.from('prospects').update({ updated_at: row.created_at }).eq('id', row.id)));
    console.log(`Processed ${i + batch.length}/${toUpdate.length}`);
  }
  
  console.log('Now bumping prospects with real activity today...');
  const today = new Date().toISOString().split('T')[0]; 
  const { data: acts } = await sb.from('activities').select('prospect_id').gte('created_at', today); 
  const { data: tasks } = await sb.from('tasks').select('prospect_id').gte('created_at', today); 
  const { data: comments } = await sb.from('comments').select('prospect_id').gte('created_at', today); 
  
  const ids = [...new Set([
    ...(acts||[]).map(t=>t.prospect_id),
    ...(tasks||[]).map(t=>t.prospect_id),
    ...(comments||[]).map(t=>t.prospect_id)
  ])]; 
  
  if (ids.length > 0) { 
    await sb.from('prospects').update({ updated_at: new Date().toISOString() }).in('id', ids); 
    console.log('Bumped real activity for ' + ids.length + ' prospects'); 
  }
} 
run();
