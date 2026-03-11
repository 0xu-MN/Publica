const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');

const urlMatch = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

async function check() {
  const url = urlMatch[1].trim() + '/rest/v1/grants?select=title,grant_type,is_active&order=deadline_date.asc.nullsfirst';
  const key = keyMatch[1].trim();
  
  const res = await fetch(url, {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const data = await res.json();
  const subsidies = data.filter(d => d.grant_type === 'subsidy');
  console.log('Total grants fetched:', data.length);
  console.log('Total subsidies:', subsidies.length);
  console.log('Active subsidies:', subsidies.filter(s => s.is_active !== false).length);
}

check();
