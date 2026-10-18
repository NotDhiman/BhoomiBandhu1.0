-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: bhoomi_bandhu
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- BhoomiBandhu database; importing this file recreates the 11 tables below.
CREATE DATABASE IF NOT EXISTS `bhoomi_bandhu` CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE `bhoomi_bandhu`;

-- Table structure for table `crops`
--

DROP TABLE IF EXISTS `crops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crops` (
  `crop_id` int NOT NULL AUTO_INCREMENT,
  `crop_name` varchar(100) NOT NULL,
  `crop_category` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`crop_id`),
  UNIQUE KEY `crop_name` (`crop_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crops`
--

LOCK TABLES `crops` WRITE;
/*!40000 ALTER TABLE `crops` DISABLE KEYS */;
INSERT INTO `crops` VALUES (1,'Wheat','Cereal'),(2,'Rice','Cereal'),(3,'Bajra','Cereal'),(4,'Cotton','Cash Crop'),(5,'Sugarcane','Cash Crop'),(6,'Potato','Vegetable'),(7,'Onion','Vegetable'),(8,'Tomato','Vegetable'),(9,'Maize','Cereal');
/*!40000 ALTER TABLE `crops` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `farmers`
--

DROP TABLE IF EXISTS `farmers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `farmers` (
  `farmer_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `mobile` varchar(15) NOT NULL,
  `state` varchar(50) NOT NULL,
  `email` varchar(150) DEFAULT NULL,
  `district` varchar(80) DEFAULT NULL,
  `village` varchar(100) DEFAULT NULL,
  `farmer_category` varchar(20) DEFAULT NULL,
  `land_holding_ha` decimal(6,2) DEFAULT NULL,
  `primary_crop` varchar(80) DEFAULT NULL,
  `aadhaar_linked` tinyint(1) DEFAULT '0',
  `bank_linked` tinyint(1) DEFAULT '0',
  `profile_photo_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`farmer_id`),
  UNIQUE KEY `uq_farmers_mobile` (`mobile`),
  KEY `idx_farmers_mobile` (`mobile`),
  KEY `idx_farmers_state` (`state`),
  CONSTRAINT `chk_farmer_category` CHECK ((`farmer_category` in (_utf8mb4'small',_utf8mb4'marginal',_utf8mb4'large')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `farmers`
--

LOCK TABLES `farmers` WRITE;
/*!40000 ALTER TABLE `farmers` DISABLE KEYS */;
INSERT INTO `farmers` VALUES (1,'Balraj Dahiya','9876543210','Haryana','balraj.dahiya@example.com','Panipat','Israna','small',1.80,'Wheat',1,1,NULL,'2026-10-03 03:58:52','2026-10-03 03:58:52'),(2,'Sagar Baliyan','9876543215','Haryana','sagar.baliyan@example.com','Yamunanagar','Jagadhri','marginal',1.70,'Wheat',1,1,NULL,'2026-10-03 03:58:52','2026-10-03 03:58:52'),(3,'Satbir Malik','9876543211','Haryana','satbir.malik@example.com','Yamunanagar','Radaur','marginal',1.20,'Sugarcane',1,1,NULL,'2026-10-03 03:58:52','2026-10-03 03:58:52'),(4,'Surender Hooda','9876543212','Haryana','surender.hooda@example.com','Karnal','Nilokheri','large',5.50,'Rice',1,1,NULL,'2026-10-03 03:58:52','2026-10-03 03:58:52'),(5,'Kuldeep Sangwan','9876543213','Haryana','kuldeep.sangwan@example.com','Rohtak','Sampla','small',2.10,'Wheat',1,0,NULL,'2026-10-03 03:58:52','2026-10-03 03:58:52'),(6,'Mahender Phogat','9876543214','Haryana','mahender.phogat@example.com','Bhiwani','Tosham','marginal',1.50,'Bajra',0,1,NULL,'2026-10-03 03:58:52','2026-10-03 03:58:52');
/*!40000 ALTER TABLE `farmers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `government_schemes`
--

DROP TABLE IF EXISTS `government_schemes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `government_schemes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `scheme_type` varchar(20) DEFAULT NULL,
  `benefit_summary` text,
  `storage_benefit_per_kg` decimal(5,2) DEFAULT '0.00',
  `active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  CONSTRAINT `chk_scheme_type` CHECK ((`scheme_type` in (_utf8mb4'central',_utf8mb4'state')))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `government_schemes`
--

LOCK TABLES `government_schemes` WRITE;
/*!40000 ALTER TABLE `government_schemes` DISABLE KEYS */;
INSERT INTO `government_schemes` VALUES (1,'pmkisan','PM-KISAN Samman Nidhi','central','₹6000 annual income support for small & marginal farmers',0.50,1,'2026-10-03 03:53:12'),(2,'pmfby','Pradhan Mantri Fasal Bima Yojana','central','Crop insurance against natural calamities, pests & diseases',0.00,1,'2026-10-03 03:53:12'),(3,'kcc','Kisan Credit Card','central','Short-term agricultural credit at subsidised interest rates',0.00,1,'2026-10-03 03:53:12'),(4,'gramin_bhandaran','Gramin Bhandaran Yojana','central','Subsidy for rural warehouse/cold-storage infrastructure',0.70,1,'2026-10-03 03:53:12'),(5,'enam','e-NAM','central','Online national agricultural market for price discovery',0.00,1,'2026-10-03 03:53:12'),(6,'state_subsidy','State Subsidy (Generic)','state','State-level crop & storage subsidy',1.00,1,'2026-10-03 03:53:12');
/*!40000 ALTER TABLE `government_schemes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `storage_facilities`
--

DROP TABLE IF EXISTS `storage_facilities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `storage_facilities` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `storage_type` varchar(30) DEFAULT NULL,
  `location_text` varchar(200) DEFAULT NULL,
  `state` varchar(60) DEFAULT NULL,
  `district` varchar(80) DEFAULT NULL,
  `distance_km` decimal(5,1) DEFAULT NULL,
  `capacity_tons` decimal(10,2) DEFAULT NULL,
  `available_space_tons` decimal(10,2) DEFAULT NULL,
  `price_per_kg_month` decimal(5,2) NOT NULL,
  `mode` varchar(10) DEFAULT NULL,
  `temperature_range` varchar(30) DEFAULT NULL,
  `suitable_crops` text,
  `facilities` text,
  `scheme_support` text,
  `rating` decimal(3,1) DEFAULT NULL,
  `review_count` int DEFAULT '0',
  `govt_approved` tinyint(1) DEFAULT '0',
  `status` varchar(20) DEFAULT 'available',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_storage_fac_state` (`state`),
  KEY `idx_storage_fac_type` (`storage_type`),
  KEY `idx_storage_fac_status` (`status`),
  CONSTRAINT `storage_facilities_chk_1` CHECK ((`storage_type` in (_utf8mb4'cold_storage',_utf8mb4'warehouse',_utf8mb4'offline'))),
  CONSTRAINT `storage_facilities_chk_2` CHECK ((`mode` in (_utf8mb4'online',_utf8mb4'offline'))),
  CONSTRAINT `storage_facilities_chk_3` CHECK ((`status` in (_utf8mb4'available',_utf8mb4'limited',_utf8mb4'full')))
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `storage_facilities`
--

LOCK TABLES `storage_facilities` WRITE;
/*!40000 ALTER TABLE `storage_facilities` DISABLE KEYS */;
INSERT INTO `storage_facilities` VALUES (1,'Panipat Grain Storage Centre','warehouse','Panipat, Haryana','Haryana','Panipat',4.5,5000.00,3200.00,1.20,'online',NULL,'Wheat, Rice, Maize','CCTV, Loading Area, Weighing Facility','pmkisan,gramin_bhandaran',4.4,128,1,'available','2026-10-03 04:00:23'),(2,'Yamunanagar Agro Cold Storage','cold_storage','Jagadhri, Yamunanagar, Haryana','Haryana','Yamunanagar',6.2,3000.00,1800.00,2.00,'online','2°C - 8°C','Potato, Onion, Tomato','Temperature Control, CCTV, Loading Area','gramin_bhandaran,state_subsidy',4.6,96,1,'available','2026-10-03 04:00:23'),(3,'Karnal Farmers Warehouse','warehouse','Karnal, Haryana','Haryana','Karnal',3.8,4500.00,1200.00,1.20,'online',NULL,'Wheat, Rice, Maize','Weighing Facility, Security, Loading Area','pmkisan,gramin_bhandaran',4.3,84,1,'limited','2026-10-03 04:00:23'),(4,'Rohtak Rural Storage Hub','warehouse','Sampla, Rohtak, Haryana','Haryana','Rohtak',5.1,3500.00,2500.00,1.20,'offline',NULL,'Wheat, Bajra, Cotton','Security, Loading Area, Weighing Facility','state_subsidy',4.2,67,1,'available','2026-10-03 04:00:23'),(5,'Bhiwani Crop Storage Centre','offline','Tosham, Bhiwani, Haryana','Haryana','Bhiwani',7.0,2000.00,700.00,1.00,'offline',NULL,'Bajra, Wheat, Cotton','Basic Storage, Weighing Facility','state_subsidy',4.0,45,0,'limited','2026-10-03 04:00:23');
/*!40000 ALTER TABLE `storage_facilities` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-03 10:32:39
-- Table structure for table `crop_predictions`
--

DROP TABLE IF EXISTS `crop_predictions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crop_predictions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `farmer_id` int DEFAULT NULL,
  `rainfall_mm` decimal(7,2) DEFAULT NULL,
  `temperature_celsius` decimal(5,2) DEFAULT NULL,
  `soil_type` varchar(20) DEFAULT NULL,
  `recommended_crop` varchar(80) DEFAULT NULL,
  `yield_level` varchar(10) DEFAULT NULL,
  `risk_level` varchar(10) DEFAULT NULL,
  `confidence_percent` int DEFAULT NULL,
  `ai_advice` text,
  `predicted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_crop_preds_farmer` (`farmer_id`),
  CONSTRAINT `fk_crop_prediction_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`farmer_id`) ON DELETE SET NULL,
  CONSTRAINT `crop_predictions_chk_1` CHECK ((`soil_type` in (_utf8mb4'loamy',_utf8mb4'clay',_utf8mb4'sandy',_utf8mb4'red',_utf8mb4'black'))),
  CONSTRAINT `crop_predictions_chk_2` CHECK ((`yield_level` in (_utf8mb4'Low',_utf8mb4'Medium',_utf8mb4'High'))),
  CONSTRAINT `crop_predictions_chk_3` CHECK ((`risk_level` in (_utf8mb4'Low',_utf8mb4'Medium',_utf8mb4'High')))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `crop_predictions`
--

LOCK TABLES `crop_predictions` WRITE;
/*!40000 ALTER TABLE `crop_predictions` DISABLE KEYS */;
INSERT INTO `crop_predictions` VALUES (6,1,620.50,24.30,'loamy','Wheat','High','Low',91,'Suitable conditions for wheat. Maintain adequate irrigation and monitor soil moisture.','2026-10-03 04:21:50'),(7,2,610.70,24.60,'loamy','Wheat','High','Low',89,'Wheat is suitable for the recorded conditions. Ensure timely irrigation and nutrient management.','2026-10-03 04:21:50'),(8,3,780.20,27.10,'clay','Sugarcane','High','Medium',87,'Sugarcane is suitable for the available moisture conditions. Monitor water management.','2026-10-03 04:21:50'),(9,4,710.80,28.40,'clay','Rice','High','Low',93,'Conditions are favorable for rice cultivation. Maintain proper field water management.','2026-10-03 04:21:50'),(10,5,590.30,23.80,'loamy','Wheat','Medium','Low',85,'Wheat is recommended. Monitor temperature and irrigation requirements during the season.','2026-10-03 04:21:50');
/*!40000 ALTER TABLE `crop_predictions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `insurance_requests`
--

DROP TABLE IF EXISTS `insurance_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `insurance_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `farmer_id` int DEFAULT NULL,
  `farmer_name` varchar(100) NOT NULL,
  `district` varchar(80) DEFAULT NULL,
  `crop_name` varchar(80) DEFAULT NULL,
  `request_type` varchar(30) DEFAULT NULL,
  `description` text,
  `req_status` varchar(20) DEFAULT 'pending',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_insurance_farmer` (`farmer_id`),
  KEY `idx_insurance_status` (`req_status`),
  CONSTRAINT `fk_insurance_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`farmer_id`) ON DELETE SET NULL,
  CONSTRAINT `insurance_requests_chk_1` CHECK ((`request_type` in (_utf8mb4'New Insurance Enrollment',_utf8mb4'Crop Loss Claim'))),
  CONSTRAINT `insurance_requests_chk_2` CHECK ((`req_status` in (_utf8mb4'pending',_utf8mb4'processing',_utf8mb4'approved',_utf8mb4'rejected',_utf8mb4'paid')))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `insurance_requests`
--

LOCK TABLES `insurance_requests` WRITE;
/*!40000 ALTER TABLE `insurance_requests` DISABLE KEYS */;
INSERT INTO `insurance_requests` VALUES (6,1,'Balraj Dahiya','Panipat','Wheat','New Insurance Enrollment','Request for wheat crop insurance coverage.','approved','2026-10-03 04:17:44','2026-10-03 04:17:44'),(7,2,'Sagar Baliyan','Yamunanagar','Wheat','New Insurance Enrollment','Request for wheat crop insurance coverage.','processing','2026-10-03 04:17:44','2026-10-03 04:17:44'),(8,3,'Satbir Malik','Yamunanagar','Sugarcane','New Insurance Enrollment','Request for sugarcane crop insurance coverage.','processing','2026-10-03 04:17:44','2026-10-03 04:17:44'),(9,4,'Surender Hooda','Karnal','Rice','Crop Loss Claim','Crop damage reported after adverse weather conditions.','pending','2026-10-03 04:17:44','2026-10-03 04:17:44'),(10,5,'Kuldeep Sangwan','Rohtak','Wheat','New Insurance Enrollment','Request for wheat crop insurance enrollment.','approved','2026-10-03 04:17:44','2026-10-03 04:17:44'),(11,6,'Mahender Phogat','Bhiwani','Bajra','Crop Loss Claim','Bajra crop loss reported and submitted for review.','pending','2026-10-03 04:17:44','2026-10-03 04:17:44');
/*!40000 ALTER TABLE `insurance_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loan_applications`
--

DROP TABLE IF EXISTS `loan_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `loan_applications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `farmer_id` int DEFAULT NULL,
  `farmer_name` varchar(100) NOT NULL,
  `village` varchar(100) DEFAULT NULL,
  `loan_amount` decimal(12,2) NOT NULL,
  `loan_type` varchar(50) DEFAULT NULL,
  `purpose` text,
  `app_status` varchar(20) DEFAULT 'pending',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_loan_apps_farmer` (`farmer_id`),
  KEY `idx_loan_apps_status` (`app_status`),
  CONSTRAINT `fk_loan_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`farmer_id`) ON DELETE SET NULL,
  CONSTRAINT `loan_applications_chk_1` CHECK ((`loan_type` in (_utf8mb4'Crop Loan',_utf8mb4'Equipment Loan',_utf8mb4'Irrigation Loan',_utf8mb4'Dairy / Livestock Loan'))),
  CONSTRAINT `loan_applications_chk_2` CHECK ((`app_status` in (_utf8mb4'pending',_utf8mb4'under_review',_utf8mb4'approved',_utf8mb4'rejected')))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loan_applications`
--

LOCK TABLES `loan_applications` WRITE;
/*!40000 ALTER TABLE `loan_applications` DISABLE KEYS */;
INSERT INTO `loan_applications` VALUES (6,1,'Balraj Dahiya','Israna',150000.00,'Crop Loan','Purchase of seeds, fertilizers and other seasonal farming inputs','approved','2026-10-03 04:20:17',NULL),(7,2,'Sagar Baliyan','Jagadhri',200000.00,'Equipment Loan','Purchase of agricultural equipment for farm operations','under_review','2026-10-03 04:20:17',NULL),(8,3,'Satbir Malik','Radaur',250000.00,'Equipment Loan','Purchase of agricultural machinery and equipment','under_review','2026-10-03 04:20:17',NULL),(9,4,'Surender Hooda','Nilokheri',500000.00,'Irrigation Loan','Installation of irrigation equipment','pending','2026-10-03 04:20:17',NULL),(10,5,'Kuldeep Sangwan','Sampla',120000.00,'Crop Loan','Purchase of seeds and fertilizers','approved','2026-10-03 04:20:17',NULL);
/*!40000 ALTER TABLE `loan_applications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mental_health_requests`
--

DROP TABLE IF EXISTS `mental_health_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mental_health_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `farmer_id` int DEFAULT NULL,
  `farmer_name` varchar(100) NOT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `concern_type` varchar(50) DEFAULT NULL,
  `message` text,
  `req_status` varchar(20) DEFAULT 'pending',
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_mental_health_farmer` (`farmer_id`),
  KEY `idx_mh_requests_status` (`req_status`),
  CONSTRAINT `fk_mental_health_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`farmer_id`) ON DELETE SET NULL,
  CONSTRAINT `mental_health_requests_chk_1` CHECK ((`concern_type` in (_utf8mb4'Stress & Anxiety',_utf8mb4'Financial Pressure',_utf8mb4'Crop Loss Stress',_utf8mb4'Family or Personal Issues'))),
  CONSTRAINT `mental_health_requests_chk_2` CHECK ((`req_status` in (_utf8mb4'pending',_utf8mb4'contacted',_utf8mb4'resolved')))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mental_health_requests`
--

LOCK TABLES `mental_health_requests` WRITE;
/*!40000 ALTER TABLE `mental_health_requests` DISABLE KEYS */;
INSERT INTO `mental_health_requests` VALUES (6,1,'Balraj Dahiya','9876543210','Financial Pressure','Facing financial pressure due to rising farming input costs.','contacted','2026-10-03 04:22:31'),(7,2,'Sagar Baliyan','9876543215','Stress & Anxiety','Feeling stressed about farming expenses and upcoming crop planning.','pending','2026-10-03 04:22:31'),(8,3,'Satbir Malik','9876543211','Crop Loss Stress','Concerned about crop damage and its impact on family income.','pending','2026-10-03 04:22:31'),(9,4,'Surender Hooda','9876543212','Stress & Anxiety','Experiencing stress related to crop management and financial responsibilities.','resolved','2026-10-03 04:22:31'),(10,5,'Kuldeep Sangwan','9876543213','Financial Pressure','Seeking support regarding financial pressure from agricultural expenses.','contacted','2026-10-03 04:22:31');
/*!40000 ALTER TABLE `mental_health_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pmfby_enrollments`
--

DROP TABLE IF EXISTS `pmfby_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pmfby_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `insurance_request_id` int DEFAULT NULL,
  `farmer_id` int DEFAULT NULL,
  `crop_name` varchar(80) DEFAULT NULL,
  `land_records_verified` tinyint(1) DEFAULT '0',
  `sowing_date` date DEFAULT NULL,
  `season` varchar(15) DEFAULT NULL,
  `premium_calculated` decimal(10,2) DEFAULT NULL,
  `enrollment_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_pmfby_insurance_request` (`insurance_request_id`),
  KEY `fk_pmfby_farmer` (`farmer_id`),
  CONSTRAINT `fk_pmfby_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`farmer_id`),
  CONSTRAINT `fk_pmfby_insurance_request` FOREIGN KEY (`insurance_request_id`) REFERENCES `insurance_requests` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pmfby_enrollments_chk_1` CHECK ((`season` in (_utf8mb4'Kharif',_utf8mb4'Rabi',_utf8mb4'Zaid')))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pmfby_enrollments`
--

LOCK TABLES `pmfby_enrollments` WRITE;
/*!40000 ALTER TABLE `pmfby_enrollments` DISABLE KEYS */;
INSERT INTO `pmfby_enrollments` VALUES (5,6,1,'Wheat',1,'2026-10-01','Rabi',1800.00,'2026-10-03 04:18:40'),(6,7,2,'Wheat',1,'2026-10-01','Rabi',1700.00,'2026-10-03 04:18:40'),(7,8,3,'Sugarcane',1,'2026-09-20','Kharif',2200.00,'2026-10-03 04:18:40'),(8,10,5,'Wheat',0,'2026-10-02','Rabi',2000.00,'2026-10-03 04:18:40'),(9,11,6,'Bajra',1,'2026-08-15','Kharif',1500.00,'2026-10-03 04:18:40');
/*!40000 ALTER TABLE `pmfby_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `scheme_eligibility_checks`
--

DROP TABLE IF EXISTS `scheme_eligibility_checks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scheme_eligibility_checks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `farmer_id` int DEFAULT NULL,
  `scheme_id` int DEFAULT NULL,
  `farmer_category` varchar(20) DEFAULT NULL,
  `land_ha` decimal(6,2) DEFAULT NULL,
  `crop_season` varchar(15) DEFAULT NULL,
  `aadhaar_linked` tinyint(1) DEFAULT NULL,
  `bank_linked` tinyint(1) DEFAULT NULL,
  `is_eligible` tinyint(1) DEFAULT NULL,
  `result_message` text,
  `checked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_eligibility_scheme` (`scheme_id`),
  KEY `idx_scheme_checks_farmer` (`farmer_id`),
  CONSTRAINT `fk_eligibility_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`farmer_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_eligibility_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `government_schemes` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `scheme_eligibility_checks`
--

LOCK TABLES `scheme_eligibility_checks` WRITE;
/*!40000 ALTER TABLE `scheme_eligibility_checks` DISABLE KEYS */;
INSERT INTO `scheme_eligibility_checks` VALUES (11,1,1,'small',1.80,'Rabi',1,1,1,'Farmer meets the recorded eligibility conditions.','2026-10-03 04:21:09'),(12,2,1,'marginal',1.70,'Rabi',1,1,1,'Farmer is eligible based on the submitted details.','2026-10-03 04:21:09'),(13,3,4,'marginal',1.20,'Kharif',1,1,1,'Farmer is eligible based on the submitted details.','2026-10-03 04:21:09'),(14,4,3,'large',5.50,'Kharif',1,1,1,'Eligibility check completed successfully.','2026-10-03 04:21:09'),(15,5,1,'small',2.10,'Rabi',1,0,0,'Bank account linkage is required for this recorded check.','2026-10-03 04:21:09');
/*!40000 ALTER TABLE `scheme_eligibility_checks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `storage_booking`
--

DROP TABLE IF EXISTS `storage_booking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `storage_booking` (
  `id` int NOT NULL AUTO_INCREMENT,
  `booking_ref` varchar(20) NOT NULL,
  `farmer_name` varchar(100) DEFAULT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `facility_id` int DEFAULT NULL,
  `state` varchar(60) DEFAULT NULL,
  `crop_type` varchar(80) DEFAULT NULL,
  `quantity_kg` decimal(10,2) NOT NULL,
  `duration_months` int NOT NULL,
  `mode` varchar(10) DEFAULT NULL,
  `scheme_id` int DEFAULT NULL,
  `base_price_per_kg` decimal(5,2) DEFAULT NULL,
  `scheme_benefit_per_kg` decimal(5,2) DEFAULT '0.00',
  `effective_price_per_kg` decimal(5,2) DEFAULT NULL,
  `total_amount` decimal(12,2) DEFAULT NULL,
  `booking_status` varchar(20) DEFAULT 'active',
  `booked_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `farmer_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `booking_ref` (`booking_ref`),
  KEY `fk_booking_scheme` (`scheme_id`),
  KEY `idx_storage_bookings_farmer` (`farmer_id`),
  KEY `idx_storage_bookings_fac` (`facility_id`),
  KEY `idx_storage_bookings_status` (`booking_status`),
  CONSTRAINT `fk_booking_facility` FOREIGN KEY (`facility_id`) REFERENCES `storage_facilities` (`id`),
  CONSTRAINT `fk_booking_farmer` FOREIGN KEY (`farmer_id`) REFERENCES `farmers` (`farmer_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_booking_scheme` FOREIGN KEY (`scheme_id`) REFERENCES `government_schemes` (`id`),
  CONSTRAINT `storage_booking_chk_1` CHECK ((`mode` in (_utf8mb4'online',_utf8mb4'offline'))),
  CONSTRAINT `storage_booking_chk_2` CHECK ((`booking_status` in (_utf8mb4'active',_utf8mb4'completed',_utf8mb4'cancelled')))
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `storage_booking`
--

LOCK TABLES `storage_booking` WRITE;
/*!40000 ALTER TABLE `storage_booking` DISABLE KEYS */;
INSERT INTO `storage_booking` VALUES (7,'BB2001','Balraj Dahiya','9876543210',1,'Haryana','Wheat',5000.00,3,'online',1,1.20,0.50,0.70,10500.00,'active','2026-10-03 04:19:32',1),(8,'BB2002','Sagar Baliyan','9876543215',2,'Haryana','Wheat',2500.00,2,'online',4,2.00,0.70,1.30,6500.00,'active','2026-10-03 04:19:32',2),(9,'BB2003','Satbir Malik','9876543211',3,'Haryana','Sugarcane',3000.00,2,'online',4,1.20,0.70,0.50,3000.00,'completed','2026-10-03 04:19:32',3),(10,'BB2004','Kuldeep Sangwan','9876543213',4,'Haryana','Wheat',2000.00,3,'offline',6,1.20,1.00,0.20,1200.00,'active','2026-10-03 04:19:32',5),(11,'BB2005','Mahender Phogat','9876543214',5,'Haryana','Bajra',1500.00,2,'offline',6,1.00,1.00,0.00,0.00,'cancelled','2026-10-03 04:19:32',6);
/*!40000 ALTER TABLE `storage_booking` ENABLE KEYS */;
UNLOCK TABLES;

--
