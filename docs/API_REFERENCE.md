# BhoomiBandhu — API Reference & Route Specification

**Document Status:** Verified Baseline (Phase 0 Audit)  
**Date:** October 18, 2026  
**Auditor / Team Lead:** Pranav (Lead & Security)  

This document specifies all verified API endpoints present in the BhoomiBandhu codebase, documenting both the legacy Express (`server.js`) implementation and the target FastAPI (`backend/app/routers/`) implementation.

---

## 1. Executive Summary of API Status

- **Total Endpoints Audited:** 16 routes
- **FastAPI / Express Parity:** Both backends implement identical route paths and JSON contracts for all 16 endpoints.
- **Authentication Status:** Currently **0% enforced**. All endpoints are open and unauthenticated.
- **Input Validation:** Express uses rudimentary runtime sanitizers; FastAPI utilizes Pydantic schemas (`backend/app/schemas/schemas.py`).
- **Standardized Status:** `Implemented — Not Yet Verified` (Requires Phase 1 auth & Phase 9 testing).

---

## 2. API Endpoints by Module

### 2.1 System & Health

#### `GET /api/health`
- **Purpose:** Verifies backend runtime and database connectivity.
- **Auth Required:** None (Public)
- **FastAPI Implementation:** `backend/app/routers/health.py`
- **Express Implementation:** `server.js:L50`
- **Response (200 OK):**
  ```json
  {
    "status": "ok",
    "service": "bhoomi-bandhu-api",
    "timestamp": "2026-10-18T20:25:00.000Z",
    "database": {
      "configured": true,
      "connected": true,
      "driver": "postgresql" // or "mysql2"
    }
  }
  ```

---

### 2.2 External Integrations (Weather & AI Chat)

#### `GET /api/weather`
- **Purpose:** Proxies OpenWeatherMap current weather requests for a given city without exposing API keys to the browser.
- **Auth Required:** None (Public)
- **Query Parameters:** `city` (string, required, e.g. `?city=Pune`)
- **FastAPI Implementation:** `backend/app/routers/weather.py`
- **Express Implementation:** `server.js:L68`
- **Response (200 OK):**
  ```json
  {
    "city": "Pune",
    "temp_c": 26.5,
    "condition": "Clear",
    "humidity": 55,
    "wind_kmh": 12.0,
    "icon": "01d",
    "source": "openweathermap"
  }
  ```
- **Error Responses:** `400 Bad Request` (city missing), `502 Bad Gateway` (external API unreachable).

#### `POST /api/gemini`
- **Purpose:** Proxies agricultural queries to LLM (Groq / Gemini) with an agronomic system prompt.
- **Auth Required:** None (Public - Rate limiting required in Phase 1)
- **FastAPI Implementation:** `backend/app/routers/ai_chat.py`
- **Express Implementation:** `server.js:L105`
- **Request Body:**
  ```json
  {
    "message": "What is the recommended fertilizer for wheat in loamy soil?",
    "history": []
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "reply": "For wheat in loamy soil, balanced NPK application (120:60:40 kg/ha) is recommended..."
  }
  ```

---

### 2.3 Catalogues & Schemes

#### `GET /api/crops`
- **Purpose:** Retrieves list of reference crops and categories.
- **Auth Required:** None (Public)
- **FastAPI Implementation:** `backend/app/routers/catalogues.py`
- **Express Implementation:** `server.js:L330`
- **Response (200 OK):**
  ```json
  {
    "crops": [
      { "crop_id": 1, "crop_name": "Wheat", "crop_category": "Cereal" },
      { "crop_id": 2, "crop_name": "Rice", "crop_category": "Cereal" }
    ]
  }
  ```

#### `GET /api/government-schemes`
- **Purpose:** Lists active government schemes stored in the database.
- **Auth Required:** None (Public)
- **FastAPI Implementation:** `backend/app/routers/catalogues.py`
- **Express Implementation:** `server.js:L345`
- **Response (200 OK):** Array of scheme objects with `id`, `slug`, `name`, `scheme_type`, `benefit_summary`, `storage_benefit_per_kg`.

#### `GET /api/external-government-schemes`
- **Purpose:** Optional live proxy fetching schemes from an external government API provider configured in `.env`.
- **Auth Required:** None (Server-to-Server authenticated)
- **FastAPI Implementation:** `backend/app/routers/external_schemes.py`
- **Express Implementation:** `server.js:L365`

#### `POST /api/scheme-eligibility-checks`
- **Purpose:** Records farmer self-assessment for government scheme eligibility.
- **Auth Required:** Planned for Phase 1 (Currently public)
- **FastAPI Implementation:** `backend/app/routers/schemes.py`
- **Express Implementation:** `server.js:L285`
- **Request Body:**
  ```json
  {
    "farmer_name": "Ramesh Kumar",
    "mobile": "9876543210",
    "state": "Maharashtra",
    "scheme_id": 1,
    "land_holding_ha": 1.5,
    "annual_income": 85000,
    "farmer_category": "small"
  }
  ```
- **Response (201 Created):** Recorded eligibility check object with `status: "eligible"` or `"ineligible"`.

---

### 2.4 Farmer Profiles

#### `POST /api/farmers`
- **Purpose:** Creates or updates a farmer profile.
- **Auth Required:** Planned for Phase 1 (Currently unauthenticated upsert by mobile)
- **FastAPI Implementation:** `backend/app/routers/farmers.py`
- **Express Implementation:** `server.js:L155`
- **Security Flaw:** Mobile number is used as sole identifier; caller can mutate existing profiles.
- **Request Body:**
  ```json
  {
    "name": "Ramesh Kumar",
    "mobile": "9876543210",
    "state": "Maharashtra",
    "district": "Pune",
    "village": "Haveli",
    "primary_crop": "Wheat"
  }
  ```
- **Response (200 OK):** `{ "farmer_id": 1, "name": "...", "status": "updated" }`

---

### 2.5 Insurance & PMFBY (Module Owner: Sagar)

#### `POST /api/insurance-requests`
- **Purpose:** Submits a PMFBY crop insurance enrollment or claim enquiry.
- **Auth Required:** Planned for Phase 1
- **FastAPI Implementation:** `backend/app/routers/insurance.py`
- **Express Implementation:** `server.js:L185`
- **Request Body:**
  ```json
  {
    "name": "Ramesh Kumar",
    "mobile": "9876543210",
    "state": "Maharashtra",
    "crop_name": "Wheat",
    "season": "rabi",
    "year": 2026,
    "sum_insured": 50000.00,
    "premium_farmer": 1000.00,
    "area_hectares": 2.0
  }
  ```
- **Response (201 Created):** Created request record with `status: "submitted"` and reference ID.

#### `GET /api/insurance-requests`
- **Purpose:** Retrieves insurance requests submitted by a mobile number.
- **Auth Required:** Planned for Phase 1 (Critical IDOR flaw: accepts unauthenticated `?mobile=...`)
- **FastAPI Implementation:** `backend/app/routers/insurance.py`
- **Express Implementation:** `server.js:L220`
- **Query Parameter:** `mobile` (string, required)
- **Response (200 OK):** List of insurance requests for the phone number.

---

### 2.6 Storage & Warehouses (Module Owner: Himanshu)

#### `GET /api/storage-facilities`
- **Purpose:** Lists available warehouse and cold storage facilities with capacity and pricing.
- **Auth Required:** None (Public directory)
- **FastAPI Implementation:** `backend/app/routers/storage.py`
- **Express Implementation:** `server.js:L390`
- **Query Parameters (Optional):** `state`, `district`, `storage_type`
- **Response (200 OK):** List of storage facilities with coordinates, capacity, price, and ratings.

#### `POST /api/storage-bookings`
- **Purpose:** Creates a storage booking reservation for a farmer at a warehouse.
- **Auth Required:** Planned for Phase 1
- **FastAPI Implementation:** `backend/app/routers/storage.py`
- **Express Implementation:** `server.js:L420`
- **Request Body:**
  ```json
  {
    "facility_id": 1,
    "farmer_name": "Ramesh Kumar",
    "mobile": "9876543210",
    "state": "Maharashtra",
    "crop_stored": "Wheat",
    "quantity_tons": 5.0,
    "duration_months": 3,
    "start_date": "2026-11-01"
  }
  ```
- **Response (201 Created):** Created booking with calculated `total_cost`, `subsidy_amount`, and `status: "booked"`.

#### `GET /api/storage-bookings`
- **Purpose:** Queries bookings for a farmer by mobile number.
- **Auth Required:** Planned for Phase 1 (Critical IDOR flaw: accepts unauthenticated `?mobile=...`)
- **FastAPI Implementation:** `backend/app/routers/storage.py`
- **Express Implementation:** `server.js:L465`

---

### 2.7 Mental Health & Wellbeing (Module Owner: Nora)

#### `POST /api/mental-health-requests`
- **Purpose:** Submits a farmer mental-wellbeing consultation request.
- **Auth Required:** Planned for Phase 1
- **FastAPI Implementation:** `backend/app/routers/mental_health.py`
- **Express Implementation:** `server.js:L260`
- **Request Body:**
  ```json
  {
    "farmer_name": "Ramesh Kumar",
    "mobile": "9876543210",
    "state": "Maharashtra",
    "preferred_language": "Hindi",
    "issue_description": "Experiencing crop loss anxiety",
    "urgency": "medium"
  }
  ```
- **Response (201 Created):** `{ "request_id": 12, "status": "pending_assignment" }`
- **Clinical Privacy Notice:** Endpoint currently persists text directly to the database without consent recording or clinical role separation. To be resolved in Phase 6.

---

### 2.8 Loans & Financial Assistance (Module Owner: Sagar)

#### `POST /api/loan-applications`
- **Purpose:** Submits an agricultural credit/loan interest application.
- **Auth Required:** Planned for Phase 1
- **FastAPI Implementation:** `backend/app/routers/loans.py`
- **Express Implementation:** `server.js:L240`

---

### 2.9 Machine Learning & Predictions (Lead: Pranav / Yuvraj)

#### `POST /api/crop-prediction/predict` (FastAPI Exclusive)
- **Purpose:** Evaluates rainfall, temperature, soil, season, and irrigation against 120-sample agronomic dataset via Python kNN service.
- **Auth Required:** None (Public)
- **FastAPI Implementation:** `backend/app/routers/predictions.py`
- **Request Body:**
  ```json
  {
    "rainfall": 200,
    "temperature": 22.5,
    "soil_type": "loamy",
    "season": "rabi",
    "irrigation": "irrigated"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "recommended_crop": "Wheat",
    "confidence_score": 0.88,
    "yield_level": "High",
    "risk_level": "Low",
    "nearest_neighbors": [...]
  }
  ```

#### `POST /api/crop-predictions`
- **Purpose:** Saves a crop prediction result to the farmer's history.
- **FastAPI Implementation:** `backend/app/routers/predictions.py`
- **Express Implementation:** `server.js:L310`
