import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../pageStyles/auth.css';

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
        navigate('/', { replace: true });
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
          setError('Company / Facility name is required.');
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
        navigate('/pending-approval', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo" style={{ justifyContent: 'center', marginBottom: '12px' }}>
            <img
              src="/assets/Gemini_Generated_Image_7lty6p7lty6p7lty-removebg-preview.png"
              alt="BhoomiBandhu"
              style={{ width: '64px', height: '64px' }}
            />
            <span style={{ fontSize: '1.4rem' }}>BhoomiBandhu</span>
          </div>
          <h1>Create Your Account</h1>
          <p>Join the trusted platform for farmers and agriculture partners</p>
        </div>

        {/* Role Tabs */}
        <div className="role-tabs" role="tablist">
          <button
            type="button"
            className={`role-tab ${role === 'farmer' ? 'active' : ''}`}
            onClick={() => { setRole('farmer'); setError(''); }}
            role="tab"
            aria-selected={role === 'farmer'}
          >
            🌾 Farmer
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'psychiatrist' ? 'active' : ''}`}
            onClick={() => { setRole('psychiatrist'); setError(''); }}
            role="tab"
            aria-selected={role === 'psychiatrist'}
          >
            🧠 Psychiatrist
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'warehouse_owner' ? 'active' : ''}`}
            onClick={() => { setRole('warehouse_owner'); setError(''); }}
            role="tab"
            aria-selected={role === 'warehouse_owner'}
          >
            🏬 Storage Owner
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
            <span>✓</span>
            <div>{successMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Mobile Number */}
          <div className="form-group">
            <label htmlFor="reg-mobile">Mobile Number (10 digits) *</label>
            <input
              id="reg-mobile"
              type="tel"
              className="auth-input"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(cleanMobileNumber(e.target.value))}
              maxLength={10}
              disabled={isLoading}
              required
            />
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="reg-name">Full Name *</label>
            <input
              id="reg-name"
              type="text"
              className="auth-input"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Email (Optional) */}
          <div className="form-group">
            <label htmlFor="reg-email">Email Address (Optional)</label>
            <input
              id="reg-email"
              type="email"
              className="auth-input"
              placeholder="e.g. ramesh@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="reg-password">Password (min 8 chars, 1 number/symbol) *</label>
            <div className="input-wrapper">
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                className="auth-input has-toggle"
                placeholder="Create secure password"
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
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="reg-confirm-password">Confirm Password *</label>
            <input
              id="reg-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-input"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* ROLE SPECIFIC FIELDS */}
          {role === 'farmer' && (
            <>
              <div className="form-group">
                <label htmlFor="reg-state">State</label>
                <input
                  id="reg-state"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Haryana"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-district">District</label>
                <input
                  id="reg-district"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Karnal"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-crop">Primary Crop</label>
                <input
                  id="reg-crop"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Wheat, Rice, Mustard"
                  value={primaryCrop}
                  onChange={(e) => setPrimaryCrop(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          {role === 'psychiatrist' && (
            <>
              <div className="form-group">
                <label htmlFor="reg-license">Medical / Clinical License Number *</label>
                <input
                  id="reg-license"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. MCI-2023-89472"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-specialization">Specialization (Optional)</label>
                <input
                  id="reg-specialization"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. Farmer Distress, Clinical Psychology"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="auth-alert auth-alert-info">
                <span>ℹ️</span>
                <div>
                  <strong>Verification Note:</strong> Psychiatrist accounts require administrative review and license validation before accessing patient consultations.
                </div>
              </div>
            </>
          )}

          {role === 'warehouse_owner' && (
            <>
              <div className="form-group">
                <label htmlFor="reg-company">Company / Warehouse Facility Name *</label>
                <input
                  id="reg-company"
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
                <label htmlFor="reg-gstin">GSTIN (Optional)</label>
                <input
                  id="reg-gstin"
                  type="text"
                  className="auth-input"
                  placeholder="e.g. 06AAAAA0000A1Z5"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="auth-alert auth-alert-info">
                <span>ℹ️</span>
                <div>
                  <strong>Verification Note:</strong> Warehouse owner accounts require administrative validation before listing storage units on BhoomiBandhu.
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Creating Account...</span>
              </>
            ) : (
              'Complete Registration'
            )}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
}
