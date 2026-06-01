import fs from 'fs';
const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

async function run() {
  const tables = ['budget_cameras', 'budget_lenses', 'budget_drones', 'budget_communication', 'budget_movement'];
  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?limit=1`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
      });
      if (res.status === 200) {
        const data = await res.json();
        console.log(`${table}:`, Object.keys(data[0] || {}));
      } else {
        const error = await res.json();
        console.log(`${table}: MISSING OR ERROR -`, error.message);
      }
    } catch (e) {
      console.log(`${table}: ERROR -`, e.message);
    }
  }
}
run();
