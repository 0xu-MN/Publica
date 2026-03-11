const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');

const urlMatch = env.match(/EXPO_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/EXPO_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

async function check() {
  const url = urlMatch[1].trim() + '/rest/v1/grants?select=title,grant_type,is_active,deadline_date&grant_type=eq.subsidy&is_active=eq.true&limit=5';
  const key = keyMatch[1].trim();

  const res = await fetch(url, {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const data = await res.json();
  console.log('Subsidy Grants:', JSON.stringify(data, null, 2));
}

check();
