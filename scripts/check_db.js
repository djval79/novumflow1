import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const parseEnv = () => {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    return envContent.split('\n').reduce((acc, line) => {
      const [key, val] = line.split('=');
      if (key && val) acc[key.trim()] = val.trim();
      return acc;
    }, {});
  } catch (e) {
    return {};
  }
};

const env = parseEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

console.log("Connecting to Supabase...");
const supabase = createClient(url, key);

async function check() {
  try {
    const { count, error } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error("❌ Connection failed:", error.message);
      process.exit(1);
    }

    console.log("✅ Connection successful!");
    console.log(`Found ${count} job postings.`);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  }
}

check();
