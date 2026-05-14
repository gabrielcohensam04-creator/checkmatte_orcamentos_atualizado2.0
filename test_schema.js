import fs from 'fs';
const env = fs.readFileSync('.env', 'utf-8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];

async function run() {
  const res = await fetch(`${url}/rest/v1/budgets?limit=1`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await res.json();
  console.log('budgets:', Object.keys(data[0] || {}));

  const res2 = await fetch(`${url}/rest/v1/budget_equipment?limit=1`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data2 = await res2.json();
  console.log('budget_equipment:', Object.keys(data2[0] || {}));
}
run();
