CREATE DATABASE  IF NOT EXISTS `power_scripture_test` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `power_scripture_test`;
-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: power_scripture_test
-- ------------------------------------------------------
-- Server version	8.0.37

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
-- Table structure for table `bible_themes`
--

DROP TABLE IF EXISTS `bible_themes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bible_themes` (
  `bible_theme_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `description` varchar(100) DEFAULT NULL,
  `sequence` int DEFAULT NULL,
  `bible_theme_parent_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`bible_theme_id`),
  UNIQUE KEY `bible_theme_id_UNIQUE` (`bible_theme_id`)
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bible_themes`
--

LOCK TABLES `bible_themes` WRITE;
/*!40000 ALTER TABLE `bible_themes` DISABLE KEYS */;
INSERT INTO `bible_themes` VALUES (1,'Persons','Scriptures about Persons in the Bible',1,0,'2024-07-01 11:49:50','2024-07-01 11:49:50'),(2,'Places','Scriptures related to Locations in the Bible',2,0,'2024-07-04 12:22:11','2024-07-04 12:22:11'),(3,'Stories','Scriptures which tell a Bible story',3,0,'2024-07-04 12:29:53','2024-07-04 12:29:53'),(4,'Inspiration','Bible Scriptures that Inspire',4,0,'2024-07-04 13:05:35','2024-07-04 13:05:35'),(5,'Events','Scriptures about Biblical Events',5,0,'2024-07-04 15:51:06','2024-07-04 15:51:06'),(6,'Genesis','People introduced in the book of Genesis',1,1,'2024-07-25 11:55:16','2024-09-16 18:10:39'),(7,'Exodus','People introduced in the book of Exodus',2,1,'2024-07-26 03:15:00','2024-09-16 18:10:39'),(8,'Judges','People introduced in the book of Judges',3,1,'2024-07-26 03:22:15','2024-09-05 22:08:27'),(14,'Kings','The Kings of Judah and Israel',7,1,'2024-07-27 14:07:19','2024-08-30 12:31:47'),(15,'Prophets','Prophets throughout scripture',8,1,'2024-07-27 17:17:21','2024-08-30 12:31:47'),(18,'Villains','Bad Guys of the Bible',9,1,'2024-07-27 18:34:29','2024-08-30 12:31:47'),(25,'Women','Key women in the Bible',6,1,'2024-07-27 21:34:25','2024-08-30 12:31:47'),(26,'Gospels','People mentioned in the Gospels',4,1,'2024-07-27 22:25:12','2024-09-05 22:11:32'),(36,'Jesus Christ','Scriptures about the Son of God',5,1,'2024-08-25 03:48:41','2024-09-05 22:11:32'),(40,'Simon Peter','Disciple of Jesus',10,1,'2024-08-25 06:44:53','2024-08-25 06:44:53'),(41,'Paul','Epistle Writer',11,1,'2024-08-25 07:01:46','2024-08-25 07:01:46'),(42,'George R Griffin','The Legend continues.',1,4,'2024-08-25 07:15:29','2024-09-02 22:48:45');
/*!40000 ALTER TABLE `bible_themes` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-26  8:09:55
