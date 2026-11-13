const fs = require('fs');
const path = require('path');

console.log('\n🎨 Testing BhoomiBandhu 2.0 Typography & Form Design System...\n');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`❌ [FAIL] ${message}`);
    failed++;
  }
}

const baseDir = path.resolve(__dirname);
const htmlFiles = fs.readdirSync(baseDir).filter(f => f.endsWith('.html'));

// 1. Assert Font Standardization across all 19 HTML files
let fontCheckAllPassed = true;
const fontMissingFiles = [];
htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
  const hasPoppins = content.includes('family=Poppins');
  const hasJakarta = content.includes('Plus+Jakarta+Sans');
  const hasDevanagari = content.includes('Noto+Sans+Devanagari');
  if (!hasPoppins || !hasJakarta || !hasDevanagari) {
    fontCheckAllPassed = false;
    fontMissingFiles.push(file);
  }
});

assert(fontCheckAllPassed && htmlFiles.length >= 19, `All ${htmlFiles.length} HTML pages uniformly load Poppins, Plus Jakarta Sans, and Noto Sans Devanagari`);

// 2. Assert Typography System in style.css
const styleCss = fs.readFileSync(path.join(baseDir, 'style.css'), 'utf8');
assert(styleCss.includes('--font-family-base') && styleCss.includes('Poppins'), 'style.css defines standard font family base token with Poppins');
assert(styleCss.includes('--font-size-xs') && styleCss.includes('--font-size-3xl'), 'style.css defines full harmonic typographic font size scale (xs to 3xl)');
assert(styleCss.includes('--leading-tight') && styleCss.includes('--leading-relaxed'), 'style.css defines standardized line-height tokens');
assert(styleCss.includes('h1, h2, h3, h4, h5, h6') && styleCss.includes('h1 {') && styleCss.includes('h6 {'), 'style.css defines standardized heading scales for h1 through h6');

// 3. Assert Form Design System in style.css & auth-style.css
assert(styleCss.includes('.form-group') && styleCss.includes('.form-label'), 'style.css standardizes persistent form-group and form-label styling');
assert(styleCss.includes('.required-indicator') || styleCss.includes('.required'), 'style.css defines distinct required-field indicator');
assert(styleCss.includes('.form-help') && styleCss.includes('.invalid-feedback'), 'style.css standardizes field descriptions and inline validation messages');
assert(styleCss.includes('.is-invalid') && styleCss.includes('.is-valid'), 'style.css provides inline invalid/valid form control states');
assert(styleCss.includes('.btn-loading') || styleCss.includes('.spinner'), 'style.css defines loading & submission states for form buttons');
assert(styleCss.includes('role="alert"') || styleCss.includes('.alert-accessible'), 'style.css includes accessible alert messaging classes');

// 4. Assert auth-style.css
const authStyle = fs.readFileSync(path.join(baseDir, 'auth-style.css'), 'utf8');
assert(authStyle.includes('Poppins') && authStyle.includes('--font-main'), 'auth-style.css adopts Poppins in primary typography token');
assert(authStyle.includes('.required-indicator') && authStyle.includes('.form-help'), 'auth-style.css incorporates required indicators and helper descriptions');
assert(authStyle.includes('.invalid-feedback') && authStyle.includes('.is-invalid'), 'auth-style.css implements inline error states');

// 5. Assert Form Quality across key interactive pages
const schemesHtml = fs.readFileSync(path.join(baseDir, 'schemes.html'), 'utf8');
assert(schemesHtml.includes('for="scheme"') && schemesHtml.includes('for="land"') && schemesHtml.includes('form-help'), 'schemes.html replaces raw inputs with persistent labels and field descriptions');
assert(schemesHtml.includes('validateField') && schemesHtml.includes('btn-loading'), 'schemes.html implements inline validation and loading state on submit');

const storageHtml = fs.readFileSync(path.join(baseDir, 'storage.html'), 'utf8');
assert(storageHtml.includes('for="pName"') && storageHtml.includes('for="pState"'), 'storage.html profile form uses persistent labels and form-control styling');

const loginHtml = fs.readFileSync(path.join(baseDir, 'login.html'), 'utf8');
assert(loginHtml.includes('for="identifier"') && loginHtml.includes('required-indicator') && loginHtml.includes('form-help'), 'login.html features persistent labels, required indicators, and helper descriptions');
assert(loginHtml.includes('role="alert"') && loginHtml.includes('aria-live="polite"'), 'login.html alert has accessible ARIA live attributes');

const regHtml = fs.readFileSync(path.join(baseDir, 'register.html'), 'utf8');
assert(regHtml.includes('required-indicator') && regHtml.includes('form-help'), 'register.html onboarding form features required indicators and helper descriptions');

const forgotHtml = fs.readFileSync(path.join(baseDir, 'forgot-password.html'), 'utf8');
assert(forgotHtml.includes('required-indicator') && forgotHtml.includes('form-help'), 'forgot-password.html features required indicators and field descriptions');

console.log(`\n======================================================`);
console.log(`✨ ALL TYPOGRAPHY & FORM TESTS: ${passed} / ${passed + failed} passed!`);
console.log(`======================================================\n`);

if (failed > 0) {
  process.exit(1);
}
