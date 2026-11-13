// BhoomiBandhu 2.0 - Mental Health & Clinical Referral Test Suite
const assert = require('assert');
const db = require('./db');

async function runMentalHealthTests() {
  console.log('\n🧠 Testing BhoomiBandhu 2.0 Farmer Mental Health & Referral Engine...\n');

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

  // 1. Verified Helplines Directory
  test('Directory: Retrieves official Tele MANAS (14416) and national helplines', () => {
    const res = db.getVerifiedMentalHealthResources('Madhya Pradesh', 'Sehore');
    assert(res.national_helplines, 'National helplines must be present');
    const teleManas = res.national_helplines.find(h => h.number === '14416');
    assert(teleManas, 'Tele MANAS 14416 must be verified and present');
    assert.strictEqual(teleManas.availability, '24 Hours × 7 Days');
    assert(teleManas.languages.includes('Hindi'));

    const kisanHelpline = res.national_helplines.find(h => h.number === '1800-180-1551');
    assert(kisanHelpline, 'Kisan Call Centre 1800-180-1551 must be present');
  });

  // 2. State & District DMHP Resolution
  test('District Referral: Correctly maps Sehore district to Civil Hospital DMHP unit', () => {
    const res = db.getVerifiedMentalHealthResources('Madhya Pradesh', 'Sehore');
    assert(res.assigned_local_hospital.includes('Civil Hospital Sehore'), `Expected Civil Hospital Sehore, got: ${res.assigned_local_hospital}`);
    assert(res.opd_timings, 'OPD timings must be specified');
  });

  test('District Referral: Correctly maps Yavatmal district in Maharashtra to Prerna Project DMHP unit', () => {
    const res = db.getVerifiedMentalHealthResources('Maharashtra', 'Yavatmal');
    assert(res.assigned_local_hospital.includes('Yavatmal'), `Expected Yavatmal, got: ${res.assigned_local_hospital}`);
  });

  // 3. Emergency Crisis Protocol
  await testAsync('Crisis Pathway: High distress level activates urgent crisis protocol with Tele MANAS guidance', async () => {
    const crisisRecord = await db.createMentalHealthRequest({
      patient_alias: 'Distressed Farmer',
      mobile: '9876541111',
      state: 'Punjab',
      district: 'Bathinda',
      preferred_language: 'Punjabi',
      primary_concern: 'Acute Debt Crisis & Severe Hopelessness',
      distress_level: 'Severe / Crisis (Needs Immediate Help)',
      referral_type: 'crisis_helpline',
      privacy_level: 'Confidential'
    });

    assert(crisisRecord.request_token.startsWith('MHR-2026'), 'Token must have MHR-2026 prefix');
    assert.strictEqual(crisisRecord.status, 'Urgent Crisis Protocol Activated');
    assert(crisisRecord.notes.includes('14416'), 'Notes must direct to Tele MANAS 14416');
    assert.strictEqual(crisisRecord.emergency_helplines.tele_manas, '14416');
  });

  // 4. Anonymous Mode Privacy Control
  await testAsync('Privacy Controls: Anonymous mode strips mobile number and protects farmer identity', async () => {
    const anonRecord = await db.createMentalHealthRequest({
      patient_alias: 'Secret',
      mobile: '9899999999',
      state: 'Uttar Pradesh',
      district: 'Varanasi',
      primary_concern: 'Crop Failure Anxiety',
      distress_level: 'Moderate Distress',
      referral_type: 'dmhp_hospital',
      privacy_level: 'Anonymous'
    });

    assert.strictEqual(anonRecord.privacy_level, 'Anonymous');
    assert.strictEqual(anonRecord.mobile, null, 'Mobile must be null in anonymous mode');
    assert(anonRecord.patient_alias.includes('Anonymous Farmer'), 'Alias must be marked anonymous');
    assert(anonRecord.request_token, 'Token must still be issued for referral slip');
  });

  // 5. Genuine Referral Workflow - Never Promise Callback for DMHP Hospital Slip
  await testAsync('Referral Workflow: District hospital slip clearly states OPD hours without false callback promise', async () => {
    const dmhpRecord = await db.createMentalHealthRequest({
      patient_alias: 'Balwant Singh',
      mobile: '9876500002',
      state: 'Punjab',
      district: 'Ludhiana',
      primary_concern: 'Post-Harvest Loss Stress',
      distress_level: 'Mild / Seeking Counseling',
      referral_type: 'dmhp_hospital',
      privacy_level: 'Confidential'
    });

    assert.strictEqual(dmhpRecord.status, 'District DMHP Referral Slip Issued');
    assert(!dmhpRecord.notes.includes('will contact you soon'), 'Must not make false promises of callback');
    assert(dmhpRecord.assigned_facility.includes('Civil Hospital Ludhiana'), 'Assigned facility must be mapped');
  });

  // 6. Tracking Referral by Token & Mobile
  await testAsync('Tracking: Query by Token or mobile returns referral records', async () => {
    const byToken = await db.findMentalHealthRequests('MHR-2026-10492');
    assert(byToken.length > 0, 'Should find seeded Ramesh Patel referral');
    assert.strictEqual(byToken[0].request_token, 'MHR-2026-10492');

    const byMobile = await db.findMentalHealthRequests('9823456789');
    assert(byMobile.length > 0, 'Should find referral by mobile number');
  });

  // 7. mental-health.html UI & Script Integrity
  test('HTML Portal: Verifies crisis pathway, privacy controls, backend APIs, and honest callback policies in mental-health.html', () => {
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'mental-health.html');
    assert(fs.existsSync(htmlPath), 'mental-health.html must exist');
    const content = fs.readFileSync(htmlPath, 'utf8');

    // Crisis banner & helplines
    assert(content.includes('crisis-emergency-banner'), 'Crisis emergency banner must be present');
    assert(content.includes('14416'), 'Tele MANAS 14416 must be present');
    assert(content.includes('tel:112'), 'Emergency 112 must be present');
    assert(content.includes('1800-180-1551'), 'Kisan helpline 1800-180-1551 must be present');

    // Privacy controls & explanation
    assert(content.includes('privacy-shield-box'), 'Privacy explanation shield box must be present');
    assert(content.includes('chkAnonymous'), 'Anonymous mode checkbox must be present');
    assert(content.includes('toggleAnonymousMode'), 'toggleAnonymousMode function must be defined');

    // Form & backend API hooks
    assert(content.includes('mentalHealthForm'), 'Mental health form must be present');
    assert(content.includes('/api/mental-health/request'), 'Must submit to /api/mental-health/request');
    assert(content.includes('/api/mental-health/resources'), 'Must query /api/mental-health/resources');
    assert(content.includes('/api/mental-health/track/'), 'Must query /api/mental-health/track/');

    // Honest callback policies & safe rendering
    assert(!content.includes('counsellor will call you within'), 'Must not make unbacked callback promises');
    assert(content.includes('Our Honest Support Commitment'), 'Must state honest support commitment');
    assert(content.includes('escapeHtml'), 'Must have escapeHtml helper for safe slip rendering');
    assert(content.includes('auth-nav.js'), 'Must include auth-nav.js for header authentication');
  });

  console.log(`\n======================================================`);
  console.log(`✨ ALL MENTAL HEALTH TESTS COMPLETED: ${passed} / ${total} tests passed!`);
  console.log(`======================================================\n`);

  if (passed !== total) {
    process.exit(1);
  }
}

if (require.main === module) {
  runMentalHealthTests().catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runMentalHealthTests };
