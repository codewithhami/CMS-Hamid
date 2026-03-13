
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase.from('vendors').select(`
    id, name,
    vendor_orders (
      id,
      vendor_order_parts (id, total_bill, stitches, rate, head, repeat_count)
    ),
    vendor_payments (id, advance_payment)
  `);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Vendors found:', data.length);
    data.forEach(v => {
      console.log(`Vendor: ${v.name}`);
      console.log(`  Orders: ${v.vendor_orders?.length || 0}`);
      let vTotal = 0;
      v.vendor_orders?.forEach(o => {
          o.vendor_order_parts?.forEach(p => {
              vTotal += p.total_bill || 0;
              console.log(`    Part Total: ${p.total_bill}, Stitches: ${p.stitches}`);
          });
      });
      console.log(`  Calculated Bill: ${vTotal}`);
    });
  }
}

checkData();
