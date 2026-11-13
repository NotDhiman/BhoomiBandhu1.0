// BhoomiBandhu 2.0 - Comprehensive Crop Insurance & Claim Engine Test Suite
const assert = require('assert');
const db = require('./db');

async function runInsuranceTests() {
  console.log('\n🛡️  Testing BhoomiBandhu 2.0 PMFBY Insurance & Claim System...\n');

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

  // 1. Rabi Enrollment Calculation & Persistence
  let createdEnrRabi = null;
  await testAsync('Enrollment: Rabi food grain subsidized 1.5% premium & persistence', async () => {
    const acres = 5.0;
    const sumInsured = Math.round(acres * 40000); // 200,000
    const premiumRate = 0.015; // 1.5%
    const farmerPremium = Math.round(sumInsured * premiumRate); // 3,000

    const record = await db.createInsuranceEnrollment({
      farmer_name: 'Balwant Singh',
      mobile: '9876500001',
      aadhaar_last4: '4829',
      state: 'Punjab',
      district: 'Ludhiana',
      village: 'Khanna',
      season: 'Rabi 2026-27',
      crop_name: 'Wheat (PBW 550)',
      area_acres: acres,
      sum_insured: sumInsured,
      farmer_premium: farmerPremium,
      bank_account_last4: '7788',
      ifsc: 'PUNB0123400',
      sowing_date: '2026-11-01',
      land_khasra: 'Khasra 212/4'
    });

    assert(record.application_id && record.application_id.startsWith('BB-ENR-2026-'), 'Application ID prefix');
    assert.strictEqual(record.farmer_name, 'Balwant Singh');
    assert.strictEqual(Number(record.sum_insured), 200000);
    assert.strictEqual(Number(record.farmer_premium), 3000);
    assert(record.status, 'Record has status');
    createdEnrRabi = record;
  });

  // 2. Kharif Enrollment Calculation & Persistence
  let createdEnrKharif = null;
  await testAsync('Enrollment: Kharif food crop subsidized 2.0% premium & persistence', async () => {
    const acres = 3.5;
    const sumInsured = Math.round(acres * 40000); // 140,000
    const premiumRate = 0.02; // 2.0%
    const farmerPremium = Math.round(sumInsured * premiumRate); // 2,800

    const record = await db.createInsuranceEnrollment({
      farmer_name: 'Devendra Meena',
      mobile: '9876500002',
      aadhaar_last4: '9182',
      state: 'Madhya Pradesh',
      district: 'Sehore',
      village: 'Ashta',
      season: 'Kharif 2026',
      crop_name: 'Soybean (JS 20-34)',
      area_acres: acres,
      sum_insured: sumInsured,
      farmer_premium: farmerPremium,
      bank_account_last4: '1122',
      ifsc: 'SBIN0004567',
      sowing_date: '2026-07-15',
      land_khasra: 'Khasra 89/1'
    });

    assert(record.application_id && record.application_id.startsWith('BB-ENR-2026-'));
    assert.strictEqual(Number(record.sum_insured), 140000);
    assert.strictEqual(Number(record.farmer_premium), 2800);
    createdEnrKharif = record;
  });

  // 3. Commercial Crop Premium (5.0%)
  await testAsync('Enrollment: Commercial / Horticultural 5.0% statutory rate', async () => {
    const acres = 4.0;
    const sumInsured = Math.round(acres * 40000); // 160,000
    const premiumRate = 0.05; // 5.0%
    const farmerPremium = Math.round(sumInsured * premiumRate); // 8,000

    const record = await db.createInsuranceEnrollment({
      farmer_name: 'Kisan Cotton Producer',
      mobile: '9876500003',
      crop_name: 'Cotton (BT-2)',
      season: 'Commercial / Horticultural',
      area_acres: acres,
      sum_insured: sumInsured,
      farmer_premium: farmerPremium
    });

    assert.strictEqual(Number(record.sum_insured), 160000);
    assert.strictEqual(Number(record.farmer_premium), 8000);
  });

  // 4. Claim: 72-Hour Timely Intimation (Valid Window)
  let createdClaimValid = null;
  await testAsync('Claim: Timely loss intimation within 72 hours window', async () => {
    // Loss occurred 24 hours ago
    const lossDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const diffHours = (Date.now() - new Date(lossDate).getTime()) / (1000 * 60 * 60);
    const windowStatus = `Within 72 Hours (Valid - ${Math.round(diffHours)}h elapsed)`;

    const record = await db.createCropClaim({
      farmer_name: 'Balwant Singh',
      mobile: '9876500001',
      policy_or_khasra_no: createdEnrRabi.application_id,
      state: 'Punjab',
      district: 'Ludhiana',
      village: 'Khanna',
      crop_name: 'Wheat (PBW 550)',
      affected_area_acres: 4.5,
      calamity_type: 'Hailstorm (ओलावृष्टि)',
      loss_date: lossDate,
      intimation_window_status: windowStatus,
      damage_percentage: 80,
      loss_description: 'Severe hailstorm damaged flowering spikes',
      documents: ['field_photo1.jpg', 'close_up_spike.jpg']
    });

    assert(record.claim_id && record.claim_id.startsWith('BB-CLM-2026-'), 'Claim ID prefix');
    assert(record.intimation_window_status.includes('Within 72 Hours'), 'Window validity');
    assert.strictEqual(Number(record.damage_percentage), 80);
    assert(record.status, 'Record has status');
    createdClaimValid = record;
  });

  // 5. Claim: Late Intimation (> 72 Hours)
  await testAsync('Claim: Late loss intimation (>72 hrs) flagged for special DGC review', async () => {
    // Loss occurred 96 hours ago
    const lossDate = new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString();
    const diffHours = (Date.now() - new Date(lossDate).getTime()) / (1000 * 60 * 60);
    const windowStatus = `Late Intimation (${Math.round(diffHours)}h elapsed - Special review needed)`;

    const record = await db.createCropClaim({
      farmer_name: 'Ramesh Late Submitter',
      mobile: '9876500009',
      crop_name: 'Mustard',
      calamity_type: 'Flash Flood',
      loss_date: lossDate,
      intimation_window_status: windowStatus,
      damage_percentage: 60
    });

    assert(record.claim_id && record.claim_id.startsWith('BB-CLM-2026-'));
    assert(record.intimation_window_status.includes('Late Intimation'), 'Late flag');
  });

  // 6. Status Tracking: Lookup by Application ID
  await testAsync('Tracking: Query by Application ID returns correct enrollment', async () => {
    const res = await db.findInsuranceRecords(createdEnrRabi.application_id);
    assert(res.enrollments && res.enrollments.length >= 1, 'Found enrollment');
    const matched = res.enrollments.find(e => e.application_id === createdEnrRabi.application_id);
    assert(matched, 'Exact ID matched');
    assert.strictEqual(matched.farmer_name, 'Balwant Singh');
    assert.strictEqual(matched.crop_name, 'Wheat (PBW 550)');
  });

  // 7. Status Tracking: Lookup by Claim ID
  await testAsync('Tracking: Query by Claim ID returns correct damage claim', async () => {
    const res = await db.findInsuranceRecords(createdClaimValid.claim_id);
    assert(res.claims && res.claims.length >= 1, 'Found claim');
    const matched = res.claims.find(c => c.claim_id === createdClaimValid.claim_id);
    assert(matched, 'Exact Claim ID matched');
    assert.strictEqual(matched.farmer_name, 'Balwant Singh');
    assert.strictEqual(matched.calamity_type, 'Hailstorm (ओलावृष्टि)');
  });

  // 8. Status Tracking: Lookup by Mobile Number (Unified History)
  await testAsync('Tracking: Query by 10-digit mobile returns all linked enrollments and claims', async () => {
    const res = await db.findInsuranceRecords('9876500001');
    assert(res.enrollments && res.enrollments.length >= 1, 'Farmer enrollments found');
    assert(res.claims && res.claims.length >= 1, 'Farmer claims found');
    assert.strictEqual(res.enrollments[0].mobile, '9876500001');
    assert.strictEqual(res.claims[0].mobile, '9876500001');
  });

  // 9. Status Tracking: Non-existent record returns clean empty collections
  await testAsync('Tracking: Non-existent ID returns zero records without errors', async () => {
    const res = await db.findInsuranceRecords('BB-ENR-NON-EXISTENT-99999');
    assert.strictEqual(res.enrollments.length, 0);
    assert.strictEqual(res.claims.length, 0);
  });

  // 10. Secure Verification & Status Timeline Enrichment
  await testAsync('Tracking Enrichment: Enriches timeline, payment breakdown, and survey updates with secure verification', async () => {
    // 10a. Unverified lookup returns masked details and timeline
    const unverified = await db.findInsuranceRecords('BB-ENR-2026-48291', 'WRONG_CODE');
    assert(unverified.enrollments.length > 0, 'Found Ramesh enrollment');
    const enr = unverified.enrollments[0];
    assert.strictEqual(enr.is_verified, false, 'Should be unverified with wrong code');
    assert(enr.timeline && enr.timeline.length === 5, 'Must have 5-stage timeline');
    assert(enr.payment_updates, 'Must contain payment updates');
    assert(enr.payment_updates.bank_account_masked.includes('Verify to view'), 'Must mask bank account when unverified');
    assert(enr.official_portal_url.includes('pmfby.gov.in'), 'Must have official PMFBY portal link');

    // 10b. Verified lookup with Aadhaar last 4 (7412) unlocks details
    const verified = await db.findInsuranceRecords('BB-ENR-2026-48291', '7412');
    assert.strictEqual(verified.verified, true, 'Overall verified must be true');
    const verifiedEnr = verified.enrollments[0];
    assert.strictEqual(verifiedEnr.is_verified, true, 'Enrollment record must be verified');
    assert(verifiedEnr.payment_updates.bank_account_masked.includes('4892'), 'Must reveal bank account last 4');
    assert(verifiedEnr.payment_updates.state_subsidy > 0, 'Must have state subsidy contribution');
    assert(verifiedEnr.payment_updates.central_subsidy > 0, 'Must have central subsidy contribution');

    // 10c. Verified Claim returns joint surveyor details and DBT compensation
    const verifiedClaimRes = await db.findInsuranceRecords('BB-CLM-2026-19342', '9823456789');
    assert(verifiedClaimRes.claims.length > 0, 'Found claim');
    const clm = verifiedClaimRes.claims[0];
    assert.strictEqual(clm.is_verified, true, 'Claim must be verified');
    assert(clm.timeline && clm.timeline.length === 5, 'Claim must have 5-stage timeline');
    assert(clm.survey_updates, 'Must contain survey updates');
    assert(clm.survey_updates.surveyor_name.includes('Sudhir Sharma'), 'Assigned surveyor name');
    assert(clm.survey_updates.gps_coordinates, 'Must have GPS geo-tag coordinates');
    assert(clm.payment_updates, 'Must contain payment updates');
    assert(clm.payment_updates.on_account_interim_25pct > 0, 'Must calculate 25% interim relief');
    assert(clm.payment_updates.pfms_utr_ref.startsWith('PFMS'), 'PFMS UTR transaction reference');
  });

  // 11. status-tracking.html Frontend Verification
  test('HTML Portal: Verifies status-tracking.html dual input, verification unlock, timeline, and PMFBY redirection', () => {
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'status-tracking.html');
    assert(fs.existsSync(htmlPath), 'status-tracking.html must exist');
    const content = fs.readFileSync(htmlPath, 'utf8');

    // Tracking input & verification
    assert(content.includes('id="trackInput"'), 'Must have trackInput');
    assert(content.includes('id="verifyInput"'), 'Must have verifyInput for secure verification');
    assert(content.includes('unlockDetailsInline'), 'Must have inline verification unlock helper');

    // Timeline, Payment, Survey, and Missing Documents
    assert(content.includes('timeline-stepper'), 'Must contain timeline-stepper');
    assert(content.includes('missing-doc-alert'), 'Must contain missing-doc-alert');
    assert(content.includes('Joint Field Loss Assessment & Panchnama Details'), 'Must contain survey updates');
    assert(content.includes('Direct Benefit Transfer (DBT) Compensation & Settlement'), 'Must contain DBT payment updates');

    // Official PMFBY portal redirection
    assert(content.includes('https://pmfby.gov.in'), 'Must contain official PMFBY portal link');
    assert(content.includes('14447'), 'Must list Central PMFBY helpline 14447');
    assert(content.includes('escapeHtml'), 'Must use escapeHtml for safe rendering');
    assert(content.includes('auth-nav.js'), 'Must include auth-nav.js');
  });

  // 12. claim-filing.html Multi-Step Guided Workflow Verification
  test('HTML Portal: Verifies claim-filing.html guided multi-step workflow, interactive checklist, document uploads, and authorized channels distinction', () => {
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'claim-filing.html');
    assert(fs.existsSync(htmlPath), 'claim-filing.html must exist');
    const content = fs.readFileSync(htmlPath, 'utf8');

    // 1. Multi-step guided workflow
    assert(content.includes('stepSection1') && content.includes('stepSection2') && content.includes('stepSection3') && content.includes('stepSection4') && content.includes('stepSection5'), 'Must contain 5 guided steps');
    assert(content.includes('navigateToStep'), 'Must contain step navigation function');
    assert(content.includes('evaluateLossWindow'), 'Must contain reactive 72-hour window calculator');

    // 2. Interactive checklist
    assert(content.includes('checklist-wrap'), 'Must contain interactive checklist container');
    assert(content.includes('chkLandMatch') && content.includes('chkActiveCrop') && content.includes('chkTimeWindow') && content.includes('chkGeoPhotos') && content.includes('chkBankAadhaar'), 'Must contain all 5 statutory checklist items');
    assert(content.includes('updateChecklistProgress'), 'Must contain interactive checklist progress updater');

    // 3. Document uploads
    assert(content.includes('docInput1') && content.includes('docInput2') && content.includes('docInput3') && content.includes('docInput4'), 'Must have upload slots for damage photos and land records');
    assert(content.includes('handleDocUpload'), 'Must have handleDocUpload function');
    assert(content.includes('removeDocUpload'), 'Must have removeDocUpload function');

    // 4. Claim reference number & loss-report submission
    assert(content.includes('/api/insurance/claim'), 'Must submit to /api/insurance/claim');
    assert(content.includes('displayClaimId'), 'Must render official Claim ID on receipt');
    assert(content.includes('modalClaimTrackBtn'), 'Must provide direct link to track claim');

    // 5. Authorized channels distinction
    assert(content.includes('authority-distinction-box'), 'Must contain authority distinction banner');
    assert(content.includes('Statutory Protocol: Guidance vs. Authorized Channels'), 'Must clearly explain distinction between guidance and authorized submission');
    assert(content.includes('https://pmfby.gov.in'), 'Must link to official PMFBY portal');
    assert(content.includes('14447'), 'Must list Central Toll-Free Helpline 14447');
  });

  // 13. risk-awareness.html & /api/risk/advisory Verification
  await testAsync('Risk Advisory: Verifies risk-awareness.html agro-climatic alerts, crop-stage vulnerabilities, preventive actions & /api/risk/advisory API', async () => {
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'risk-awareness.html');
    assert(fs.existsSync(htmlPath), 'risk-awareness.html must exist');
    const content = fs.readFileSync(htmlPath, 'utf8');

    // 1. Interactive Selectors & Farm Profile Sync
    assert(content.includes('id="districtSelect"'), 'Must have district selector');
    assert(content.includes('id="cropSelect"'), 'Must have crop selector');
    assert(content.includes('id="stageSelect"'), 'Must have growth stage selector');
    assert(content.includes('syncWithFarmProfile'), 'Must have farm profile sync function');
    assert(content.includes('fetchRiskAdvisory'), 'Must have fetchRiskAdvisory function');

    // 2. Dynamic Weather Risk Alert Panel & Live Meteorological Metrics
    assert(content.includes('id="weatherAlertBox"'), 'Must have dynamic weather alert container');
    assert(content.includes('id="alertUrgencyBadge"'), 'Must have alert urgency badge');
    assert(content.includes('id="metTemp"') && content.includes('id="metRain"') && content.includes('id="metHum"') && content.includes('id="metWind"'), 'Must have meteorological data indicators');
    assert(content.includes('id="weatherSourceTag"'), 'Must display official meteorological source badge');

    // 3. Dynamic Crop-Stage Vulnerabilities & Preventive Actions
    assert(content.includes('id="vulnGridContainer"'), 'Must have crop-stage vulnerability container');
    assert(content.includes('id="preventiveActionsContainer"'), 'Must have actionable preventive actions container');
    assert(content.includes('renderCropVulnerabilities'), 'Must have renderCropVulnerabilities function');
    assert(content.includes('renderPreventiveActions'), 'Must have renderPreventiveActions function');

    // 4. Statutory PMFBY Coverage Guidance & Direct Action Pathways
    assert(content.includes('Prevented Sowing / Planting Risk'), 'Must cover Prevented Sowing stage');
    assert(content.includes('Standing Crop Loss (Sowing to Harvest)'), 'Must cover Standing Crop stage');
    assert(content.includes('Post-Harvest Losses (Up to 14 Days)'), 'Must cover Post-Harvest stage (14 days)');
    assert(content.includes('Localized Disasters (Hailstorm / Landslide)'), 'Must cover Localized Calamities stage');
    assert(content.includes('claim-filing.html'), 'Must link directly to claim-filing.html');
    assert(content.includes('status-tracking.html'), 'Must link to status-tracking.html');
    assert(content.includes('14447'), 'Must list statutory helpline 14447');
    assert(content.includes('escapeHtml'), 'Must use escapeHtml for safe DOM rendering');
    assert(content.includes('auth-nav.js'), 'Must include auth-nav.js');

    // 5. Backend /api/risk/advisory Integration Verification
    const weatherService = require('./weather-service');
    assert(typeof weatherService.resolveWeather === 'function', 'weatherService must have resolveWeather');
    
    const weather = await weatherService.resolveWeather('Sehore');
    assert(weather && typeof weather.temp_c === 'number', 'Sehore weather must resolve with temperature');
    assert(weather.rainfall_mm !== undefined, 'Weather must include rainfall');
    assert(weather.humidity_pct !== undefined, 'Weather must include humidity');
    assert(weather.wind_kmh !== undefined, 'Weather must include wind speed');

    // Test route dispatch through server app
    const app = require('./server');
    assert(app && app._router, 'Server app must be instantiated');

    const advisoryRoute = app._router.stack.find(s => s.route && s.route.path === '/api/risk/advisory');
    assert(advisoryRoute, 'Must have /api/risk/advisory GET route registered');

    // In-process mock request to verify route execution
    const mockReq = {
      query: { city: 'Sehore', crop: 'Wheat', stage: 'Grain Filling & Pod Maturity' }
    };
    let capturedData = null;
    let capturedStatus = 200;
    const mockRes = {
      status(c) { capturedStatus = c; return this; },
      json(data) { capturedData = data; return this; }
    };

    const handler = advisoryRoute.route.stack[0].handle;
    await handler(mockReq, mockRes);

    assert(capturedData, 'Advisory endpoint must return JSON data');
    assert.strictEqual(capturedData.success, true, 'Advisory endpoint must return success: true');
    assert.strictEqual(capturedData.city, 'Sehore', 'Must reflect queried city');
    assert.strictEqual(capturedData.crop, 'Wheat', 'Must reflect queried crop');
    assert(capturedData.weather_summary, 'Must contain weather_summary');
    assert(capturedData.risk_alert, 'Must contain risk_alert');
    assert(['RED', 'ORANGE', 'YELLOW', 'GREEN'].includes(capturedData.risk_alert.level), 'Risk alert level must be valid');
    assert(Array.isArray(capturedData.crop_stage_risks) && capturedData.crop_stage_risks.length > 0, 'Must return crop stage risks array');
    assert(Array.isArray(capturedData.preventive_actions) && capturedData.preventive_actions.length > 0, 'Must return preventive actions array');
    assert(capturedData.statutory_pmfby_coverage, 'Must contain statutory PMFBY coverage details');
    assert(capturedData.statutory_pmfby_coverage.claim_window.includes('72 Hours'), 'Must reinforce statutory 72-hour claim window');
  });

  // 14. pmfby-enrollment.html & /api/insurance/notified-crops Verification
  await testAsync('PMFBY Enrollment: Verifies season-specific cards, cascading directory, precision calculator, interactive checklist, and official portal links', async () => {
    const fs = require('fs');
    const path = require('path');
    const htmlPath = path.join(__dirname, 'pmfby-enrollment.html');
    assert(fs.existsSync(htmlPath), 'pmfby-enrollment.html must exist');
    const content = fs.readFileSync(htmlPath, 'utf8');

    // 1. Season-Specific Enrollment Information
    assert(content.includes('id="cardRabi"') && content.includes('id="cardKharif"') && content.includes('id="cardCommercial"'), 'Must have season cards for Rabi, Kharif, and Commercial');
    assert(content.includes('selectSeason'), 'Must have selectSeason function');
    assert(content.includes('id="seasonWindowText"') && content.includes('id="seasonDaysText"'), 'Must display active season window and countdown text');

    // 2. State, District & Notified Crop Cascading Directory
    assert(content.includes('id="state"') && content.includes('id="district"'), 'Must have state and district selectors');
    assert(content.includes('id="crop_select"'), 'Must have notified crop selector');
    assert(content.includes('handleStateChange') && content.includes('handleDistrictChange'), 'Must have state/district change handlers');
    assert(content.includes('updateNotifiedCropsDropdown'), 'Must dynamically populate notified crops');

    // 3. Landholding Details & Unit Switching
    assert(content.includes('id="area_acres"') && content.includes('id="area_unit"'), 'Must support area input with unit selector');
    assert(content.includes('handleUnitToggle'), 'Must have unit toggle conversion function');
    assert(content.includes('id="land_khasra"') && content.includes('id="land_ownership"'), 'Must have land khasra and ownership inputs');

    // 4. Live Precision Subsidized Premium Calculator
    assert(content.includes('id="calcSumInsured"'), 'Must have sum insured display');
    assert(content.includes('id="calcRate"'), 'Must have statutory rate display');
    assert(content.includes('id="calcFarmerPayable"'), 'Must have net farmer payable display');
    assert(content.includes('id="calcGovtSubsidyPill"'), 'Must display government subsidy pill');
    assert(content.includes('id="calcCenterShare"') && content.includes('id="calcStateShare"'), 'Must display Central and State subsidy share breakdown');
    assert(content.includes('id="calcInsurerTag"'), 'Must display assigned regional insurance company');

    // 5. Documentation Guidance & Interactive Checklist
    assert(content.includes('id="chkDoc1"') && content.includes('id="chkDoc2"') && content.includes('id="chkDoc3"') && content.includes('id="chkDoc4"'), 'Must have statutory checklist checkboxes');
    assert(content.includes('toggleGuidance'), 'Must have toggleGuidance function');
    assert(content.includes('handleDocUpload') && content.includes('removeDoc'), 'Must have file upload and removal functions');
    assert(content.includes('checklistProgressText'), 'Must track document verification progress');

    // 6. Guided Multi-Step Application Flow & Review
    assert(content.includes('id="step1"') && content.includes('id="step2"') && content.includes('id="step3"') && content.includes('id="step4"') && content.includes('id="step5"'), 'Must have 5-step guided flow');
    assert(content.includes('prepareReviewAndGoStep'), 'Must prepare review summary before submission');
    assert(content.includes('id="statutoryDeclaration"'), 'Must contain statutory declaration checkbox');
    assert(content.includes('handleEnrollmentSubmit'), 'Must have submission handler');
    assert(content.includes('id="displayAppId"'), 'Must render official Application ID upon receipt');
    assert(content.includes('status-tracking.html'), 'Must link to status-tracking.html');

    // 7. Verified Official Portal Integration & Helplines
    assert(content.includes('https://pmfby.gov.in'), 'Must link to official PMFBY portal');
    assert(content.includes('https://digitalseva.csc.gov.in/'), 'Must link to CSC Digital Seva');
    assert(content.includes('14447'), 'Must list Central Toll-Free Helpline 14447');
    assert(content.includes('1800-180-1551'), 'Must list Kisan Call Centre 1800-180-1551');

    // 8. Backend /api/insurance/notified-crops Route Verification
    const app = require('./server');
    const notifiedRoute = app._router.stack.find(s => s.route && s.route.path === '/api/insurance/notified-crops');
    assert(notifiedRoute, 'Must have /api/insurance/notified-crops route');

    const mockReq = {
      query: { state: 'Madhya Pradesh', district: 'Sehore', season: 'rabi' }
    };
    let capturedData = null;
    let capturedStatus = 200;
    const mockRes = {
      status(c) { capturedStatus = c; return this; },
      json(data) { capturedData = data; return this; }
    };

    const handler = notifiedRoute.route.stack[0].handle;
    await handler(mockReq, mockRes);

    assert(capturedData, 'Notified crops endpoint must return JSON');
    assert.strictEqual(capturedData.success, true, 'Must return success: true');
    assert.strictEqual(capturedData.state, 'Madhya Pradesh', 'Must reflect requested state');
    assert.strictEqual(capturedData.district, 'Sehore', 'Must reflect requested district');
    assert(capturedData.insurer && capturedData.insurer.includes('AIC'), 'Must return AIC as insurer for MP');
    assert(Array.isArray(capturedData.notified_crops) && capturedData.notified_crops.length > 0, 'Must return notified crops array');
    assert(capturedData.season_info && capturedData.season_info.cutoff_date, 'Must return season info with cutoff date');
    assert.strictEqual(capturedData.season_info.farmer_share_pct, 1.5, 'Rabi farmer share must be 1.5%');
  });

  console.log('\n======================================================');
  console.log(`✨ ALL INSURANCE TESTS COMPLETED: ${passed} / ${total} tests passed!`);
  console.log('======================================================\n');
}

runInsuranceTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
