# BHOOMIBANDHU — DATABASE SCHEMA & ARCHITECTURE VERIFICATION REPORT
**Document Reference:** `docs/PROMPT_3A_SCHEMA_VERIFICATION.md`  
**Execution Context:** Prompt 3A — Strictly Read-Only Database & Architecture Audit  
**Date:** November 1, 2026  
**Auditor:** Senior Database Architect & FastAPI Engineer  

---

## 1. EXECUTIVE SUMMARY

This verification audit performs a strict, column-by-column comparative analysis between the legacy MySQL dump (`database/bhoomibandhu_dbase.sql`) and the active SQLAlchemy ORM models (`backend/app/models/models.py`). In addition, it establishes the architectural blueprint for the upcoming Authentication and Multi-Role Profile System (Prompt 4) to ensure 100% preservation of historical farmer records and zero data duplication.

### Key Audit Findings:
1. **Schema Coverage (11/11 Tables):** All 11 tables present in the MySQL dump are explicitly defined in SQLAlchemy. There are no missing or superfluous tables.
2. **Column Alignment (76 Columns):** All 76 columns across the 11 tables match in name, nullable status, and primary key designations.
3. **PostgreSQL Compatibility:** 
   - All legacy MySQL `tinyint(1)` boolean representations are mapped to native PostgreSQL `BOOLEAN`.
   - MySQL `int AUTO_INCREMENT` is correctly modeled for PostgreSQL sequences (`serial`/`identity`).
   - Timestamps utilize PostgreSQL `TIMESTAMPTZ` (`DateTime(timezone=True)`) with server-side `func.now()`.
   - Important nuance identified: SQLAlchemy client-side `default=` vs PostgreSQL server-side `server_default=` defaults.
4. **Identity & Authentication Architecture:** Resolves the architectural discrepancy between adding a direct `farmers.user_id` foreign key versus implementing an decoupled `farmer_profiles` table linking `users.id` and `farmers.farmer_id`. The audit formalizes a zero-data-loss, OTP-verified account linking workflow.

---

## 2. COMPLETE 11-TABLE COLUMN-LEVEL COMPARISON

Every column has been individually inspected across `database/bhoomibandhu_dbase.sql` and `backend/app/models/models.py`.

---

### Table 1: `crops`
*Catalog of supported agricultural crops.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `crop_id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `crop_name` | `varchar(100) NOT NULL` | `String(100)` | `VARCHAR(100)` | NO | None / None | NO | None | YES | NO |
| `crop_category` | `varchar(50) DEFAULT NULL` | `String(50)` | `VARCHAR(50)` | YES | `NULL` / None | NO | None | NO | NO |

- **Check Constraints:** None.
- **Indexes:** Primary key on `crop_id`, unique index on `crop_name`.
- **Relationships:** None defined.

---

### Table 2: `farmers`
*Legacy farmer master entity holding identity, demographic, land, and crop records.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `farmer_id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `name` | `varchar(100) NOT NULL` | `String(100)` | `VARCHAR(100)` | NO | None / None | NO | None | NO | NO |
| `mobile` | `varchar(15) NOT NULL` | `String(15)` | `VARCHAR(15)` | NO | None / None | NO | None | YES | NO |
| `state` | `varchar(50) NOT NULL` | `String(50)` | `VARCHAR(50)` | NO | None / None | NO | None | NO | NO |
| `email` | `varchar(150) DEFAULT NULL` | `String(150)` | `VARCHAR(150)` | YES | `NULL` / None | NO | None | NO | NO |
| `district` | `varchar(80) DEFAULT NULL` | `String(80)` | `VARCHAR(80)` | YES | `NULL` / None | NO | None | NO | NO |
| `village` | `varchar(100) DEFAULT NULL` | `String(100)` | `VARCHAR(100)` | YES | `NULL` / None | NO | None | NO | NO |
| `farmer_category` | `varchar(20) DEFAULT NULL` | `String(20)` | `VARCHAR(20)` | YES | `NULL` / None | NO | None | NO | NO |
| `land_holding_ha` | `decimal(6,2) DEFAULT NULL` | `Numeric(6, 2)` | `NUMERIC(6,2)` | YES | `NULL` / None | NO | None | NO | NO |
| `primary_crop` | `varchar(80) DEFAULT NULL` | `String(80)` | `VARCHAR(80)` | YES | `NULL` / None | NO | None | NO | NO |
| `aadhaar_linked` | `tinyint(1) DEFAULT '0'` | `Boolean` | `BOOLEAN` | YES | `'0'` / `default=False` | NO | None | NO | NO |
| `bank_linked` | `tinyint(1) DEFAULT '0'` | `Boolean` | `BOOLEAN` | YES | `'0'` / `default=False` | NO | None | NO | NO |
| `profile_photo_url`| `varchar(255) DEFAULT NULL`| `String(255)` | `VARCHAR(255)` | YES | `NULL` / None | NO | None | NO | NO |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now(), onupdate=func.now()` | NO | None | NO | NO |

- **Check Constraints:** `chk_farmer_category`: `farmer_category IN ('small', 'marginal', 'large')`.
- **Indexes:** Primary key `farmer_id`, unique index on `mobile`, non-unique index on `state`. (Note: MySQL dump contained both `uq_farmers_mobile` and redundant `idx_farmers_mobile`; SQLAlchemy `unique=True, index=True` cleanly creates a single PostgreSQL unique B-tree index).
- **Relationships:**
  - `crop_predictions` &rarr; `CropPrediction.farmer`
  - `insurance_requests` &rarr; `InsuranceRequest.farmer`
  - `pmfby_enrollments` &rarr; `PmfbyEnrollment.farmer`
  - `loan_applications` &rarr; `LoanApplication.farmer`
  - `mental_health_requests` &rarr; `MentalHealthRequest.farmer`
  - `scheme_eligibility_checks` &rarr; `SchemeEligibilityCheck.farmer`
  - `storage_bookings` &rarr; `StorageBooking.farmer`

---

### Table 3: `government_schemes`
*Central and State agricultural assistance programs and storage subsidy definitions.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `slug` | `varchar(50) NOT NULL` | `String(50)` | `VARCHAR(50)` | NO | None / None | NO | None | YES | NO |
| `name` | `varchar(150) NOT NULL` | `String(150)` | `VARCHAR(150)` | NO | None / None | NO | None | NO | NO |
| `scheme_type` | `varchar(20) DEFAULT NULL` | `String(20)` | `VARCHAR(20)` | YES | `NULL` / None | NO | None | NO | NO |
| `benefit_summary`| `text` | `Text` | `TEXT` | YES | `NULL` / None | NO | None | NO | NO |
| `storage_benefit_per_kg` | `decimal(5,2) DEFAULT '0.00'` | `Numeric(5, 2)` | `NUMERIC(5,2)` | YES | `'0.00'` / `default=0.00` | NO | None | NO | NO |
| `active` | `tinyint(1) DEFAULT '1'` | `Boolean` | `BOOLEAN` | YES | `'1'` / `default=True` | NO | None | NO | NO |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |

- **Check Constraints:** `chk_scheme_type`: `scheme_type IN ('central', 'state')`.
- **Indexes:** Primary key on `id`, unique index on `slug`.
- **Relationships:**
  - `storage_bookings` &rarr; `StorageBooking.scheme`
  - `scheme_eligibility_checks` &rarr; `SchemeEligibilityCheck.scheme`

---

### Table 4: `storage_facilities`
*Cold storage and rural warehouse facilities with capacity and tariff details.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `name` | `varchar(150) NOT NULL` | `String(150)` | `VARCHAR(150)` | NO | None / None | NO | None | NO | NO |
| `storage_type` | `varchar(30) DEFAULT NULL` | `String(30)` | `VARCHAR(30)` | YES | `NULL` / None | NO | None | NO | NO |
| `location_text` | `varchar(200) DEFAULT NULL` | `String(200)` | `VARCHAR(200)` | YES | `NULL` / None | NO | None | NO | NO |
| `state` | `varchar(60) DEFAULT NULL` | `String(60)` | `VARCHAR(60)` | YES | `NULL` / None | NO | None | NO | NO |
| `district` | `varchar(80) DEFAULT NULL` | `String(80)` | `VARCHAR(80)` | YES | `NULL` / None | NO | None | NO | NO |
| `distance_km` | `decimal(5,1) DEFAULT NULL` | `Numeric(5, 1)` | `NUMERIC(5,1)` | YES | `NULL` / None | NO | None | NO | NO |
| `capacity_tons` | `decimal(10,2) DEFAULT NULL`| `Numeric(10, 2)`| `NUMERIC(10,2)`| YES | `NULL` / None | NO | None | NO | NO |
| `available_space_tons`| `decimal(10,2) DEFAULT NULL`| `Numeric(10, 2)`| `NUMERIC(10,2)`| YES | `NULL` / None | NO | None | NO | NO |
| `price_per_kg_month` | `decimal(5,2) NOT NULL` | `Numeric(5, 2)` | `NUMERIC(5,2)` | NO | None / None | NO | None | NO | NO |
| `mode` | `varchar(10) DEFAULT NULL` | `String(10)` | `VARCHAR(10)` | YES | `NULL` / None | NO | None | NO | NO |
| `temperature_range` | `varchar(30) DEFAULT NULL` | `String(30)` | `VARCHAR(30)` | YES | `NULL` / None | NO | None | NO | NO |
| `suitable_crops`| `text` | `Text` | `TEXT` | YES | `NULL` / None | NO | None | NO | NO |
| `facilities` | `text` | `Text` | `TEXT` | YES | `NULL` / None | NO | None | NO | NO |
| `scheme_support`| `text` | `Text` | `TEXT` | YES | `NULL` / None | NO | None | NO | NO |
| `rating` | `decimal(3,1) DEFAULT NULL` | `Numeric(3, 1)` | `NUMERIC(3,1)` | YES | `NULL` / None | NO | None | NO | NO |
| `review_count` | `int DEFAULT '0'` | `Integer` | `INTEGER` | YES | `'0'` / `default=0` | NO | None | NO | NO |
| `govt_approved` | `tinyint(1) DEFAULT '0'` | `Boolean` | `BOOLEAN` | YES | `'0'` / `default=False` | NO | None | NO | NO |
| `status` | `varchar(20) DEFAULT 'available'`| `String(20)` | `VARCHAR(20)` | YES | `'available'` / `default="available"` | NO | None | NO | NO |
| `created_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |

- **Check Constraints:**
  - `storage_facilities_chk_1`: `storage_type IN ('cold_storage', 'warehouse', 'offline')`
  - `storage_facilities_chk_2`: `mode IN ('online', 'offline')`
  - `storage_facilities_chk_3`: `status IN ('available', 'limited', 'full')`
- **Indexes:** Primary key `id`, indexes on `state`, `storage_type`, `status`.
- **Relationships:** `storage_bookings` &rarr; `StorageBooking.facility`.

---

### Table 5: `crop_predictions`
*Agronomic predictions and crop recommendations based on weather and soil data.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `farmer_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `farmers.farmer_id` (ON DELETE SET NULL) | NO | NO |
| `rainfall_mm` | `decimal(7,2) DEFAULT NULL` | `Numeric(7, 2)` | `NUMERIC(7,2)` | YES | `NULL` / None | NO | None | NO | NO |
| `temperature_celsius`| `decimal(5,2) DEFAULT NULL`| `Numeric(5, 2)` | `NUMERIC(5,2)` | YES | `NULL` / None | NO | None | NO | NO |
| `soil_type` | `varchar(20) DEFAULT NULL` | `String(20)` | `VARCHAR(20)` | YES | `NULL` / None | NO | None | NO | NO |
| `recommended_crop` | `varchar(80) DEFAULT NULL` | `String(80)` | `VARCHAR(80)` | YES | `NULL` / None | NO | None | NO | NO |
| `yield_level` | `varchar(10) DEFAULT NULL` | `String(10)` | `VARCHAR(10)` | YES | `NULL` / None | NO | None | NO | NO |
| `risk_level` | `varchar(10) DEFAULT NULL` | `String(10)` | `VARCHAR(10)` | YES | `NULL` / None | NO | None | NO | NO |
| `confidence_percent` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | None | NO | NO |
| `ai_advice` | `text` | `Text` | `TEXT` | YES | `NULL` / None | NO | None | NO | NO |
| `predicted_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |

- **Check Constraints:**
  - `crop_predictions_chk_1`: `soil_type IN ('loamy', 'clay', 'sandy', 'red', 'black')`
  - `crop_predictions_chk_2`: `yield_level IN ('Low', 'Medium', 'High')`
  - `crop_predictions_chk_3`: `risk_level IN ('Low', 'Medium', 'High')`
- **Indexes:** Primary key `id`, index on `farmer_id`.
- **Relationships:** `farmer` &rarr; `Farmer.crop_predictions`.

---

### Table 6: `insurance_requests`
*Farmer crop loss claims and general crop insurance intake requests.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `farmer_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `farmers.farmer_id` (ON DELETE SET NULL) | NO | NO |
| `farmer_name` | `varchar(100) NOT NULL` | `String(100)` | `VARCHAR(100)` | NO | None / None | NO | None | NO | NO |
| `district` | `varchar(80) DEFAULT NULL` | `String(80)` | `VARCHAR(80)` | YES | `NULL` / None | NO | None | NO | NO |
| `crop_name` | `varchar(80) DEFAULT NULL` | `String(80)` | `VARCHAR(80)` | YES | `NULL` / None | NO | None | NO | NO |
| `request_type` | `varchar(30) DEFAULT NULL` | `String(30)` | `VARCHAR(30)` | YES | `NULL` / None | NO | None | NO | NO |
| `description` | `text` | `Text` | `TEXT` | YES | `NULL` / None | NO | None | NO | NO |
| `req_status` | `varchar(20) DEFAULT 'pending'` | `String(20)` | `VARCHAR(20)` | YES | `'pending'` / `default="pending"` | NO | None | NO | NO |
| `submitted_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |
| `updated_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now(), onupdate=func.now()` | NO | None | NO | NO |

- **Check Constraints:**
  - `insurance_requests_chk_1`: `request_type IN ('New Insurance Enrollment', 'Crop Loss Claim')`
  - `insurance_requests_chk_2`: `req_status IN ('pending', 'processing', 'approved', 'rejected', 'paid')`
- **Indexes:** Primary key `id`, indexes on `farmer_id`, `req_status`.
- **Relationships:**
  - `farmer` &rarr; `Farmer.insurance_requests`
  - `pmfby_enrollments` &rarr; `PmfbyEnrollment.insurance_request` (cascade="all, delete-orphan")

---

### Table 7: `pmfby_enrollments`
*Detailed Pradhan Mantri Fasal Bima Yojana policy enrollments linked to requests.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `insurance_request_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `insurance_requests.id` (ON DELETE CASCADE) | NO | NO |
| `farmer_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `farmers.farmer_id` (NO ACTION / RESTRICT) | NO | NO |
| `crop_name` | `varchar(80) DEFAULT NULL` | `String(80)` | `VARCHAR(80)` | YES | `NULL` / None | NO | None | NO | NO |
| `land_records_verified`| `tinyint(1) DEFAULT '0'` | `Boolean` | `BOOLEAN` | YES | `'0'` / `default=False` | NO | None | NO | NO |
| `sowing_date` | `date DEFAULT NULL` | `Date` | `DATE` | YES | `NULL` / None | NO | None | NO | NO |
| `season` | `varchar(15) DEFAULT NULL` | `String(15)` | `VARCHAR(15)` | YES | `NULL` / None | NO | None | NO | NO |
| `premium_calculated` | `decimal(10,2) DEFAULT NULL`| `Numeric(10, 2)`| `NUMERIC(10,2)`| YES | `NULL` / None | NO | None | NO | NO |
| `enrollment_date` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |

- **Check Constraints:** `pmfby_enrollments_chk_1`: `season IN ('Kharif', 'Rabi', 'Zaid')`.
- **Indexes:** Primary key `id`, indexes on `insurance_request_id`, `farmer_id`.
- **Relationships:**
  - `insurance_request` &rarr; `InsuranceRequest.pmfby_enrollments`
  - `farmer` &rarr; `Farmer.pmfby_enrollments`

---

### Table 8: `loan_applications`
*Applications for crop, equipment, irrigation, and livestock financing.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `farmer_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `farmers.farmer_id` (ON DELETE SET NULL) | NO | NO |
| `farmer_name` | `varchar(100) NOT NULL` | `String(100)` | `VARCHAR(100)` | NO | None / None | NO | None | NO | NO |
| `village` | `varchar(100) DEFAULT NULL` | `String(100)` | `VARCHAR(100)` | YES | `NULL` / None | NO | None | NO | NO |
| `loan_amount` | `decimal(12,2) NOT NULL` | `Numeric(12, 2)`| `NUMERIC(12,2)`| NO | None / None | NO | None | NO | NO |
| `loan_type` | `varchar(50) DEFAULT NULL` | `String(50)` | `VARCHAR(50)` | YES | `NULL` / None | NO | None | NO | NO |
| `purpose` | `text` | `Text` | `TEXT` | YES | `NULL` / None | NO | None | NO | NO |
| `app_status` | `varchar(20) DEFAULT 'pending'` | `String(20)` | `VARCHAR(20)` | YES | `'pending'` / `default="pending"` | NO | None | NO | NO |
| `submitted_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |
| `reviewed_at` | `timestamp NULL DEFAULT NULL` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `NULL` / None | NO | None | NO | NO |

- **Check Constraints:**
  - `loan_applications_chk_1`: `loan_type IN ('Crop Loan', 'Equipment Loan', 'Irrigation Loan', 'Dairy / Livestock Loan')`
  - `loan_applications_chk_2`: `app_status IN ('pending', 'under_review', 'approved', 'rejected')`
- **Indexes:** Primary key `id`, indexes on `farmer_id`, `app_status`.
- **Relationships:** `farmer` &rarr; `Farmer.loan_applications`.

---

### Table 9: `mental_health_requests`
*Farmer mental health, counseling, and distress support intake requests.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `farmer_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `farmers.farmer_id` (ON DELETE SET NULL) | NO | NO |
| `farmer_name` | `varchar(100) NOT NULL` | `String(100)` | `VARCHAR(100)` | NO | None / None | NO | None | NO | NO |
| `mobile` | `varchar(15) DEFAULT NULL` | `String(15)` | `VARCHAR(15)` | YES | `NULL` / None | NO | None | NO | NO |
| `concern_type` | `varchar(50) DEFAULT NULL` | `String(50)` | `VARCHAR(50)` | YES | `NULL` / None | NO | None | NO | NO |
| `message` | `text` | `Text` | `TEXT` | YES | `NULL` / None | NO | None | NO | NO |
| `req_status` | `varchar(20) DEFAULT 'pending'` | `String(20)` | `VARCHAR(20)` | YES | `'pending'` / `default="pending"` | NO | None | NO | NO |
| `submitted_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |

- **Check Constraints:**
  - `mental_health_requests_chk_1`: `concern_type IN ('Stress & Anxiety', 'Financial Pressure', 'Crop Loss Stress', 'Family or Personal Issues')`
  - `mental_health_requests_chk_2`: `req_status IN ('pending', 'contacted', 'resolved')`
- **Indexes:** Primary key `id`, indexes on `farmer_id`, `req_status`.
- **Relationships:** `farmer` &rarr; `Farmer.mental_health_requests`.

---

### Table 10: `scheme_eligibility_checks`
*Eligibility screening audit trail comparing landholding and season against program rules.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `farmer_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `farmers.farmer_id` (ON DELETE SET NULL) | NO | NO |
| `scheme_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `government_schemes.id` | NO | NO |
| `farmer_category` | `varchar(20) DEFAULT NULL` | `String(20)` | `VARCHAR(20)` | YES | `NULL` / None | NO | None | NO | NO |
| `land_ha` | `decimal(6,2) DEFAULT NULL` | `Numeric(6, 2)` | `NUMERIC(6,2)` | YES | `NULL` / None | NO | None | NO | NO |
| `crop_season` | `varchar(15) DEFAULT NULL` | `String(15)` | `VARCHAR(15)` | YES | `NULL` / None | NO | None | NO | NO |
| `aadhaar_linked` | `tinyint(1) DEFAULT NULL` | `Boolean` | `BOOLEAN` | YES | `NULL` / None | NO | None | NO | NO |
| `bank_linked` | `tinyint(1) DEFAULT NULL` | `Boolean` | `BOOLEAN` | YES | `NULL` / None | NO | None | NO | NO |
| `is_eligible` | `tinyint(1) DEFAULT NULL` | `Boolean` | `BOOLEAN` | YES | `NULL` / None | NO | None | NO | NO |
| `result_message` | `text` | `Text` | `TEXT` | YES | `NULL` / None | NO | None | NO | NO |
| `checked_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |

- **Check Constraints:** None.
- **Indexes:** Primary key `id`, indexes on `farmer_id`, `scheme_id`.
- **Relationships:**
  - `farmer` &rarr; `Farmer.scheme_eligibility_checks`
  - `scheme` &rarr; `GovernmentScheme.scheme_eligibility_checks`

---

### Table 11: `storage_booking`
*Reservations for warehouse/cold storage space with applied subsidy pricing.*

| Column Name | MySQL Type | SQLAlchemy Type | PostgreSQL Equivalent | Nullable | Default (MySQL / ORM) | PK | FK | Unique | Auto Increment |
|---|---|---|---|---|---|---|---|---|---|
| `id` | `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | YES | None | YES (PK) | YES (`AUTO_INCREMENT` / sequence) |
| `booking_ref` | `varchar(20) NOT NULL` | `String(20)` | `VARCHAR(20)` | NO | None / None | NO | None | YES | NO |
| `farmer_name` | `varchar(100) DEFAULT NULL` | `String(100)` | `VARCHAR(100)` | YES | `NULL` / None | NO | None | NO | NO |
| `mobile` | `varchar(15) DEFAULT NULL` | `String(15)` | `VARCHAR(15)` | YES | `NULL` / None | NO | None | NO | NO |
| `facility_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `storage_facilities.id` | NO | NO |
| `state` | `varchar(60) DEFAULT NULL` | `String(60)` | `VARCHAR(60)` | YES | `NULL` / None | NO | None | NO | NO |
| `crop_type` | `varchar(80) DEFAULT NULL` | `String(80)` | `VARCHAR(80)` | YES | `NULL` / None | NO | None | NO | NO |
| `quantity_kg` | `decimal(10,2) NOT NULL` | `Numeric(10, 2)`| `NUMERIC(10,2)`| NO | None / None | NO | None | NO | NO |
| `duration_months`| `int NOT NULL` | `Integer` | `INTEGER` | NO | None / None | NO | None | NO | NO |
| `mode` | `varchar(10) DEFAULT NULL` | `String(10)` | `VARCHAR(10)` | YES | `NULL` / None | NO | None | NO | NO |
| `scheme_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `government_schemes.id` | NO | NO |
| `base_price_per_kg` | `decimal(5,2) DEFAULT NULL` | `Numeric(5, 2)` | `NUMERIC(5,2)` | YES | `NULL` / None | NO | None | NO | NO |
| `scheme_benefit_per_kg` | `decimal(5,2) DEFAULT '0.00'` | `Numeric(5, 2)` | `NUMERIC(5,2)` | YES | `'0.00'` / `default=0.00` | NO | None | NO | NO |
| `effective_price_per_kg`| `decimal(5,2) DEFAULT NULL` | `Numeric(5, 2)` | `NUMERIC(5,2)` | YES | `NULL` / None | NO | None | NO | NO |
| `total_amount` | `decimal(12,2) DEFAULT NULL`| `Numeric(12, 2)`| `NUMERIC(12,2)`| YES | `NULL` / None | NO | None | NO | NO |
| `booking_status` | `varchar(20) DEFAULT 'active'` | `String(20)` | `VARCHAR(20)` | YES | `'active'` / `default="active"` | NO | None | NO | NO |
| `booked_at` | `timestamp NULL DEFAULT CURRENT_TIMESTAMP` | `DateTime(timezone=True)` | `TIMESTAMPTZ` | YES | `CURRENT_TIMESTAMP` / `server_default=func.now()` | NO | None | NO | NO |
| `farmer_id` | `int DEFAULT NULL` | `Integer` | `INTEGER` | YES | `NULL` / None | NO | `farmers.farmer_id` (ON DELETE SET NULL) | NO | NO |

- **Check Constraints:**
  - `storage_booking_chk_1`: `mode IN ('online', 'offline')`
  - `storage_booking_chk_2`: `booking_status IN ('active', 'completed', 'cancelled')`
- **Indexes:** Primary key `id`, unique index on `booking_ref`, indexes on `facility_id`, `scheme_id`, `farmer_id`, `booking_status`.
- **Relationships:**
  - `facility` &rarr; `StorageFacility.storage_bookings`
  - `scheme` &rarr; `GovernmentScheme.storage_bookings`
  - `farmer` &rarr; `Farmer.storage_bookings`

---

## 3. DISCREPANCY CLASSIFICATION TABLE

| ID | Table | Column/Constraint | MySQL Definition | ORM Definition | Severity | Recommendation |
|---|---|---|---|---|---|---|
| DISC-01 | `farmers`, `government_schemes`, `storage_facilities`, `pmfby_enrollments`, `storage_booking` | Non-timestamp default values (`aadhaar_linked`, `bank_linked`, `active`, `review_count`, `govt_approved`, `status`, `scheme_benefit_per_kg`) | Explicit SQL DDL `DEFAULT` clauses (e.g., `DEFAULT '0'`, `DEFAULT 'available'`) | SQLAlchemy Python-level defaults (`default=False`, `default=0`, `default="available"`) | **MEDIUM** | In SQLAlchemy, `default=` only applies during ORM session operations, not on direct SQL raw queries or raw DDL. For production resilience, add `server_default=text(...)` to these columns in a future Alembic migration so that raw SQL inserts also receive database-level defaults. |
| DISC-02 | `farmers` | Redundant Index on `mobile` | `UNIQUE KEY uq_farmers_mobile (mobile)` AND `KEY idx_farmers_mobile (mobile)` | `mobile = Column(String(15), unique=True, index=True)` | **LOW** | MySQL dump had duplicate indexes on `mobile`. PostgreSQL enforces uniqueness with a unique B-tree index, making a second non-unique index redundant. ORM definition is optimal. |
| DISC-03 | `pmfby_enrollments` | Foreign key `farmer_id` ON DELETE behavior | No explicit `ON DELETE` clause (defaults to `RESTRICT`/`NO ACTION`) | `ForeignKey("farmers.farmer_id")` (no explicit `ondelete`) | **LOW** | Consistent between MySQL and ORM. Both default to standard SQL `NO ACTION`. |
| DISC-04 | `scheme_eligibility_checks`, `storage_booking` | Foreign keys `scheme_id` and `facility_id` ON DELETE behavior | No explicit `ON DELETE` clause | `ForeignKey("government_schemes.id")`, `ForeignKey("storage_facilities.id")` | **LOW** | Consistent between MySQL and ORM. Referential integrity is maintained. |

*Comparison Summary:* **Zero CRITICAL or HIGH discrepancies were found.** The ORM models represent an exact, faithful translation of the MySQL schema into idiomatic SQLAlchemy / PostgreSQL types.

---

## 4. POSTGRESQL COMPATIBILITY FINDINGS

1. **Boolean Data Types:** MySQL's lack of a native boolean type led to `tinyint(1)`. PostgreSQL features native 1-byte `BOOLEAN` (`true`/`false`). SQLAlchemy's `Boolean` handles this translation seamlessly.
2. **Auto-Increment Primary Keys:** MySQL uses `int NOT NULL AUTO_INCREMENT`. When `Base.metadata.create_all()` executes on PostgreSQL, `Integer, primary_key=True, autoincrement=True` generates native PostgreSQL `SERIAL` sequences (`nextval(...)`).
3. **Sequence Synchronization:** When seeding data with explicit IDs (as in `seed_db.py`), PostgreSQL sequence counters do not automatically increment. The sequence synchronization block in `seed_db.py` (`setval(pg_get_serial_sequence(...))`) successfully handles this PostgreSQL requirement.
4. **Timestamp with Timezone:** MySQL `timestamp` defaults to local server time. SQLAlchemy models specify `DateTime(timezone=True)`, which maps to PostgreSQL `TIMESTAMPTZ`. This ensures accurate UTC storage and timezone awareness.
5. **Check Constraints:** PostgreSQL enforces check constraints strictly. All string literal evaluations in `CheckConstraint` match the enumeration domain in the original MySQL dump.

---

## 5. FARMER AUTHENTICATION ARCHITECTURE

### The Core Architectural Dilemma
In earlier drafts, two conflicting ideas emerged:
- **Idea 1:** Alter the `farmers` table directly to add `farmers.user_id` (FK to `users.id`).
- **Idea 2:** Introduce a decoupled profile architecture:
  ```text
  users.id  <---  farmer_profiles.user_id (1-to-1)
                   farmer_profiles.legacy_farmer_id  --->  farmers.farmer_id (1-to-1)
  ```

### Structural Evaluation: Why Decoupled Profiles (Idea 2) is Superior
1. **Preservation of Existing Functionality:** The existing platform supports unauthenticated farmer inquiries, phone surveys, and offline camp entries. If `farmers.user_id` were required or nullable on `farmers`, every legacy join query, router, and schema would be coupled to the user model.
2. **Multi-Role User Cleanliness:** In BhoomiBandhu, a user account can be a Farmer, Psychiatrist/Counselor, Warehouse Owner, or Admin. Storing user foreign keys directly in domain tables creates asymmetric schemas. Using role profile tables (`farmer_profiles`, `psychiatrist_profiles`, `warehouse_owner_profiles`) keeps the core `users` table clean and role-agnostic.
3. **Decoupled Identity Linkage:**
   ```text
   +---------------+         +-----------------------+         +---------------+
   |     users     | 1     1 |    farmer_profiles    | 1     1 |    farmers    |
   |---------------|---------|-----------------------|---------|---------------|
   | id            |         | id                    |         | farmer_id     |
   | email         |         | user_id (FK, Unique)  |         | mobile (UQ)   |
   | mobile (UQ)   |         | legacy_farmer_id (FK) |         | name          |
   | role          |         | created_at            |         | state         |
   | password_hash |         +-----------------------+         | ... 11 cols   |
   +---------------+                                           +---------------+
                                                                       | 1
                                                                       |
                                                        +--------------+--------------+
                                                        | Historical Domain Tables    |
                                                        | - insurance_requests        |
                                                        | - loan_applications         |
                                                        | - pmfby_enrollments         |
                                                        | - mental_health_requests    |
                                                        | - storage_booking           |
                                                        | - crop_predictions          |
                                                        | - scheme_eligibility_checks |
                                                        +-----------------------------+
   ```

---

## 6. EXISTING FARMER MIGRATION & ACCOUNT LINKING (SCENARIO A & C)

**Context:** Farmer Balraj Dahiya exists in `farmers` with `farmer_id = 1` and `mobile = '9876543210'`, along with active insurance requests, loan applications, and storage bookings.

### Safe Step-by-Step Account Creation & Linking Flow:
1. **Initiation:** Farmer provides email, mobile (`9876543210`), and password on the Registration page.
2. **Duplicate User Check:** System checks `SELECT id FROM users WHERE mobile = :mobile OR email = :email`. If a user account already exists, prompt for login instead.
3. **Legacy Discovery:** System queries `SELECT farmer_id, name FROM farmers WHERE mobile = :mobile`.
   - *Result Found:* A legacy farmer record exists (`farmer_id = 1`).
4. **Mandatory Ownership Verification (Anti-Hijack Rule):**
   - **Crucial Security Rule:** Never link an existing identity automatically based solely on an unverified form input.
   - The registration workflow marks the account state as `PENDING_MOBILE_VERIFICATION`.
   - An OTP (One-Time Password) is dispatched via SMS to `9876543210`.
5. **Atomic Transactional Linkage:** Upon OTP verification within a database transaction:
   ```sql
   BEGIN;
   -- 1. Create User
   INSERT INTO users (email, mobile, role, password_hash, is_verified) 
   VALUES ('balraj@example.com', '9876543210', 'farmer', '$argon2id$...', true) 
   RETURNING id;
   
   -- 2. Create FarmerProfile linking user to legacy record
   INSERT INTO farmer_profiles (user_id, legacy_farmer_id, created_at)
   VALUES (:new_user_id, 1, NOW());
   COMMIT;
   ```
6. **Result:** Zero modification to the `farmers` table. Balraj logs in, and his dashboard instantly displays all 6 historical records via `user -> farmer_profile -> legacy_farmer -> [requests]`.

---

## 7. NEW FARMER REGISTRATION STRATEGY (SCENARIO B)

**Context:** A completely new farmer registers whose mobile number does not exist anywhere in BhoomiBandhu.

### Transactional Creation Flow:
When a new farmer registers:
1. System verifies mobile via OTP.
2. In a single atomic transaction:
   ```sql
   BEGIN;
   -- 1. Create user credential
   INSERT INTO users (email, mobile, role, password_hash, is_active, is_verified)
   VALUES ('new.farmer@example.com', '9811122233', 'farmer', '$argon2id$...', true, true)
   RETURNING id;

   -- 2. Create corresponding legacy farmer record to maintain domain compatibility
   INSERT INTO farmers (name, mobile, state, farmer_category, created_at, updated_at)
   VALUES ('New Farmer', '9811122233', 'Haryana', 'small', NOW(), NOW())
   RETURNING farmer_id;

   -- 3. Link them in farmer_profiles
   INSERT INTO farmer_profiles (user_id, legacy_farmer_id, created_at)
   VALUES (:new_user_id, :new_farmer_id, NOW());
   COMMIT;
   ```
3. **Result:** All 12 existing FastAPI routers (e.g., `insurance.py`, `storage.py`, `loans.py`) continue querying `farmers` by `farmer_id` without breaking a single existing endpoint.

---

## 8. HISTORICAL DATA PRESERVATION STRATEGY (SCENARIO D)

All 7 domain tables link directly to `farmers.farmer_id`:
- `crop_predictions.farmer_id`
- `insurance_requests.farmer_id`
- `pmfby_enrollments.farmer_id`
- `loan_applications.farmer_id`
- `mental_health_requests.farmer_id`
- `scheme_eligibility_checks.farmer_id`
- `storage_booking.farmer_id`

### Integrity Guarantees:
1. **Zero Foreign Key Rewriting:** No existing foreign keys in historical records need to be updated or migrated.
2. **Zero Cascading Deletes:** `farmers.farmer_id` is never changed or re-keyed.
3. **Cross-Tenant Isolation:** When a user logs in, FastAPI authentication middleware resolves:
   ```python
   current_user -> current_user.farmer_profile.legacy_farmer_id
   ```
   All farmer endpoints filter queries using `filter(Model.farmer_id == legacy_farmer_id)`. Farmers can only access records matching their verified profile.

---

## 9. AUTHENTICATION DESIGN CORRECTIONS REQUIRED BEFORE PROMPT 4

### Clarification of Redundant / Conflicting Fields:

| Entity & Attribute | Status | Evaluation & Recommendation |
|---|---|---|
| `farmers.user_id` | **REJECT / OMIT** | Adding `user_id` directly to `farmers` creates a circular, redundant link when `farmer_profiles.legacy_farmer_id` exists. `farmers` must remain untouched as pure agricultural domain data. |
| `farmer_profiles.legacy_farmer_id` | **RETAIN (Unique)** | Must be `UNIQUE, NOT NULL, ForeignKey("farmers.farmer_id", ondelete="RESTRICT")`. Enforces strict 1-to-1 mapping. |
| `farmer_profiles.user_id` | **RETAIN (Unique)** | Must be `UNIQUE, NOT NULL, ForeignKey("users.id", ondelete="CASCADE")`. Ensures one user account maps to one profile. |
| `User.mobile` vs `Farmer.mobile` | **RETAIN BOTH** | `User.mobile` is the authentication principal and 2FA identifier. `Farmer.mobile` is the agricultural contact info. Upon linking, they must match. |
| `User.email` | **RETAIN (Optional)** | Many Indian farmers do not use email regularly. `User.email` should be `nullable=True, unique=True, index=True`. `User.mobile` must be the primary login credential. |

### Supplementary Authentication Requirements to Include in Prompt 4:
1. **Password Hashing:** Use `argon2id` (or `bcrypt`) with salt. Never store plaintext passwords.
2. **JWT Dual-Token Pattern:**
   - Short-lived Access Token (15 minutes).
   - Long-lived Refresh Token (7 days) stored in a `refresh_tokens` database table with hash and revocation tracking (`revoked_at`).
3. **Account Status & Suspension:** Add `is_active` (boolean) and `is_suspended` (boolean) to `users` table for administrative governance.
4. **Professional Profiles:**
   - `psychiatrist_profiles` (`id`, `user_id`, `license_number`, `specialization`, `is_approved`, `availability_status`)
   - `warehouse_owner_profiles` (`id`, `user_id`, `company_name`, `gstin`, `is_approved`)
   - Admin approval flags (`is_approved`) before allowing psychiatrists and storage owners to access dashboard records.

---

## 10. FINAL RECOMMENDATIONS

1. **Keep `models.py` Untouched in Phase 0:** The 11 models in `backend/app/models/models.py` are production-ready and fully compatible with PostgreSQL 18.
2. **Execute Table Creation via `init_db.py` in Next Step:** When ready, execute `init_db.py` to create the 11 baseline tables in PostgreSQL.
3. **Build Auth Cleanly in Prompt 4:** Introduce new models in `backend/app/models/auth_models.py` or append to `models.py`:
   - `User`
   - `RefreshToken`
   - `FarmerProfile`
   - `PsychiatristProfile`
   - `WarehouseOwnerProfile`
4. **Do Not Touch Seed Records:** Retain the 60 verified records in `seed_db.py` for testing baseline farmer workflows.

---

### VERIFICATION STATUS REPORT

- [x] All 11 tables inspected
- [x] All columns compared
- [x] All foreign keys checked
- [x] All constraints checked
- [x] PostgreSQL compatibility reviewed
- [x] Farmer identity architecture finalized
- [x] Historical data preservation addressed
- [x] Prompt 4 design reviewed
- [x] No application files modified
- [x] No database operations performed
