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
-- Table structure for table `bible_books`
--

DROP TABLE IF EXISTS `bible_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bible_books` (
  `bible_book_id` int NOT NULL AUTO_INCREMENT,
  `testament` varchar(20) DEFAULT NULL,
  `book` varchar(32) DEFAULT NULL,
  `chapter_count` int DEFAULT NULL,
  PRIMARY KEY (`bible_book_id`),
  UNIQUE KEY `bible_book_id_UNIQUE` (`bible_book_id`)
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bible_books`
--

LOCK TABLES `bible_books` WRITE;
/*!40000 ALTER TABLE `bible_books` DISABLE KEYS */;
INSERT INTO `bible_books` VALUES (1,'Old Testament','Genesis',50),(2,'Old Testament','Exodus',40),(3,'Old Testament','Leviticus',27),(4,'Old Testament','Numbers',36),(5,'Old Testament','Deuteronomy',34),(6,'Old Testament','Joshua',24),(7,'Old Testament','Judges',21),(8,'Old Testament','Ruth',4),(9,'Old Testament','1 Samuel',31),(10,'Old Testament','2 Samuel',24),(11,'Old Testament','1 Kings',22),(12,'Old Testament','2 Kings',25),(13,'Old Testament','1 Chronicles',29),(14,'Old Testament','2 Chronicles',36),(15,'Old Testament','Ezra',10),(16,'Old Testament','Nehemiah',13),(17,'Old Testament','Esther',10),(18,'Old Testament','Job',42),(19,'Old Testament','Psalms',150),(20,'Old Testament','Proverbs',31),(21,'Old Testament','Ecclesiastes',12),(22,'Old Testament','Song of Solomon',8),(23,'Old Testament','Isaiah',66),(24,'Old Testament','Jeremiah',52),(25,'Old Testament','Lamentations',5),(26,'Old Testament','Ezekiel',48),(27,'Old Testament','Daniel',12),(28,'Old Testament','Hosea',14),(29,'Old Testament','Joel',3),(30,'Old Testament','Amos',9),(31,'Old Testament','Obadiah',1),(32,'Old Testament','Jonah',4),(33,'Old Testament','Micah',7),(34,'Old Testament','Nahum',3),(35,'Old Testament','Habakkuk',3),(36,'Old Testament','Zephaniah',3),(37,'Old Testament','Haggai',2),(38,'Old Testament','Zechariah',14),(39,'Old Testament','Malachi',4),(40,'New Testament','Matthew',28),(41,'New Testament','Mark',16),(42,'New Testament','Luke',24),(43,'New Testament','John',21),(44,'New Testament','Acts',28),(45,'New Testament','Romans',16),(46,'New Testament','1 Corinthians',16),(47,'New Testament','2 Corinthians',13),(48,'New Testament','Galatians',6),(49,'New Testament','Ephesians',6),(50,'New Testament','Philippians',4),(51,'New Testament','Colossians',4),(52,'New Testament','1 Thessalonians',5),(53,'New Testament','2 Thessalonians',3),(54,'New Testament','1 Timothy',6),(55,'New Testament','2 Timothy',4),(56,'New Testament','Titus',3),(57,'New Testament','Philemon',1),(58,'New Testament','Hebrews',13),(59,'New Testament','James',5),(60,'New Testament','1 Peter',5),(61,'New Testament','2 Peter',3),(62,'New Testament','1 John',5),(63,'New Testament','2 John',1),(64,'New Testament','3 John',1),(65,'New Testament','Jude',1),(66,'New Testament','Revelation',22);
/*!40000 ALTER TABLE `bible_books` ENABLE KEYS */;
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
