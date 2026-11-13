// BhoomiBandhu 2.0 - Comprehensive Financial & KCC Planning Engine Test Suite
const assert = require('assert');
const db = require('./db');

async function runFinancialTests() {
  console.log('\n💰 Testing BhoomiBandhu 2.0 Financial Support & KCC System...\n');

  let passed = 0;
  let total = 0;

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

  let createdDossier = null;

  // 1. KCC Scale of Finance Calculation & Persistence
  await testAsync('Financial Pre-Screen: KCC Scale of Finance limit calculation & persistence', async () => {
    const acres = 4.0;
    const baseScale = 40000;
    const estimatedLimit = Math.round(acres * baseScale * 1.30); // 208,000

    const record = await db.createFinancialInquiry({
      farmer_name: 'Gurpreet Singh',
      mobile: '9876511111',
      state: 'Punjab',
      district: 'Patiala',
      village: 'Nabha',
      landholding_acres: acres,
      primary_crop: 'Wheat & Mustard',
      annual_income: 420000,
      loan_purpose: 'Kisan Credit Card (Crop Loan)',
      requested_amount: estimatedLimit,
      estimated_kcc_limit: estimatedLimit,
      eligible_subvention_rate: '4.0% (3% PRI Subvention)',
      readiness_score: '96% (Bank Ready)',
      target_bank: 'State Bank of India (YONO Krishi)'
    });

    assert(record.dossier_id && record.dossier_id.startsWith('BB-FIN-2026-'), 'Dossier ID prefix');
    assert.strictEqual(record.farmer_name, 'Gurpreet Singh');
    assert.strictEqual(Number(record.estimated_kcc_limit), 208000);
    assert.strictEqual(record.target_bank, 'State Bank of India (YONO Krishi)');
    assert(record.status, 'Record has status');
    createdDossier = record;
  });

  // 2. Lookup by Dossier ID
  await testAsync('Financial Tracking: Query by Dossier ID returns exact matched dossier', async () => {
    const list = await db.findFinancialInquiries(createdDossier.dossier_id);
    assert(list && list.length >= 1, 'Found dossier');
    const matched = list.find(d => d.dossier_id === createdDossier.dossier_id);
    assert(matched, 'Exact dossier ID match');
    assert.strictEqual(matched.farmer_name, 'Gurpreet Singh');
    assert.strictEqual(matched.primary_crop, 'Wheat & Mustard');
  });

  // 3. Lookup by Mobile Number
  await testAsync('Financial Tracking: Query by 10-digit mobile number returns farmer dossiers', async () => {
    const list = await db.findFinancialInquiries('9876511111');
    assert(list && list.length >= 1, 'Found farmer dossiers');
    assert.strictEqual(list[0].mobile, '9876511111');
  });

  // 4. Default Seed Records Verification
  await testAsync('Seed Data: Default demo dossiers (Ramesh Patel SBI KCC) exist', async () => {
    const list = await db.findFinancialInquiries('BB-FIN-2026-38291');
    assert(list && list.length >= 1, 'Default demo record exists');
    assert.strictEqual(list[0].farmer_name, 'Ramesh Patel');
    assert.strictEqual(list[0].target_bank, 'State Bank of India (YONO Krishi)');
  });

  // 5. Non-Existent Query Handling
  await testAsync('Financial Tracking: Non-existent dossier ID returns empty array without throwing', async () => {
    const list = await db.findFinancialInquiries('BB-FIN-NON-EXISTENT-99999');
    assert(Array.isArray(list), 'Is array');
    assert.strictEqual(list.length, 0);
  });

  console.log('\n======================================================');
  console.log(`✨ ALL FINANCIAL TESTS COMPLETED: ${passed} / ${total} tests passed!`);
  console.log('======================================================\n');
}

runFinancialTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
