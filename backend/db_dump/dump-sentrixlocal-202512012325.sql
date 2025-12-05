-- MySQL dump 10.13  Distrib 8.0.19, for Win64 (x86_64)
--
-- Host: localhost    Database: sentrixlocal
-- ------------------------------------------------------
-- Server version	8.0.37

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `employee_account`
--

DROP TABLE IF EXISTS `employee_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_account` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `position` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(256) NOT NULL,
  `account_created` datetime DEFAULT CURRENT_TIMESTAMP,
  `account_last_modified` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `username` (`username`),
  CONSTRAINT `fk_employee_account_info` FOREIGN KEY (`employee_id`) REFERENCES `employee_info` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_account`
--

LOCK TABLES `employee_account` WRITE;
/*!40000 ALTER TABLE `employee_account` DISABLE KEYS */;
INSERT INTO `employee_account` VALUES (1,'Admin','daryl iveen-cogal-bisaya','$2b$10$Ankjnq5AhtZHHN/HiXq7leCoDP8MS5WHrWTCOjQOuDicSqCPYNJgy','2025-11-07 05:55:38','2025-11-28 15:47:24'),(4,'General Physician','hulgado-emmanuel-semilla','$2b$10$4FU1wbVXy25hn8uT3B7CJu5Cu1raRUiHV0YP03Mz0aEp47B4ueq76','2025-11-28 10:50:42','2025-11-28 12:34:50'),(6,'Receptionist','alay-darryl john-dela cruz','$2b$10$.NvKcQH.sW5C0HpBqrGwkuJxuja/JRWUB6.WMPaUcqAnSfWNP56UK','2025-11-28 10:55:12','2025-11-28 10:55:12'),(7,'Cashier','valdez-john paul -panigale','$2b$10$9wCGCg2yromNUeB/DRhrhebwBc//syxk/m15uC8Pbnce.n028QNHm','2025-11-28 10:56:09','2025-11-28 10:56:09'),(8,'Medical Technologist / Lab Technician','ramirez-john gabriel-cogal','$2b$10$WLAtQWe3La.vK6Lrk2ECPe3fzTy1bTF47xltlPGuDPhAsLGBBS07.','2025-11-28 10:57:06','2025-11-28 10:57:06');
/*!40000 ALTER TABLE `employee_account` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_employee_account_insert` BEFORE INSERT ON `employee_account` FOR EACH ROW SET NEW.employee_id = COALESCE(NEW.employee_id, 1) */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `employee_info`
--

DROP TABLE IF EXISTS `employee_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_info` (
  `employee_id` int NOT NULL AUTO_INCREMENT,
  `profile_picture` longblob,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `sex` enum('Male','Female') DEFAULT NULL,
  `phone` varchar(100) DEFAULT NULL,
  `address` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`employee_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_info`
--

LOCK TABLES `employee_info` WRITE;
/*!40000 ALTER TABLE `employee_info` DISABLE KEYS */;
INSERT INTO `employee_info` VALUES (1,NULL,'Cogal','Bisaya','Daryl iveen','valdez_johnpaul@plpasig.edu.ph','Male','5345345','3453453'),(4,NULL,'Emmanuel','Semilla','Hulgado','vergarajoshuamiguel@gmail.com','Male','5345','3453245'),(5,NULL,'Darryl John','Dela Cruz','Alay','3423...@gmail.com','Male','3123123','123123'),(6,NULL,'Darryl John','Dela Cruz','Alay','hulgado_emmanuel@plpasig.edu.ph','Male','2143234','234234'),(7,NULL,'John Paul ','Panigale','Valdez','valdez_john2paul@plpasig.edu.ph','Male','213123','213123'),(8,NULL,'John Gabriel','Cogal','Ramirez','ramirez_johngabriel@plpasig.edu.ph','Male','234234','23423');
/*!40000 ALTER TABLE `employee_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_timesheet`
--

DROP TABLE IF EXISTS `employee_timesheet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_timesheet` (
  `record_id` int NOT NULL AUTO_INCREMENT,
  `employee_id` int DEFAULT NULL,
  `timesheet_date` date DEFAULT NULL,
  `timesheet_time` varchar(50) DEFAULT NULL,
  `max_appointment` int DEFAULT '2',
  PRIMARY KEY (`record_id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_timesheet`
--

LOCK TABLES `employee_timesheet` WRITE;
/*!40000 ALTER TABLE `employee_timesheet` DISABLE KEYS */;
INSERT INTO `employee_timesheet` VALUES (1,1,'2025-11-09','06:00 AM',3),(2,1,'2025-11-10','06:00 AM',3),(3,1,'2025-11-11','06:00 AM',3),(4,1,'2025-11-12','06:00 AM',3),(5,1,'2025-11-13','06:00 AM',3),(6,1,'2025-11-13','07:00 AM',3),(7,1,'2025-11-12','07:00 AM',3),(11,7,'2025-10-26','06:00 AM',2),(12,4,'2025-12-01','06:00 AM',10),(14,4,'2025-11-28','07:00 AM',13),(15,1,'2025-11-08','06:00 AM',2),(16,1,'2025-11-12','06:00 AM',2),(17,1,'2025-11-12','07:00 AM',2),(18,1,'2025-11-11','06:00 AM',2),(19,1,'2025-11-11','07:00 AM',2),(20,1,'2025-11-10','06:00 AM',2),(21,1,'2025-11-09','06:00 AM',2),(22,1,'2025-10-26','06:00 AM',2),(23,1,'2025-10-27','06:00 AM',2),(24,1,'2025-10-25','07:00 AM',2);
/*!40000 ALTER TABLE `employee_timesheet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_allergy`
--

DROP TABLE IF EXISTS `patient_allergy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_allergy` (
  `record_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `allergen` varchar(100) NOT NULL,
  `reaction` varchar(200) NOT NULL,
  `severity` enum('Mild','Moderate','Severe') DEFAULT NULL,
  PRIMARY KEY (`record_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `patient_allergy_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient_info` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_allergy`
--

LOCK TABLES `patient_allergy` WRITE;
/*!40000 ALTER TABLE `patient_allergy` DISABLE KEYS */;
INSERT INTO `patient_allergy` VALUES (1,1,'324','324','Mild'),(2,1,'324','324','Mild'),(3,2,'Pagpag','nagiging bisakol','Mild'),(4,3,'Peanuts','Rash','Moderate');
/*!40000 ALTER TABLE `patient_allergy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_emergency_contact`
--

DROP TABLE IF EXISTS `patient_emergency_contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_emergency_contact` (
  `record_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `contact_name` varchar(100) NOT NULL,
  `relation` varchar(50) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`record_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `patient_emergency_contact_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient_info` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_emergency_contact`
--

LOCK TABLES `patient_emergency_contact` WRITE;
/*!40000 ALTER TABLE `patient_emergency_contact` DISABLE KEYS */;
INSERT INTO `patient_emergency_contact` VALUES (1,1,'4234','34','234','gg@gmail.com'),(2,2,'Emmanuel','Slave Owner','6456456','valdez@gmail.com'),(3,3,'235435345','dsfdsf','345345345345','');
/*!40000 ALTER TABLE `patient_emergency_contact` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_info`
--

DROP TABLE IF EXISTS `patient_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_info` (
  `patient_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `marital_status` enum('Single','Married','Divorced','Widowed') DEFAULT NULL,
  `street_address` varchar(200) DEFAULT NULL,
  `barangay` varchar(100) DEFAULT NULL,
  `city_municipality` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `region` varchar(100) DEFAULT NULL,
  `postal_code` varchar(20) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`patient_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_info`
--

LOCK TABLES `patient_info` WRITE;
/*!40000 ALTER TABLE `patient_info` DISABLE KEYS */;
INSERT INTO `patient_info` VALUES (1,'435','345','345','2025-11-11','Female','gdf','sdfsdf','vergarajoshuamiguel@gmail.com','Single','sdf','sdf','sdf','sdf','sdf','sdf','wqeqwe','weqwe','2025-11-07 03:56:08'),(2,'John','Paul','Valdez','2004-01-05','Male','Filipino','BANANA PLANTER','valdez@gmail.com','Single','Nigga St.','Pinagbuhatan','Pasig City','Metro Manila','NCR','1600','9834235345','','2025-11-07 07:28:38'),(3,'John Paul','Valdez','Valdez','2006-01-07','Male','Filipino','Student','valdez@gmail.com','Single','PAsig','Pasig','Pasig','PAsig','Pasig','2133','09123192494','','2025-11-08 03:19:31');
/*!40000 ALTER TABLE `patient_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_medical_info`
--

DROP TABLE IF EXISTS `patient_medical_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_medical_info` (
  `record_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `blood_type` enum('A+','A-','B+','B-','AB+','AB-','O+','O-') DEFAULT NULL,
  `height` int DEFAULT NULL,
  `weight` float DEFAULT NULL,
  `primary_physician` varchar(100) DEFAULT NULL,
  `medical_history` text,
  `current_medications` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `patient_medical_info_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient_info` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_medical_info`
--

LOCK TABLES `patient_medical_info` WRITE;
/*!40000 ALTER TABLE `patient_medical_info` DISABLE KEYS */;
INSERT INTO `patient_medical_info` VALUES (1,1,'A-',34,324,'234','234','234','2025-11-07 03:56:08'),(2,2,'AB+',199,234,'Dr.Cogal','Bisaya','Puno ng saging','2025-11-07 07:28:38'),(3,3,'A+',150,200,'Dr. Cogal','None','None','2025-11-08 03:19:31');
/*!40000 ALTER TABLE `patient_medical_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_visit_record`
--

DROP TABLE IF EXISTS `patient_visit_record`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_visit_record` (
  `record_no` int NOT NULL AUTO_INCREMENT,
  `patient_id` int NOT NULL,
  `employee_id` int NOT NULL,
  `date_created` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_scheduled` datetime DEFAULT NULL,
  `visit_type` enum('Walk-in','Scheduled/Follow-Up','Emergency') DEFAULT NULL,
  `visit_purpose_title` varchar(100) DEFAULT NULL,
  `visit_chief_complaint` varchar(500) DEFAULT NULL,
  `time_scheduled` varchar(100) DEFAULT NULL,
  `appointment_code` varchar(50) DEFAULT NULL,
  `visit_status` varchar(100) DEFAULT 'Scheduled',
  PRIMARY KEY (`record_no`),
  KEY `patient_id` (`patient_id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `patient_visit_record_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient_info` (`patient_id`),
  CONSTRAINT `patient_visit_record_ibfk_2` FOREIGN KEY (`employee_id`) REFERENCES `employee_info` (`employee_id`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_visit_record`
--

LOCK TABLES `patient_visit_record` WRITE;
/*!40000 ALTER TABLE `patient_visit_record` DISABLE KEYS */;
INSERT INTO `patient_visit_record` VALUES (7,3,4,'2025-11-28 18:41:54','2025-11-28 00:00:00','Scheduled/Follow-Up','sdads','asd','07:00 AM','APT-314949-238','Done'),(20,1,7,'2025-11-30 19:28:48','2025-12-02 00:00:00','Scheduled/Follow-Up','sdads','asd','07:00 AM','APT-314949-238','Done'),(21,2,7,'2025-11-28 19:28:48','2025-11-28 00:00:00','Scheduled/Follow-Up','sdads','asd','07:00 AM','APT-314949-239','Done'),(22,3,7,'2025-11-28 19:28:48','2025-11-28 00:00:00','Scheduled/Follow-Up','sdads','asd','07:00 AM','APT-314949-240','Done'),(23,1,4,'2025-11-28 19:28:48','2025-11-28 00:00:00','Scheduled/Follow-Up','sdads','asd','07:00 AM','APT-314949-241','Done'),(24,2,4,'2025-11-28 19:28:48','2025-11-28 00:00:00','Scheduled/Follow-Up','sdads','asd','07:00 AM','APT-314949-242','Done'),(25,3,4,'2025-11-30 19:28:48','2025-12-01 00:00:00','Scheduled/Follow-Up','sdads','asd','01:00 AM','APT-314949-243','Queued'),(26,3,4,'2025-12-01 13:01:03','2025-12-01 00:00:00','Scheduled/Follow-Up','dssad','asd','06:00 AM','APT940631633966','Scheduled'),(27,3,4,'2025-12-01 13:07:55','2025-12-01 00:00:00','Scheduled/Follow-Up','dsfsd','sdf','06:00 AM','APT944756782351','Scheduled'),(28,3,4,'2025-12-01 13:11:53','2025-12-01 00:00:00','Scheduled/Follow-Up','f','f','06:00 AM','APT947137718670','Scheduled');
/*!40000 ALTER TABLE `patient_visit_record` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `patient_vital_signs`
--

DROP TABLE IF EXISTS `patient_vital_signs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `patient_vital_signs` (
  `record_id` int NOT NULL AUTO_INCREMENT,
  `patient_id` int DEFAULT NULL,
  `blood_pressure` varchar(50) DEFAULT NULL,
  `heart_rate` int DEFAULT NULL,
  `temperature` float DEFAULT NULL,
  `respiratory_rate` int DEFAULT NULL,
  `oxygen_saturation` int DEFAULT NULL,
  `recorded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`),
  KEY `patient_id` (`patient_id`),
  CONSTRAINT `patient_vital_signs_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patient_info` (`patient_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `patient_vital_signs`
--

LOCK TABLES `patient_vital_signs` WRITE;
/*!40000 ALTER TABLE `patient_vital_signs` DISABLE KEYS */;
INSERT INTO `patient_vital_signs` VALUES (1,1,'234',324,324,324,323,'2025-11-07 03:56:08'),(2,2,'13124',323,23,23,23,'2025-11-07 07:28:38'),(3,3,'120/80',72,38,16,423,'2025-11-08 03:19:32');
/*!40000 ALTER TABLE `patient_vital_signs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'sentrixlocal'
--
/*!50003 DROP PROCEDURE IF EXISTS `DeleteEmployee` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `DeleteEmployee`(IN id1 INT)
BEGIN
    DELETE employee_account, employee_info
    FROM employee_account
    INNER JOIN employee_info USING (employee_id)
    WHERE employee_account.employee_id = id1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `RegisterEmployee` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `RegisterEmployee`(
    IN p_first_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(100),
    in p_phone VARCHAR(100),
    in p_address VARCHAR(100),
    IN p_sex ENUM('Male','Female'),
    IN p_username VARCHAR(100),
    IN p_password VARCHAR(256),
    IN p_position VARCHAR(50)
)
BEGIN
    DECLARE new_employee_id INT;
    DECLARE email_count INT DEFAULT 0;
    DECLARE username_count INT DEFAULT 0;
    
    
    start transaction;
    
    
    SELECT COUNT(*) INTO email_count FROM employee_info WHERE email = p_email;
    IF email_count > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Email already exists';
    END IF;
    
    
    SELECT COUNT(*) INTO username_count FROM employee_account WHERE username = p_username;
    IF username_count > 0 THEN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Username already exists';
    END IF;
    
    
    SET FOREIGN_KEY_CHECKS = 0;
    
    
    SELECT COALESCE(MAX(employee_id), 0) + 1 INTO new_employee_id FROM employee_info;
    
    
    INSERT INTO employee_account (employee_id, username, password, position)
    VALUES (new_employee_id, p_username, p_password, p_position);
    
    
    INSERT INTO employee_info (employee_id, first_name, middle_name, last_name, email, phone, address, sex)
    VALUES (new_employee_id, p_first_name, p_middle_name, p_last_name, p_email, p_phone, p_address, p_sex);
    
    
    SET FOREIGN_KEY_CHECKS = 1;
    
    
    COMMIT;
    
    
    SELECT 
        new_employee_id AS employee_id,
        'Employee registered successfully' AS message;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-01 23:25:38
