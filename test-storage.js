// BhoomiBandhu 2.0 - Storage Marketplace Engine & Subsidy Test Suite
const assert = require('assert');
const db = require('./db');

async function runStorageTests() {
  console.log('\n🏬 Testing BhoomiBandhu 2.0 Storage Marketplace & Booking Engine...\n');

  let passed = 0;
  let total = 0;

  function test(desc, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } catch (e) {
      console.error(`❌ [FAIL] ${desc}`);
      console.error('   ', e.message);
    }
  }

  async function testAsync(desc, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } catch (e) {
      console.error(`❌ [FAIL] ${desc}`);
      console.error('   ', e.message);
    }
  }

  // 1. Seed & List Storage Facilities
  await testAsync('Marketplace: Lists verified storage facilities across states', async () => {
    const facilities = await db.listStorageFacilities();
    assert(Array.isArray(facilities), 'Facilities should be an array');
    assert(facilities.length >= 6, `Expected at least 6 facilities, found ${facilities.length}`);
    const coldHub = facilities.find(f => f.id === 'STG-FAC-001');
    assert(coldHub, 'Kisan Cold Chain facility should exist');
    assert.strictEqual(coldHub.state, 'Uttar Pradesh');
    assert(coldHub.available_capacity_mt > 0, 'Available capacity should be positive');
  });

  // 2. Filter facilities by state & crop
  await testAsync('Marketplace Filter: Filters facilities by state & crop suitability', async () => {
    const upFacilities = await db.listStorageFacilities({ state: 'Uttar Pradesh' });
    assert(upFacilities.length >= 2, 'UP should have at least 2 facilities');

    const appleFacilities = await db.listStorageFacilities({ crop: 'apple' });
    assert(appleFacilities.length >= 2, 'Should find facilities suitable for apple storage');
  });

  // 3. Scheme Subsidy Verification - PMKSY Cold Chain (Eligible)
  test('Subsidy Verification: PMKSY Cold Chain correctly calculates 35% subsidy for small farmer', () => {
    const res = db.verifyStorageSubsidy({
      scheme_code: 'PMKSY_COLD_CHAIN',
      farmer_category: 'small_marginal',
      crop_name: 'Potato',
      facility_type: 'Cold Storage',
      quantity_kg: 5000,
      duration_months: 3,
      base_rate_per_kg: 1.85
    });

    assert.strictEqual(res.is_eligible, true);
    assert.strictEqual(res.subsidy_percentage, 35.0);
    assert(res.subsidy_rate_per_kg > 0);
    assert(res.estimated_subsidy_amount > 0);
    assert(res.verification_code.startsWith('SUB-2026-PMKSY'));
  });

  // 4. Scheme Subsidy Verification - Ineligible Mismatch (Grain under Cold Chain)
  test('Subsidy Verification: Flags mismatch when requesting PMKSY Cold Chain for dry wheat', () => {
    const res = db.verifyStorageSubsidy({
      scheme_code: 'PMKSY_COLD_CHAIN',
      farmer_category: 'general',
      crop_name: 'Wheat',
      facility_type: 'Grain Warehouse',
      quantity_kg: 2000,
      duration_months: 4,
      base_rate_per_kg: 1.15
    });

    assert.strictEqual(res.is_eligible, false);
    assert.strictEqual(res.subsidy_percentage, 0);
    assert(res.criteria_met.some(c => c.includes('Scheme Mismatch')));
  });

  // 5. Scheme Subsidy Verification - Gramin Bhandaran (Eligible)
  test('Subsidy Verification: Gramin Bhandaran 33.33% subsidy for small farmers on grain storage', () => {
    const res = db.verifyStorageSubsidy({
      scheme_code: 'GRAMIN_BHANDARAN',
      farmer_category: 'small_marginal',
      crop_name: 'Paddy',
      facility_type: 'Grain Warehouse',
      quantity_kg: 4000,
      duration_months: 3,
      base_rate_per_kg: 1.15
    });

    assert.strictEqual(res.is_eligible, true);
    assert.strictEqual(res.subsidy_percentage, 33.33);
    assert(res.verification_code.startsWith('SUB-2026-GBY'));
  });

  // 6. Create Storage Booking Request
  let testBooking = null;
  await testAsync('Booking Engine: Creates booking with unique ID, verified price breakdown and capacity deduction', async () => {
    const facBefore = await db.getStorageFacilityById('STG-FAC-001');
    const capBefore = facBefore.available_capacity_mt;

    testBooking = await db.createStorageBooking({
      facility_id: 'STG-FAC-001',
      farmer_name: 'Devendra Verma',
      mobile: '9891234567',
      farmer_state: 'Uttar Pradesh',
      farmer_district: 'Varanasi',
      crop_name: 'Potato (Jyoti)',
      quantity_kg: 2000, // 2 MT
      quantity_quintals: 20,
      duration_months: 3,
      intake_date: '2026-11-25',
      scheme_applied: 'PMKSY_COLD_CHAIN',
      farmer_category: 'small_marginal',
      payment_mode: 'UPI',
      advance_paid: true
    });

    assert(testBooking, 'Booking record should be created');
    assert(testBooking.booking_id.startsWith('STG-2026'), `Booking ID should have STG-2026 prefix: ${testBooking.booking_id}`);
    assert.strictEqual(testBooking.farmer_name, 'Devendra Verma');
    assert(testBooking.pricing_breakdown, 'Pricing breakdown must be calculated');
    assert(testBooking.pricing_breakdown.gross_base_amount > 0, 'Gross base amount must be > 0');
    assert(testBooking.pricing_breakdown.net_payable > 0, 'Net payable must be > 0');
    assert(testBooking.pricing_breakdown.advance_required > 0, 'Advance token must be > 0');
    assert.strictEqual(testBooking.booking_status, 'Pending Provider Confirmation');

    // Check capacity deduction
    const facAfter = await db.getStorageFacilityById('STG-FAC-001');
    assert(facAfter.available_capacity_mt <= capBefore - 2, 'Available capacity should decrease by 2 MT');
  });

  // 7. Track Booking by Booking ID & Mobile
  await testAsync('Tracking: Query by Booking ID or mobile returns booking details', async () => {
    const byId = await db.findStorageBookings(testBooking.booking_id);
    assert(byId.length > 0, 'Should find booking by booking ID');
    assert.strictEqual(byId[0].booking_id, testBooking.booking_id);

    const byMobile = await db.findStorageBookings('9891234567');
    assert(byMobile.length > 0, 'Should find booking by mobile');
    assert.strictEqual(byMobile[0].farmer_name, 'Devendra Verma');
  });

  // 8. Provider-Side Management: Confirm Booking
  await testAsync('Provider Management: Updates booking status to Confirmed & records notes', async () => {
    const updated = await db.updateStorageBookingStatus(testBooking.booking_id, 'Confirmed - Space Allocated', 'Space reserved in Cold Chamber #3.');
    assert(updated, 'Status update should return record');
    assert.strictEqual(updated.booking_status, 'Confirmed - Space Allocated');
    assert.strictEqual(updated.provider_notes, 'Space reserved in Cold Chamber #3.');
  });

  // 9. Provider-Side Management: Update Facility Available Capacity & Base Rate
  await testAsync('Provider Facility Update: Adjusts available capacity and base rates', async () => {
    const updatedFac = await db.updateStorageFacility('STG-FAC-001', {
      available_capacity_mt: 410,
      base_rate_per_kg_month: 1.90
    });
    assert(updatedFac, 'Facility update should return object');
    assert.strictEqual(updatedFac.available_capacity_mt, 410);
    assert.strictEqual(updatedFac.base_rate_per_kg_month, 1.90);
  });

  console.log(`\n======================================================`);
  console.log(`✨ ALL STORAGE TESTS COMPLETED: ${passed} / ${total} tests passed!`);
  console.log(`======================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runStorageTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runStorageTests };
