import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function seed() {
  console.log('🌱 Starting database seed via REST API (bypassing RLS with user session)...');
  
  // 1. Create or login a dummy user to act as our admin
  const email = 'test_seed_user_2@example.com';
  const password = 'Password123!';
  
  // Try sign in first
  let { data: { session }, error: signError } = await supabase.auth.signInWithPassword({
    email, password
  });

  if (signError) {
    // If sign in fails, try sign up
    const { data, error } = await supabase.auth.signUp({
      email, password
    });
    if (error) {
      console.error('Failed to create/login seed user:', error);
      process.exit(1);
    }
    session = data.session;
  }

  if (!session) {
    console.error('No session obtained for seed user. Email confirmation might be required.');
    process.exit(1);
  }

  const adminUserId = session.user.id;
  console.log(`✅ Authenticated as seed user: ${adminUserId}`);

  try {
    // 1. Seed UOMs
    console.log('Seeding UOMs...');
    const uoms = [
      { uom_code: 'PCS', description: 'Pieces', is_base_uom: true, created_by: adminUserId },
      { uom_code: 'BOX', description: 'Boxes', is_base_uom: false, created_by: adminUserId },
      { uom_code: 'KG', description: 'Kilograms', is_base_uom: true, created_by: adminUserId },
      { uom_code: 'L', description: 'Liters', is_base_uom: true, created_by: adminUserId },
      { uom_code: 'M', description: 'Meters', is_base_uom: true, created_by: adminUserId }
    ];
    
    // We cannot easily do ON CONFLICT DO NOTHING with insert() via REST for existing items without knowing constraints,
    // so we'll select first or just ignore errors.
    const { data: existingUoms } = await supabase.from('uom').select('uom_code');
    const existingUomCodes = new Set(existingUoms?.map(u => u.uom_code));
    
    const uomsToInsert = uoms.filter(u => !existingUomCodes.has(u.uom_code));
    if (uomsToInsert.length > 0) {
      await supabase.from('uom').insert(uomsToInsert);
    }

    // 2. Seed Departments
    console.log('Seeding Departments...');
    const depts = [
      { dept_code: 'ADMIN', dept_name: 'Administration' },
      { dept_code: 'MAT', dept_name: 'Material Management' },
      { dept_code: 'MAINT', dept_name: 'Maintenance' },
      { dept_code: 'PROD', dept_name: 'Production' }
    ];
    
    const deptIds: Record<string, string> = {};
    for (const dept of depts) {
      const { data } = await supabase.from('departments').select('dept_id').eq('dept_code', dept.dept_code).single();
      if (data) {
        deptIds[dept.dept_code] = data.dept_id;
      } else {
        const { data: newData, error } = await supabase.from('departments').insert(dept).select('dept_id').single();
        if (newData) deptIds[dept.dept_code] = newData.dept_id;
      }
    }

    // 3. Seed Categories
    console.log('Seeding Categories...');
    const catNames = ['Electronics', 'Hardware', 'Raw Materials', 'Office Supplies', 'Safety Equipment'];
    const catIds: string[] = [];
    
    for (const name of catNames) {
      const catCode = name.substring(0, 3).toUpperCase() + '-' + faker.string.numeric(3);
      const { data, error } = await supabase.from('categories').insert({
        category_code: catCode,
        category_name: name,
        description: name + ' category'
      }).select('category_id').single();
      if (data) {
        catIds.push(data.category_id);
      } else if (error) {
        console.error(`Error inserting category ${name}:`, error.message);
        // Try fetching existing
        const { data: existingData } = await supabase.from('categories').select('category_id').eq('category_name', name).single();
        if (existingData) catIds.push(existingData.category_id);
      }
    }

    // 4. Seed Locations
    console.log('Seeding Locations...');
    const locIds: string[] = [];
    for (let i = 1; i <= 5; i++) {
      const locCode = `WH-0${i}`;
      const { data } = await supabase.from('locations').select('location_id').eq('location_code', locCode).single();
      if (data) {
        locIds.push(data.location_id);
      } else {
        const { data: newData } = await supabase.from('locations').insert({
          location_code: locCode,
          location_name: `Warehouse 0${i}`,
          address: faker.location.streetAddress()
        }).select('location_id').single();
        if (newData) locIds.push(newData.location_id);
      }
    }

    // 5. Seed Vendors
    console.log('Seeding Vendors...');
    const vendorIds: string[] = [];
    for (let i = 0; i < 50; i++) {
      const vendorCode = 'VEN-' + faker.string.alphanumeric(6).toUpperCase();
      const vendorName = faker.company.name().substring(0, 45) + ' ' + faker.string.alphanumeric(4);
      const { data, error } = await supabase.from('vendors').insert({
        vendor_code: vendorCode,
        vendor_name: vendorName,
        is_active: true
      }).select('vendor_id').single();
      if (data) vendorIds.push(data.vendor_id);
      if (error) {
        console.error('Error inserting vendor:', error.message);
        // Try fetching existing
        const { data: existingData } = await supabase.from('vendors').select('vendor_id').eq('vendor_code', vendorCode).single();
        if (existingData) vendorIds.push(existingData.vendor_id);
      }
    }

    // 6. Seed Items
    console.log('Seeding Items...');
    const itemIds: string[] = [];
    for (let i = 0; i < 100; i++) {
      const itemCode = 'ITM-' + faker.string.alphanumeric(8).toUpperCase();
      const name = faker.commerce.productName() + ' ' + faker.string.alphanumeric(4);
      const catId = faker.helpers.arrayElement(catIds);
      const uomCode = faker.helpers.arrayElement(uoms).uom_code;
      const isShared = faker.datatype.boolean(); // 50% chance of being shared (null)
      const deptId = isShared ? null : faker.helpers.arrayElement(Object.values(deptIds));
      
      const { data, error } = await supabase.from('items').insert({
        item_code: itemCode,
        name_en: name,
        name_th: name + ' (TH)',
        description: faker.commerce.productDescription(),
        category_id: catId,
        base_uom: uomCode,
        department_id: deptId,
        unit_cost: parseFloat(faker.commerce.price()),
        reorder_level: faker.number.int({ min: 10, max: 100 }),
        created_by: adminUserId,
        is_active: true
      }).select('item_id').single();
      
      if (data) itemIds.push(data.item_id);
      if (error) {
        console.error('Error inserting item:', error.message);
        // Try fetching existing
        const { data: existingData } = await supabase.from('items').select('item_id').eq('item_code', itemCode).single();
        if (existingData) itemIds.push(existingData.item_id);
      }
    }

    // 7. Seed Transactions & Inventory Status
    console.log('Seeding Transactions...');
    for (let i = 0; i < 200; i++) {
      const isReceive = faker.datatype.boolean();
      const tType = isReceive ? 'RECEIVE' : 'ISSUE';
      const itemId = faker.helpers.arrayElement(itemIds);
      const deptId = faker.helpers.arrayElement(Object.values(deptIds));
      
      if (!itemId || !deptId) continue;

      const refNum = 'REF-' + faker.string.alphanumeric(8).toUpperCase();

      const { data: tHeader, error: tError } = await supabase.from('transactions').insert({
        transaction_type: tType,
        transaction_date: faker.date.recent({ days: 30 }).toISOString(),
        department_id: deptId,
        reference_number: refNum,
        status: 'COMPLETED',
        created_by: adminUserId
      }).select('transaction_id').single();
      
      if (tHeader) {
        const qty = faker.number.int({ min: 1, max: 50 });
        const locId = locIds.length > 0 ? faker.helpers.arrayElement(locIds) : undefined;
        
        await supabase.from('transaction_lines').insert({
          transaction_id: tHeader.transaction_id,
          item_id: itemId,
          location_id: locId,
          quantity: qty,
          unit_cost: parseFloat(faker.commerce.price())
        });
      } else {
        console.error('Error inserting transaction:', tError?.message);
      }
    }

    console.log('✅ Seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
  }
}

seed().catch(console.error);
