// Discrepancy Report Generator: legacy companies columns vs company_investment_summary view
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

async function runDiscrepancyReport() {
  if (!url || !key) {
    console.error('Supabase URL or Key missing in env');
    return;
  }

  try {
    const [companiesRes, summaryRes] = await Promise.all([
      fetch(`${url}/rest/v1/companies?select=id,name,amount_invested,currency,instrument_type,investment_date`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
      }).then(r => r.json()),
      fetch(`${url}/rest/v1/company_investment_summary?select=company_id,amount_invested,currency,instrument_type,investment_date`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
      }).then(r => r.json())
    ]);

    const summaryMap = new Map((summaryRes || []).map(s => [s.company_id, s]));
    const discrepancies = [];

    for (const comp of (companiesRes || [])) {
      const summary = summaryMap.get(comp.id) || {};
      const diffs = [];

      if (Number(comp.amount_invested || 0) !== Number(summary.amount_invested || 0)) {
        diffs.push(`amount_invested: legacy(${comp.amount_invested}) vs view(${summary.amount_invested})`);
      }
      if ((comp.currency || 'USD') !== (summary.currency || 'USD')) {
        diffs.push(`currency: legacy(${comp.currency}) vs view(${summary.currency})`);
      }
      if ((comp.instrument_type || '') !== (summary.instrument_type || '')) {
        diffs.push(`instrument_type: legacy(${comp.instrument_type}) vs view(${summary.instrument_type})`);
      }
      if ((comp.investment_date || '') !== (summary.investment_date || '')) {
        diffs.push(`investment_date: legacy(${comp.investment_date}) vs view(${summary.investment_date})`);
      }

      if (diffs.length > 0) {
        discrepancies.push({
          company_id: comp.id,
          name: comp.name,
          diffs
        });
      }
    }

    console.log('=== COMPANY INVESTMENT DISCREPANCY REPORT ===');
    console.log(`Total Companies Audited: ${(companiesRes || []).length}`);
    console.log(`Discrepancy Count: ${discrepancies.length}`);
    console.log(JSON.stringify(discrepancies, null, 2));

  } catch (err) {
    console.error('Failed to run discrepancy report:', err);
  }
}

runDiscrepancyReport();
