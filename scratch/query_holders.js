const fs = require('fs');
let env = '';
try {
  env = fs.readFileSync('.env.local', 'utf8');
} catch (e) {
  try {
    env = fs.readFileSync('.env', 'utf8');
  } catch (e2) {}
}

const getEnv = (k) => {
  const m = env.match(new RegExp(k + '=(.*)'));
  return m ? m[1].trim().replace(/^['"]|['"]$/g, '') : '';
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY') || getEnv('SUPABASE_SECRET_KEY') || getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

fetch(url + '/rest/v1/exposure_positions?select=id,company_id,holder_id,exposure_type,status,last_verified_date,verified_by', {
  headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
})
.then(r => r.json())
.then(positions => {
  console.log('POSITIONS_COUNT:', positions.length);
  console.log('POSITIONS_SAMPLE:', JSON.stringify(positions.slice(0, 10), null, 2));

  return fetch(url + '/rest/v1/master_ledger_status?select=*', {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
})
.then(r => r.json())
.then(status => {
  console.log('MASTER_LEDGER_STATUS:', JSON.stringify(status, null, 2));
})
.catch(e => console.error(e));
