import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { menuItems } from '../src/data';

dotenv.config();

const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
let cleanUrl = rawUrl.replace(/^VITE_/, '').replace(/\/rest\/v1\/?$/, '');
let cleanKey = rawKey.replace(/^VITE_/, '');

const supabase = createClient(cleanUrl, cleanKey);

async function sync() {
  console.log("Fetching all db items...");
  const { data: dbItems, error } = await supabase.from('menu_items').select('*');
  if (error) {
    console.error("Fetch err:", error);
    return;
  }
  
  if (!dbItems) return;
  console.log(`Fetched ${dbItems.length} items from DB`);

  for (const local of menuItems) {
    // find best match in DB
    const match = dbItems.find(db => 
       db.title?.toLowerCase() === local.name.toLowerCase() || 
       db.name?.toLowerCase() === local.name.toLowerCase() ||
       db.title?.toLowerCase().includes(local.name.toLowerCase()) || 
       local.name.toLowerCase().includes(db.title?.toLowerCase() || 'XXXYYYZZZ')
    );
    
    if (match) {
        // Only update if description differs
        if (match.description !== local.description) {
            console.log(`Updating ${match.title} => ${local.description.substring(0,30)}...`);
            const { error: updErr, data } = await supabase.from('menu_items')
              .update({ description: local.description })
              .eq('id', match.id)
              .select();
              
            if (updErr || !data || data.length === 0) {
               console.error(`Failed to update ${match.title}:`, updErr || "RLS Blocked / Not Found");
            } else {
               console.log(`Success: ${match.title}`);
            }
        }
    } else {
        console.log(`No match in DB for ${local.name}`);
    }
  }
}

sync();
