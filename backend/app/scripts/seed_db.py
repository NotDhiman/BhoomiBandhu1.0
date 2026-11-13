import sys
from pathlib import Path
from decimal import Decimal
from datetime import datetime, date

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from sqlalchemy import text
from app.core.database import SessionLocal
from app.models import (
    Crop,
    Farmer,
    GovernmentScheme,
    StorageFacility,
    CropPrediction,
    InsuranceRequest,
    PmfbyEnrollment,
    LoanApplication,
    MentalHealthRequest,
    SchemeEligibilityCheck,
    StorageBooking,
)


def seed_db():
    db = SessionLocal()
    try:
        print("Checking existing records...")
        # 1. Crops (9 rows)
        crops_data = [
            {"crop_id": 1, "crop_name": "Wheat", "crop_category": "Cereal"},
            {"crop_id": 2, "crop_name": "Rice", "crop_category": "Cereal"},
            {"crop_id": 3, "crop_name": "Bajra", "crop_category": "Cereal"},
            {"crop_id": 4, "crop_name": "Cotton", "crop_category": "Cash Crop"},
            {"crop_id": 5, "crop_name": "Sugarcane", "crop_category": "Cash Crop"},
            {"crop_id": 6, "crop_name": "Potato", "crop_category": "Vegetable"},
            {"crop_id": 7, "crop_name": "Onion", "crop_category": "Vegetable"},
            {"crop_id": 8, "crop_name": "Tomato", "crop_category": "Vegetable"},
            {"crop_id": 9, "crop_name": "Maize", "crop_category": "Cereal"},
        ]
        for item in crops_data:
            existing = db.query(Crop).filter_by(crop_id=item["crop_id"]).first()
            if not existing:
                db.add(Crop(**item))

        # 2. Farmers (6 rows)
        farmers_data = [
            {
                "farmer_id": 1,
                "name": "Balraj Dahiya",
                "mobile": "9876543210",
                "state": "Haryana",
                "email": "balraj.dahiya@example.com",
                "district": "Panipat",
                "village": "Israna",
                "farmer_category": "small",
                "land_holding_ha": Decimal("1.80"),
                "primary_crop": "Wheat",
                "aadhaar_linked": True,
                "bank_linked": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:58:52"),
                "updated_at": datetime.fromisoformat("2026-10-03 03:58:52"),
            },
            {
                "farmer_id": 2,
                "name": "Sagar Baliyan",
                "mobile": "9876543215",
                "state": "Haryana",
                "email": "sagar.baliyan@example.com",
                "district": "Yamunanagar",
                "village": "Jagadhri",
                "farmer_category": "marginal",
                "land_holding_ha": Decimal("1.70"),
                "primary_crop": "Wheat",
                "aadhaar_linked": True,
                "bank_linked": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:58:52"),
                "updated_at": datetime.fromisoformat("2026-10-03 03:58:52"),
            },
            {
                "farmer_id": 3,
                "name": "Satbir Malik",
                "mobile": "9876543211",
                "state": "Haryana",
                "email": "satbir.malik@example.com",
                "district": "Yamunanagar",
                "village": "Radaur",
                "farmer_category": "marginal",
                "land_holding_ha": Decimal("1.20"),
                "primary_crop": "Sugarcane",
                "aadhaar_linked": True,
                "bank_linked": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:58:52"),
                "updated_at": datetime.fromisoformat("2026-10-03 03:58:52"),
            },
            {
                "farmer_id": 4,
                "name": "Surender Hooda",
                "mobile": "9876543212",
                "state": "Haryana",
                "email": "surender.hooda@example.com",
                "district": "Karnal",
                "village": "Nilokheri",
                "farmer_category": "large",
                "land_holding_ha": Decimal("5.50"),
                "primary_crop": "Rice",
                "aadhaar_linked": True,
                "bank_linked": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:58:52"),
                "updated_at": datetime.fromisoformat("2026-10-03 03:58:52"),
            },
            {
                "farmer_id": 5,
                "name": "Kuldeep Sangwan",
                "mobile": "9876543213",
                "state": "Haryana",
                "email": "kuldeep.sangwan@example.com",
                "district": "Rohtak",
                "village": "Sampla",
                "farmer_category": "small",
                "land_holding_ha": Decimal("2.10"),
                "primary_crop": "Wheat",
                "aadhaar_linked": True,
                "bank_linked": False,
                "created_at": datetime.fromisoformat("2026-10-03 03:58:52"),
                "updated_at": datetime.fromisoformat("2026-10-03 03:58:52"),
            },
            {
                "farmer_id": 6,
                "name": "Mahender Phogat",
                "mobile": "9876543214",
                "state": "Haryana",
                "email": "mahender.phogat@example.com",
                "district": "Bhiwani",
                "village": "Tosham",
                "farmer_category": "marginal",
                "land_holding_ha": Decimal("1.50"),
                "primary_crop": "Bajra",
                "aadhaar_linked": False,
                "bank_linked": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:58:52"),
                "updated_at": datetime.fromisoformat("2026-10-03 03:58:52"),
            },
        ]
        for item in farmers_data:
            existing = db.query(Farmer).filter_by(farmer_id=item["farmer_id"]).first()
            if not existing:
                db.add(Farmer(**item))

        # 3. Government Schemes (6 rows)
        schemes_data = [
            {
                "id": 1,
                "slug": "pmkisan",
                "name": "PM-KISAN Samman Nidhi",
                "scheme_type": "central",
                "benefit_summary": "₹6000 annual income support for small & marginal farmers",
                "storage_benefit_per_kg": Decimal("0.50"),
                "active": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:53:12"),
            },
            {
                "id": 2,
                "slug": "pmfby",
                "name": "Pradhan Mantri Fasal Bima Yojana",
                "scheme_type": "central",
                "benefit_summary": "Crop insurance against natural calamities, pests & diseases",
                "storage_benefit_per_kg": Decimal("0.00"),
                "active": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:53:12"),
            },
            {
                "id": 3,
                "slug": "kcc",
                "name": "Kisan Credit Card",
                "scheme_type": "central",
                "benefit_summary": "Short-term agricultural credit at subsidised interest rates",
                "storage_benefit_per_kg": Decimal("0.00"),
                "active": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:53:12"),
            },
            {
                "id": 4,
                "slug": "gramin_bhandaran",
                "name": "Gramin Bhandaran Yojana",
                "scheme_type": "central",
                "benefit_summary": "Subsidy for rural warehouse/cold-storage infrastructure",
                "storage_benefit_per_kg": Decimal("0.70"),
                "active": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:53:12"),
            },
            {
                "id": 5,
                "slug": "enam",
                "name": "e-NAM",
                "scheme_type": "central",
                "benefit_summary": "Online national agricultural market for price discovery",
                "storage_benefit_per_kg": Decimal("0.00"),
                "active": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:53:12"),
            },
            {
                "id": 6,
                "slug": "state_subsidy",
                "name": "State Subsidy (Generic)",
                "scheme_type": "state",
                "benefit_summary": "State-level crop & storage subsidy",
                "storage_benefit_per_kg": Decimal("1.00"),
                "active": True,
                "created_at": datetime.fromisoformat("2026-10-03 03:53:12"),
            },
        ]
        for item in schemes_data:
            existing = db.query(GovernmentScheme).filter_by(id=item["id"]).first()
            if not existing:
                db.add(GovernmentScheme(**item))

        # 4. Storage Facilities (5 rows)
        facilities_data = [
            {
                "id": 1,
                "name": "Panipat Grain Storage Centre",
                "storage_type": "warehouse",
                "location_text": "Panipat, Haryana",
                "state": "Haryana",
                "district": "Panipat",
                "distance_km": Decimal("4.5"),
                "capacity_tons": Decimal("5000.00"),
                "available_space_tons": Decimal("3200.00"),
                "price_per_kg_month": Decimal("1.20"),
                "mode": "online",
                "temperature_range": None,
                "suitable_crops": "Wheat, Rice, Maize",
                "facilities": "CCTV, Loading Area, Weighing Facility",
                "scheme_support": "pmkisan,gramin_bhandaran",
                "rating": Decimal("4.4"),
                "review_count": 128,
                "govt_approved": True,
                "status": "available",
                "created_at": datetime.fromisoformat("2026-10-03 04:00:23"),
            },
            {
                "id": 2,
                "name": "Yamunanagar Agro Cold Storage",
                "storage_type": "cold_storage",
                "location_text": "Jagadhri, Yamunanagar, Haryana",
                "state": "Haryana",
                "district": "Yamunanagar",
                "distance_km": Decimal("6.2"),
                "capacity_tons": Decimal("3000.00"),
                "available_space_tons": Decimal("1800.00"),
                "price_per_kg_month": Decimal("2.00"),
                "mode": "online",
                "temperature_range": "2°C - 8°C",
                "suitable_crops": "Potato, Onion, Tomato",
                "facilities": "Temperature Control, CCTV, Loading Area",
                "scheme_support": "gramin_bhandaran,state_subsidy",
                "rating": Decimal("4.6"),
                "review_count": 96,
                "govt_approved": True,
                "status": "available",
                "created_at": datetime.fromisoformat("2026-10-03 04:00:23"),
            },
            {
                "id": 3,
                "name": "Karnal Farmers Warehouse",
                "storage_type": "warehouse",
                "location_text": "Karnal, Haryana",
                "state": "Haryana",
                "district": "Karnal",
                "distance_km": Decimal("3.8"),
                "capacity_tons": Decimal("4500.00"),
                "available_space_tons": Decimal("1200.00"),
                "price_per_kg_month": Decimal("1.20"),
                "mode": "online",
                "temperature_range": None,
                "suitable_crops": "Wheat, Rice, Maize",
                "facilities": "Weighing Facility, Security, Loading Area",
                "scheme_support": "pmkisan,gramin_bhandaran",
                "rating": Decimal("4.3"),
                "review_count": 84,
                "govt_approved": True,
                "status": "limited",
                "created_at": datetime.fromisoformat("2026-10-03 04:00:23"),
            },
            {
                "id": 4,
                "name": "Rohtak Rural Storage Hub",
                "storage_type": "warehouse",
                "location_text": "Sampla, Rohtak, Haryana",
                "state": "Haryana",
                "district": "Rohtak",
                "distance_km": Decimal("5.1"),
                "capacity_tons": Decimal("3500.00"),
                "available_space_tons": Decimal("2500.00"),
                "price_per_kg_month": Decimal("1.20"),
                "mode": "offline",
                "temperature_range": None,
                "suitable_crops": "Wheat, Bajra, Cotton",
                "facilities": "Security, Loading Area, Weighing Facility",
                "scheme_support": "state_subsidy",
                "rating": Decimal("4.2"),
                "review_count": 67,
                "govt_approved": True,
                "status": "available",
                "created_at": datetime.fromisoformat("2026-10-03 04:00:23"),
            },
            {
                "id": 5,
                "name": "Bhiwani Crop Storage Centre",
                "storage_type": "offline",
                "location_text": "Tosham, Bhiwani, Haryana",
                "state": "Haryana",
                "district": "Bhiwani",
                "distance_km": Decimal("7.0"),
                "capacity_tons": Decimal("2000.00"),
                "available_space_tons": Decimal("700.00"),
                "price_per_kg_month": Decimal("1.00"),
                "mode": "offline",
                "temperature_range": None,
                "suitable_crops": "Bajra, Wheat, Cotton",
                "facilities": "Basic Storage, Weighing Facility",
                "scheme_support": "state_subsidy",
                "rating": Decimal("4.0"),
                "review_count": 45,
                "govt_approved": False,
                "status": "limited",
                "created_at": datetime.fromisoformat("2026-10-03 04:00:23"),
            },
        ]
        for item in facilities_data:
            existing = db.query(StorageFacility).filter_by(id=item["id"]).first()
            if not existing:
                db.add(StorageFacility(**item))

        # Commit parents before dependent tables
        db.commit()

        # 5. Crop Predictions (5 rows)
        predictions_data = [
            {
                "id": 6,
                "farmer_id": 1,
                "rainfall_mm": Decimal("620.50"),
                "temperature_celsius": Decimal("24.30"),
                "soil_type": "loamy",
                "recommended_crop": "Wheat",
                "yield_level": "High",
                "risk_level": "Low",
                "confidence_percent": 91,
                "ai_advice": "Suitable conditions for wheat. Maintain adequate irrigation and monitor soil moisture.",
                "predicted_at": datetime.fromisoformat("2026-10-03 04:21:50"),
            },
            {
                "id": 7,
                "farmer_id": 2,
                "rainfall_mm": Decimal("610.70"),
                "temperature_celsius": Decimal("24.60"),
                "soil_type": "loamy",
                "recommended_crop": "Wheat",
                "yield_level": "High",
                "risk_level": "Low",
                "confidence_percent": 89,
                "ai_advice": "Wheat is suitable for the recorded conditions. Ensure timely irrigation and nutrient management.",
                "predicted_at": datetime.fromisoformat("2026-10-03 04:21:50"),
            },
            {
                "id": 8,
                "farmer_id": 3,
                "rainfall_mm": Decimal("780.20"),
                "temperature_celsius": Decimal("27.10"),
                "soil_type": "clay",
                "recommended_crop": "Sugarcane",
                "yield_level": "High",
                "risk_level": "Medium",
                "confidence_percent": 87,
                "ai_advice": "Sugarcane is suitable for the available moisture conditions. Monitor water management.",
                "predicted_at": datetime.fromisoformat("2026-10-03 04:21:50"),
            },
            {
                "id": 9,
                "farmer_id": 4,
                "rainfall_mm": Decimal("710.80"),
                "temperature_celsius": Decimal("28.40"),
                "soil_type": "clay",
                "recommended_crop": "Rice",
                "yield_level": "High",
                "risk_level": "Low",
                "confidence_percent": 93,
                "ai_advice": "Conditions are favorable for rice cultivation. Maintain proper field water management.",
                "predicted_at": datetime.fromisoformat("2026-10-03 04:21:50"),
            },
            {
                "id": 10,
                "farmer_id": 5,
                "rainfall_mm": Decimal("590.30"),
                "temperature_celsius": Decimal("23.80"),
                "soil_type": "loamy",
                "recommended_crop": "Wheat",
                "yield_level": "Medium",
                "risk_level": "Low",
                "confidence_percent": 85,
                "ai_advice": "Wheat is recommended. Monitor temperature and irrigation requirements during the season.",
                "predicted_at": datetime.fromisoformat("2026-10-03 04:21:50"),
            },
        ]
        for item in predictions_data:
            existing = db.query(CropPrediction).filter_by(id=item["id"]).first()
            if not existing:
                db.add(CropPrediction(**item))

        # 6. Insurance Requests (6 rows)
        insurance_data = [
            {
                "id": 6,
                "farmer_id": 1,
                "farmer_name": "Balraj Dahiya",
                "district": "Panipat",
                "crop_name": "Wheat",
                "request_type": "New Insurance Enrollment",
                "description": "Request for wheat crop insurance coverage.",
                "req_status": "approved",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:17:44"),
                "updated_at": datetime.fromisoformat("2026-10-03 04:17:44"),
            },
            {
                "id": 7,
                "farmer_id": 2,
                "farmer_name": "Sagar Baliyan",
                "district": "Yamunanagar",
                "crop_name": "Wheat",
                "request_type": "New Insurance Enrollment",
                "description": "Request for wheat crop insurance coverage.",
                "req_status": "processing",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:17:44"),
                "updated_at": datetime.fromisoformat("2026-10-03 04:17:44"),
            },
            {
                "id": 8,
                "farmer_id": 3,
                "farmer_name": "Satbir Malik",
                "district": "Yamunanagar",
                "crop_name": "Sugarcane",
                "request_type": "New Insurance Enrollment",
                "description": "Request for sugarcane crop insurance coverage.",
                "req_status": "processing",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:17:44"),
                "updated_at": datetime.fromisoformat("2026-10-03 04:17:44"),
            },
            {
                "id": 9,
                "farmer_id": 4,
                "farmer_name": "Surender Hooda",
                "district": "Karnal",
                "crop_name": "Rice",
                "request_type": "Crop Loss Claim",
                "description": "Crop damage reported after adverse weather conditions.",
                "req_status": "pending",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:17:44"),
                "updated_at": datetime.fromisoformat("2026-10-03 04:17:44"),
            },
            {
                "id": 10,
                "farmer_id": 5,
                "farmer_name": "Kuldeep Sangwan",
                "district": "Rohtak",
                "crop_name": "Wheat",
                "request_type": "New Insurance Enrollment",
                "description": "Request for wheat crop insurance enrollment.",
                "req_status": "approved",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:17:44"),
                "updated_at": datetime.fromisoformat("2026-10-03 04:17:44"),
            },
            {
                "id": 11,
                "farmer_id": 6,
                "farmer_name": "Mahender Phogat",
                "district": "Bhiwani",
                "crop_name": "Bajra",
                "request_type": "Crop Loss Claim",
                "description": "Bajra crop loss reported and submitted for review.",
                "req_status": "pending",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:17:44"),
                "updated_at": datetime.fromisoformat("2026-10-03 04:17:44"),
            },
        ]
        for item in insurance_data:
            existing = db.query(InsuranceRequest).filter_by(id=item["id"]).first()
            if not existing:
                db.add(InsuranceRequest(**item))

        # Commit insurance before PMFBY enrollments
        db.commit()

        # 7. PMFBY Enrollments (5 rows)
        pmfby_data = [
            {
                "id": 5,
                "insurance_request_id": 6,
                "farmer_id": 1,
                "crop_name": "Wheat",
                "land_records_verified": True,
                "sowing_date": date.fromisoformat("2026-10-01"),
                "season": "Rabi",
                "premium_calculated": Decimal("1800.00"),
                "enrollment_date": datetime.fromisoformat("2026-10-03 04:18:40"),
            },
            {
                "id": 6,
                "insurance_request_id": 7,
                "farmer_id": 2,
                "crop_name": "Wheat",
                "land_records_verified": True,
                "sowing_date": date.fromisoformat("2026-10-01"),
                "season": "Rabi",
                "premium_calculated": Decimal("1700.00"),
                "enrollment_date": datetime.fromisoformat("2026-10-03 04:18:40"),
            },
            {
                "id": 7,
                "insurance_request_id": 8,
                "farmer_id": 3,
                "crop_name": "Sugarcane",
                "land_records_verified": True,
                "sowing_date": date.fromisoformat("2026-09-20"),
                "season": "Kharif",
                "premium_calculated": Decimal("2200.00"),
                "enrollment_date": datetime.fromisoformat("2026-10-03 04:18:40"),
            },
            {
                "id": 8,
                "insurance_request_id": 10,
                "farmer_id": 5,
                "crop_name": "Wheat",
                "land_records_verified": False,
                "sowing_date": date.fromisoformat("2026-10-02"),
                "season": "Rabi",
                "premium_calculated": Decimal("2000.00"),
                "enrollment_date": datetime.fromisoformat("2026-10-03 04:18:40"),
            },
            {
                "id": 9,
                "insurance_request_id": 11,
                "farmer_id": 6,
                "crop_name": "Bajra",
                "land_records_verified": True,
                "sowing_date": date.fromisoformat("2026-08-15"),
                "season": "Kharif",
                "premium_calculated": Decimal("1500.00"),
                "enrollment_date": datetime.fromisoformat("2026-10-03 04:18:40"),
            },
        ]
        for item in pmfby_data:
            existing = db.query(PmfbyEnrollment).filter_by(id=item["id"]).first()
            if not existing:
                db.add(PmfbyEnrollment(**item))

        # 8. Loan Applications (5 rows)
        loan_data = [
            {
                "id": 6,
                "farmer_id": 1,
                "farmer_name": "Balraj Dahiya",
                "village": "Israna",
                "loan_amount": Decimal("150000.00"),
                "loan_type": "Crop Loan",
                "purpose": "Purchase of seeds, fertilizers and other seasonal farming inputs",
                "app_status": "approved",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:20:17"),
                "reviewed_at": None,
            },
            {
                "id": 7,
                "farmer_id": 2,
                "farmer_name": "Sagar Baliyan",
                "village": "Jagadhri",
                "loan_amount": Decimal("200000.00"),
                "loan_type": "Equipment Loan",
                "purpose": "Purchase of agricultural equipment for farm operations",
                "app_status": "under_review",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:20:17"),
                "reviewed_at": None,
            },
            {
                "id": 8,
                "farmer_id": 3,
                "farmer_name": "Satbir Malik",
                "village": "Radaur",
                "loan_amount": Decimal("250000.00"),
                "loan_type": "Equipment Loan",
                "purpose": "Purchase of agricultural machinery and equipment",
                "app_status": "under_review",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:20:17"),
                "reviewed_at": None,
            },
            {
                "id": 9,
                "farmer_id": 4,
                "farmer_name": "Surender Hooda",
                "village": "Nilokheri",
                "loan_amount": Decimal("500000.00"),
                "loan_type": "Irrigation Loan",
                "purpose": "Installation of irrigation equipment",
                "app_status": "pending",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:20:17"),
                "reviewed_at": None,
            },
            {
                "id": 10,
                "farmer_id": 5,
                "farmer_name": "Kuldeep Sangwan",
                "village": "Sampla",
                "loan_amount": Decimal("120000.00"),
                "loan_type": "Crop Loan",
                "purpose": "Purchase of seeds and fertilizers",
                "app_status": "approved",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:20:17"),
                "reviewed_at": None,
            },
        ]
        for item in loan_data:
            existing = db.query(LoanApplication).filter_by(id=item["id"]).first()
            if not existing:
                db.add(LoanApplication(**item))

        # 9. Mental Health Requests (5 rows)
        mh_data = [
            {
                "id": 6,
                "farmer_id": 1,
                "farmer_name": "Balraj Dahiya",
                "mobile": "9876543210",
                "concern_type": "Financial Pressure",
                "message": "Facing financial pressure due to rising farming input costs.",
                "req_status": "contacted",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:22:31"),
            },
            {
                "id": 7,
                "farmer_id": 2,
                "farmer_name": "Sagar Baliyan",
                "mobile": "9876543215",
                "concern_type": "Stress & Anxiety",
                "message": "Feeling stressed about farming expenses and upcoming crop planning.",
                "req_status": "pending",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:22:31"),
            },
            {
                "id": 8,
                "farmer_id": 3,
                "farmer_name": "Satbir Malik",
                "mobile": "9876543211",
                "concern_type": "Crop Loss Stress",
                "message": "Concerned about crop damage and its impact on family income.",
                "req_status": "pending",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:22:31"),
            },
            {
                "id": 9,
                "farmer_id": 4,
                "farmer_name": "Surender Hooda",
                "mobile": "9876543212",
                "concern_type": "Stress & Anxiety",
                "message": "Experiencing stress related to crop management and financial responsibilities.",
                "req_status": "resolved",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:22:31"),
            },
            {
                "id": 10,
                "farmer_id": 5,
                "farmer_name": "Kuldeep Sangwan",
                "mobile": "9876543213",
                "concern_type": "Financial Pressure",
                "message": "Seeking support regarding financial pressure from agricultural expenses.",
                "req_status": "contacted",
                "submitted_at": datetime.fromisoformat("2026-10-03 04:22:31"),
            },
        ]
        for item in mh_data:
            existing = db.query(MentalHealthRequest).filter_by(id=item["id"]).first()
            if not existing:
                db.add(MentalHealthRequest(**item))

        # 10. Scheme Eligibility Checks (5 rows)
        eligibility_data = [
            {
                "id": 11,
                "farmer_id": 1,
                "scheme_id": 1,
                "farmer_category": "small",
                "land_ha": Decimal("1.80"),
                "crop_season": "Rabi",
                "aadhaar_linked": True,
                "bank_linked": True,
                "is_eligible": True,
                "result_message": "Farmer meets the recorded eligibility conditions.",
                "checked_at": datetime.fromisoformat("2026-10-03 04:21:09"),
            },
            {
                "id": 12,
                "farmer_id": 2,
                "scheme_id": 1,
                "farmer_category": "marginal",
                "land_ha": Decimal("1.70"),
                "crop_season": "Rabi",
                "aadhaar_linked": True,
                "bank_linked": True,
                "is_eligible": True,
                "result_message": "Farmer is eligible based on the submitted details.",
                "checked_at": datetime.fromisoformat("2026-10-03 04:21:09"),
            },
            {
                "id": 13,
                "farmer_id": 3,
                "scheme_id": 4,
                "farmer_category": "marginal",
                "land_ha": Decimal("1.20"),
                "crop_season": "Kharif",
                "aadhaar_linked": True,
                "bank_linked": True,
                "is_eligible": True,
                "result_message": "Farmer is eligible based on the submitted details.",
                "checked_at": datetime.fromisoformat("2026-10-03 04:21:09"),
            },
            {
                "id": 14,
                "farmer_id": 4,
                "scheme_id": 3,
                "farmer_category": "large",
                "land_ha": Decimal("5.50"),
                "crop_season": "Kharif",
                "aadhaar_linked": True,
                "bank_linked": True,
                "is_eligible": True,
                "result_message": "Eligibility check completed successfully.",
                "checked_at": datetime.fromisoformat("2026-10-03 04:21:09"),
            },
            {
                "id": 15,
                "farmer_id": 5,
                "scheme_id": 1,
                "farmer_category": "small",
                "land_ha": Decimal("2.10"),
                "crop_season": "Rabi",
                "aadhaar_linked": True,
                "bank_linked": False,
                "is_eligible": False,
                "result_message": "Bank account linkage is required for this recorded check.",
                "checked_at": datetime.fromisoformat("2026-10-03 04:21:09"),
            },
        ]
        for item in eligibility_data:
            existing = db.query(SchemeEligibilityCheck).filter_by(id=item["id"]).first()
            if not existing:
                db.add(SchemeEligibilityCheck(**item))

        # 11. Storage Bookings (5 rows)
        booking_data = [
            {
                "id": 7,
                "booking_ref": "BB2001",
                "farmer_name": "Balraj Dahiya",
                "mobile": "9876543210",
                "facility_id": 1,
                "state": "Haryana",
                "crop_type": "Wheat",
                "quantity_kg": Decimal("5000.00"),
                "duration_months": 3,
                "mode": "online",
                "scheme_id": 1,
                "base_price_per_kg": Decimal("1.20"),
                "scheme_benefit_per_kg": Decimal("0.50"),
                "effective_price_per_kg": Decimal("0.70"),
                "total_amount": Decimal("10500.00"),
                "booking_status": "active",
                "booked_at": datetime.fromisoformat("2026-10-03 04:19:32"),
                "farmer_id": 1,
            },
            {
                "id": 8,
                "booking_ref": "BB2002",
                "farmer_name": "Sagar Baliyan",
                "mobile": "9876543215",
                "facility_id": 2,
                "state": "Haryana",
                "crop_type": "Wheat",
                "quantity_kg": Decimal("2500.00"),
                "duration_months": 2,
                "mode": "online",
                "scheme_id": 4,
                "base_price_per_kg": Decimal("2.00"),
                "scheme_benefit_per_kg": Decimal("0.70"),
                "effective_price_per_kg": Decimal("1.30"),
                "total_amount": Decimal("6500.00"),
                "booking_status": "active",
                "booked_at": datetime.fromisoformat("2026-10-03 04:19:32"),
                "farmer_id": 2,
            },
            {
                "id": 9,
                "booking_ref": "BB2003",
                "farmer_name": "Satbir Malik",
                "mobile": "9876543211",
                "facility_id": 3,
                "state": "Haryana",
                "crop_type": "Sugarcane",
                "quantity_kg": Decimal("3000.00"),
                "duration_months": 2,
                "mode": "online",
                "scheme_id": 4,
                "base_price_per_kg": Decimal("1.20"),
                "scheme_benefit_per_kg": Decimal("0.70"),
                "effective_price_per_kg": Decimal("0.50"),
                "total_amount": Decimal("3000.00"),
                "booking_status": "completed",
                "booked_at": datetime.fromisoformat("2026-10-03 04:19:32"),
                "farmer_id": 3,
            },
            {
                "id": 10,
                "booking_ref": "BB2004",
                "farmer_name": "Kuldeep Sangwan",
                "mobile": "9876543213",
                "facility_id": 4,
                "state": "Haryana",
                "crop_type": "Wheat",
                "quantity_kg": Decimal("2000.00"),
                "duration_months": 3,
                "mode": "offline",
                "scheme_id": 6,
                "base_price_per_kg": Decimal("1.20"),
                "scheme_benefit_per_kg": Decimal("1.00"),
                "effective_price_per_kg": Decimal("0.20"),
                "total_amount": Decimal("1200.00"),
                "booking_status": "active",
                "booked_at": datetime.fromisoformat("2026-10-03 04:19:32"),
                "farmer_id": 5,
            },
            {
                "id": 11,
                "booking_ref": "BB2005",
                "farmer_name": "Mahender Phogat",
                "mobile": "9876543214",
                "facility_id": 5,
                "state": "Haryana",
                "crop_type": "Bajra",
                "quantity_kg": Decimal("1500.00"),
                "duration_months": 2,
                "mode": "offline",
                "scheme_id": 6,
                "base_price_per_kg": Decimal("1.00"),
                "scheme_benefit_per_kg": Decimal("1.00"),
                "effective_price_per_kg": Decimal("0.00"),
                "total_amount": Decimal("0.00"),
                "booking_status": "cancelled",
                "booked_at": datetime.fromisoformat("2026-10-03 04:19:32"),
                "farmer_id": 6,
            },
        ]
        for item in booking_data:
            existing = db.query(StorageBooking).filter_by(id=item["id"]).first()
            if not existing:
                db.add(StorageBooking(**item))

        db.commit()
        print("All 60 seed records inserted or verified.")

        # Synchronize PostgreSQL sequences
        sync_sql = """
        SELECT setval(pg_get_serial_sequence('crops', 'crop_id'), COALESCE(MAX(crop_id), 1)) FROM crops;
        SELECT setval(pg_get_serial_sequence('farmers', 'farmer_id'), COALESCE(MAX(farmer_id), 1)) FROM farmers;
        SELECT setval(pg_get_serial_sequence('government_schemes', 'id'), COALESCE(MAX(id), 1)) FROM government_schemes;
        SELECT setval(pg_get_serial_sequence('storage_facilities', 'id'), COALESCE(MAX(id), 1)) FROM storage_facilities;
        SELECT setval(pg_get_serial_sequence('crop_predictions', 'id'), COALESCE(MAX(id), 1)) FROM crop_predictions;
        SELECT setval(pg_get_serial_sequence('insurance_requests', 'id'), COALESCE(MAX(id), 1)) FROM insurance_requests;
        SELECT setval(pg_get_serial_sequence('pmfby_enrollments', 'id'), COALESCE(MAX(id), 1)) FROM pmfby_enrollments;
        SELECT setval(pg_get_serial_sequence('loan_applications', 'id'), COALESCE(MAX(id), 1)) FROM loan_applications;
        SELECT setval(pg_get_serial_sequence('mental_health_requests', 'id'), COALESCE(MAX(id), 1)) FROM mental_health_requests;
        SELECT setval(pg_get_serial_sequence('scheme_eligibility_checks', 'id'), COALESCE(MAX(id), 1)) FROM scheme_eligibility_checks;
        SELECT setval(pg_get_serial_sequence('storage_booking', 'id'), COALESCE(MAX(id), 1)) FROM storage_booking;
        """
        for stmt in sync_sql.strip().split(";"):
            stmt = stmt.strip()
            if stmt:
                db.execute(text(stmt))
        db.commit()
        print("All PostgreSQL primary key sequence counters successfully synchronized.")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
