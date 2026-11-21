import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/auth.css';

/* â”€â”€ Modern Inline SVG Icons â”€â”€ */
const IconSprout = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z"/><path d="M14.1 6a7 7 0 00-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>
);
const IconHeart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>
);
const IconWarehouse = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 8.35V20a2 2 0 01-2 2H4a2 2 0 01-2-2V8.35A2 2 0 013.26 6.5l8-3.2a2 2 0 011.48 0l8 3.2A2 2 0 0122 8.35z"/><path d="M6 18h12"/></svg>
);
const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="7" r="3"/></svg>
);
const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
);

export default function RegisterPage() {
  const { registerFarmer, registerPsychiatrist, registerWarehouseOwner } = useAuth();
  const navigate = useNavigate();

  // Role tab: 'farmer' | 'psychiatrist' | 'warehouse_owner'
  const [role, setRole] = useState('farmer');

  // Common fields
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Farmer specific fields
  const [stateName, setStateName] = useState('Haryana');
  const [farmerCategory, setFarmerCategory] = useState('small');
  const [district, setDistrict] = useState('');
  const [village, setVillage] = useState('');
  const [primaryCrop, setPrimaryCrop] = useState('');

  // Psychiatrist specific fields
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('');

  // Warehouse Owner specific fields
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');

  // Status & Feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cleanMobileNumber = (val) => val.replace(/\D/g, '').slice(0, 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanMobile = cleanMobileNumber(mobile);
    if (cleanMobile.length !== 10) {
      setError('Mobile number must be exactly 10 digits.');
      return;
    }
    if (!name.trim()) {
      setError('Full Name is required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/\d|[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setError('Password must contain at least one digit or special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      if (role === 'farmer') {
        const payload = {
          mobile: cleanMobile,
          name: name.trim(),
          password,
          email: email.trim() || null,
          role: 'farmer',
          state: stateName || 'Haryana',
          farmer_category: farmerCategory || 'small',
          district: district.trim() || null,
          village: village.trim() || null,
          primary_crop: primaryCrop.trim() || null,
        };
        await registerFarmer(payload);
        navigate('/dashboard', { replace: true });
      } else if (role === 'psychiatrist') {
        if (!licenseNumber.trim()) {
          setError('Medical license number is required.');
          setIsLoading(false);
          return;
        }
        const payload = {
          mobile: cleanMobile,
          name: name.trim(),
          password,
          email: email.trim() || null,
          license_number: licenseNumber.trim(),
          specialization: specialization.trim() || null,
        };
        await registerPsychiatrist(payload);
        navigate('/pending-approval', { replace: true });
      } else if (role === 'warehouse_owner') {
        if (!companyName.trim()) {
          setError('Company / Facility Name is required.');
          setIsLoading(false);
          return;
        }
        const payload = {
          mobile: cleanMobile,
          name: name.trim(),
          password,
          email: email.trim() || null,
          company_name: companyName.trim(),
          gstin: gstin.trim() || null,
        };
        await registerWarehouseOwner(payload);
        navigate('/portal/warehouse', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Decorative Showcase Panel (Desktop) */}
      <aside className="auth-deco-panel" aria-hidden="true">
        <div className="deco-shape deco-shape--1" />
        <div className="deco-shape deco-shape--2" />
        <div className="deco-shape deco-shape--3" />

        <div className="deco-brand">
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <img
              src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
              alt="BhoomiBandhu"
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
            <span style={{ fontSize: '1.6rem', fontWeight: '800', fontFamily: 'DM Sans', color: '#ffffff' }}>
              BhoomiBandhu
            </span>
          </Link>
          <h2>Join India's Dedicated Kisan Technology Platform</h2>
          <p>
            Create your account in 60 seconds to manage crop insurance, store produce in certified warehouses, and consult AI agronomic doctors.
          </p>
        </div>

        <div className="deco-features">
          <div className="deco-feature">
            <div className="deco-feature-icon">
              <IconSprout />
            </div>
            <span>Personalized Farm Sowing & Yield Advice</span>
          </div>
          <div className="deco-feature">
            <div className="deco-feature-icon">
              <IconWarehouse />
            </div>
            <span>Direct Space Reservation in 500+ Godowns</span>
          </div>
          <div className="deco-feature">
            <div className="deco-feature-icon">
              <IconHeart />
            </div>
            <span>24/7 Confidential Well-Being Support</span>
          </div>
        </div>
      </aside>

      {/* Right Form Panel */}
      <main className="auth-form-panel">
        <div className="auth-container auth-container--wide">
          <div className="auth-header">
            <Link to="/" className="auth-logo-inline">
              <img
                src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
                alt="BhoomiBandhu"
              />
              <span className="brand-name">BhoomiBandhu</span>
            </Link>
            <h1>Create Account</h1>
            <p>Select your account role to get started</p>
          </div>

          {/* Role Selection Tabs */}
          <div className="role-tabs" role="tablist" aria-label="Registration Role">
            <button
              type="button"
              className={`role-tab ${role === 'farmer' ? 'active' : ''}`}
              onClick={() => { setRole('farmer'); setError(''); }}
              role="tab"
              aria-selected={role === 'farmer'}
            >
              <span>🌾 Farmer</span>
            </button>
            <button
              type="button"
              className={`role-tab ${role === 'psychiatrist' ? 'active' : ''}`}
              onClick={() => { setRole('psychiatrist'); setError(''); }}
              role="tab"
              aria-selected={role === 'psychiatrist'}
            >
              <span>🧠 Clinical Partner</span>
            </button>
            <button
              type="button"
              className={`role-tab ${role === 'warehouse_owner' ? 'active' : ''}`}
              onClick={() => { setRole('warehouse_owner'); setError(''); }}
              role="tab"
              aria-selected={role === 'warehouse_owner'}
            >
              <span>🏬 Warehouse Owner</span>
            </button>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="auth-alert auth-alert-success" role="alert">
              <span>✔</span>
              <div>{successMsg}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Common Basic Details */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="mobile">Mobile Number (10 digits) *</label>
                <input
                  id="mobile"
                  type="tel"
                  className="auth-input"
                  placeholder="e.g. 9876543210"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  disabled={isLoading}
                  maxLength={10}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address (Optional)</label>
              <input
                id="email"
                type="email"
                className="auth-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Farmer Specific Fields */}
            {role === 'farmer' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="stateName">State *</label>
                    <select
                      id="stateName"
                      className="auth-input"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="Haryana">Haryana</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="farmerCategory">Land Holding Category *</label>
                    <select
                      id="farmerCategory"
                      className="auth-input"
                      value={farmerCategory}
                      onChange={(e) => setFarmerCategory(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="marginal">Marginal (Under 1 Hectare)</option>
                      <option value="small">Small (1 – 2 Hectares)</option>
                      <option value="semi_medium">Semi-Medium (2 – 4 Hectares)</option>
                      <option value="medium">Medium (4 – 10 Hectares)</option>
                      <option value="large">Large (Over 10 Hectares)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="district">District</label>
                    <input
                      id="district"
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Karnal, Rohtak"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="village">Village / Tehsil</label>
                    <input
                      id="village"
                      type="text"
                      className="auth-input"
                      placeholder="e.g. Nilokheri"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="primaryCrop">Primary Crop Grown</label>
                  <input
                    id="primaryCrop"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Wheat, Basmati Paddy, Mustard"
                    value={primaryCrop}
                    onChange={(e) => setPrimaryCrop(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}

            {/* Psychiatrist Specific Fields */}
            {role === 'psychiatrist' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="licenseNumber">Medical License Number *</label>
                  <input
                    id="licenseNumber"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. MCI-2018-98432"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="specialization">Specialization</label>
                  <input
                    id="specialization"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Clinical Psychology, Rural Counseling"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Warehouse Owner Specific Fields */}
            {role === 'warehouse_owner' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="companyName">Warehouse / Facility Name *</label>
                  <input
                    id="companyName"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Kisan Agro Cold Storage Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="gstin">GSTIN (Optional)</label>
                  <input
                    id="gstin"
                    type="text"
                    className="auth-input"
                    placeholder="e.g. 06AAAAA0000A1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Password Credentials */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password (Min. 8 characters) *</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="auth-input has-toggle"
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner" />
                  <span>Registering Account...</span>
                </>
              ) : (
                'Create BhoomiBandhu Account'
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login">Sign In here</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
