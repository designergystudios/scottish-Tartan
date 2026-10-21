import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const rawKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
let cleanUrl = rawUrl.replace(/^VITE_/, '').replace(/\/rest\/v1\/?$/, '');
let cleanKey = rawKey.replace(/^VITE_/, '');

const supabase = createClient(cleanUrl, cleanKey);

async function check() {
  const { data, error } = await supabase.from('menu_items').select('title, description').limit(10);
  console.log("Error:", error);
  console.log("Data:");
  data?.forEach(d => console.log(d.title, "=>", d.description));
}

check();
