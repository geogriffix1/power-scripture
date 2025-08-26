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
-- Dumping events for database 'power_scripture_test'
--

--
-- Dumping routines for database 'power_scripture_test'
--
/*!50003 DROP FUNCTION IF EXISTS `get_bible_chapter_max_verse` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_bible_chapter_max_verse`(book VARCHAR(32), chapter INT) RETURNS int
    DETERMINISTIC
BEGIN
	SELECT t.verse_count INTO @max_verse FROM bible_chapters t
	WHERE t.book=book AND t.chapter_number=chapter;
    
  RETURN @max_verse;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_bible_citation_child_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_bible_citation_child_count`(id int) RETURNS int
    DETERMINISTIC
BEGIN
	DECLARE count INT;
	SELECT count(*) into count FROM bible_theme_to_citations where bible_theme_id = id;
	RETURN count;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_bible_theme_child_count` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_bible_theme_child_count`(id int) RETURNS int
    DETERMINISTIC
BEGIN
	#DECLARE count INT;
	SELECT count(*) into @count1 FROM bible_themes where bible_theme_parent_id = id;
    SELECT count(*) into @count2 FROM bible_theme_to_citations where bible_theme_id = id;
	RETURN @count1 + @count2;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_citation_bible_order` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_citation_bible_order`(id int) RETURNS int
    DETERMINISTIC
BEGIN
	DECLARE bible_order INT;
	SELECT MIN(t3.bible_order) INTO bible_order
        FROM bible_citations t1
        JOIN bible_citation_verses t2 ON t2.bible_citation_id = t1.bible_citation_id
        JOIN bible_scriptures_niv t3 ON t2.bible_scripture_niv_id = t3.bible_scripture_niv_id
        WHERE t1.bible_citation_id = id
        ORDER BY t3.bible_order;
	RETURN bible_order;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_citation_label` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_citation_label`(citation_id int) RETURNS varchar(100) CHARSET utf8mb4
    DETERMINISTIC
BEGIN
	DECLARE label VARCHAR(132);
    DECLARE book, open_book VARCHAR(32);
    DECLARE chapter, verse, open_chapter, open_start_verse, open_verse INT;
    DECLARE done BOOL DEFAULT FALSE;
    DECLARE citation_cursor CURSOR FOR 
		SELECT t3.BOOK, t3.CHAPTER_NUMBER, t3.VERSE_NUMBER
        FROM bible_citations t1
        JOIN bible_citation_verses t2 ON t2.bible_citation_id = t1.bible_citation_id
        JOIN bible_scriptures_niv t3 ON t2.bible_scripture_niv_id = t3.bible_scripture_niv_id
        WHERE t1.bible_citation_id = citation_id
        ORDER BY t3.bible_order;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
	SET label = '';
    SET open_book = '', open_chapter = 0, open_start_verse = 0, open_verse = 0;
	OPEN citation_cursor;
	FETCH citation_cursor INTO book, chapter, verse;
    SET @comma = '';
    set @loop_count = 0;
    WHILE NOT done DO
		set @loop_count = @loop_count + 1;
		IF LENGTH(label) < 100 THEN
			IF book <> open_book OR chapter <> open_chapter OR verse <> open_verse + 1 THEN
				IF open_book <> '' THEN
					IF open_book REGEXP 'Philemon|Obadiah|Jude|3 John|2 John' THEN 
						SET label = CONCAT(label, @comma, open_book, ' ', open_start_verse);
                    ELSE
						SET label = CONCAT(label, @comma, open_book, ' ', open_chapter, ':', open_start_verse);
					END IF;
                    IF open_start_verse <> open_verse THEN
                      SET label = CONCAT(label, '-', open_verse);
					END IF;
                    SET @comma = ', ';
                END IF;
                SET open_book = book, open_chapter = chapter, open_verse = verse, open_start_verse = verse;
			ELSE
				SET open_verse = verse;
			END IF;
		END IF;
			
		FETCH citation_cursor  INTO book, chapter, verse;
	END WHILE;
    CLOSE citation_cursor;
    
    IF LENGTH(label) < 100 AND open_book <> '' THEN
		IF open_book REGEXP 'Philemon|Obadiah|Jude|3 John|2 John' THEN 
			SET label = CONCAT(label, @comma, open_book, ' ', open_start_verse);
		ELSE
			SET label = CONCAT(label, @comma, open_book, ' ', open_chapter, ':', open_start_verse);
		END IF;
		IF open_start_verse <> open_verse THEN
		  SET label = CONCAT(label, '-', open_verse);
		END IF;
	END IF;
    
    IF LENGTH(label) > 100 THEN
		SET label = CONCAT(TRIM(SUBSTRING(label, 1, 97)), '...');
	END IF;
    #return @loop_count;
	RETURN label;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_next_citation_sequence_from_parent_theme` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_next_citation_sequence_from_parent_theme`(theme_id INT) RETURNS int
    DETERMINISTIC
BEGIN
	SELECT MAX(t.bible_theme_sequence) INTO @max_sequence FROM bible_theme_to_citations t
	WHERE t.bible_theme_id = theme_id;
    
    IF @max_sequence IS NULL THEN
      SET @max_sequence = 0;
    END IF;
    
	RETURN @max_sequence + 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP FUNCTION IF EXISTS `get_next_theme_sequence_from_parent_theme` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` FUNCTION `get_next_theme_sequence_from_parent_theme`(theme_id int) RETURNS int
    DETERMINISTIC
BEGIN
	SELECT MAX(t.sequence) INTO @max_sequence FROM bible_themes t
	WHERE t.bible_theme_parent_id = theme_id;
    
    IF @max_sequence IS NULL THEN
      SET @max_sequence = 0;
    END IF;
    
	RETURN @max_sequence + 1;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `debug_msg` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `debug_msg`(msg varchar(255))
    DETERMINISTIC
BEGIN
	SELECT CONCAT('** ', msg) '** DEBUG:'; 
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_bible_citation` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `delete_bible_citation`(citation_id INT)
    DETERMINISTIC
BEGIN
	DELETE FROM bible_citation_markups WHERE bible_citation_id = citation_id AND bible_citation_markup_id > 0;
    DELETE FROM bible_citation_verses WHERE bible_citation_id = citation_id AND bible_citation_verse_id > 0;
    DELETE FROM bible_citations WHERE bible_citation_id = citation_id;
    DELETE FROM bible_theme_to_citations WHERE bible_citation_id = citation_id AND bible_theme_to_citation_id > 0;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_bible_theme` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `delete_bible_theme`(theme_id INT)
    DETERMINISTIC
BEGIN
	DECLARE parent_theme_id, child_theme_id, theme_to_citation_id INT;
	DECLARE done BOOL DEFAULT FALSE;
	DECLARE delete_theme_cursor CURSOR FOR
		SELECT t1.bible_theme_id, t2.bible_theme_id
		FROM bible_themes t1
		LEFT JOIN bible_themes t2 ON t1.bible_theme_id = t2.bible_theme_parent_id
        WHERE t1.bible_theme_id = theme_id;
        
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN delete_theme_cursor;
    FETCH delete_theme_cursor INTO parent_theme_id, child_theme_id;
    WHILE NOT done DO
		IF child_theme_id IS NOT NULL THEN
			CALL delete_bible_theme(child_theme_id);
		END IF;

		CALL delete_bible_theme_citation_references(parent_theme_id);
        DELETE FROM bible_themes WHERE bible_theme_id = parent_theme_id;
		FETCH delete_theme_cursor INTO parent_theme_id, child_theme_id;
    END WHILE;
    CLOSE delete_theme_cursor;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_bible_theme_citation_references` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `delete_bible_theme_citation_references`(theme_id INT)
    DETERMINISTIC
BEGIN
	DECLARE theme_to_citation_id INT;
	DECLARE done BOOL DEFAULT FALSE;
	DECLARE delete_citation_reference_cursor CURSOR FOR
		SELECT t1.bible_theme_to_citation_id
		FROM bible_theme_to_citations t1
        WHERE t1.bible_theme_id = theme_id;
        
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN delete_citation_reference_cursor;
    FETCH delete_citation_reference_cursor INTO theme_to_citation_id;
    WHILE NOT done DO
		CALL delete_bible_theme_to_citation(theme_to_citation_id);
		FETCH delete_citation_reference_cursor INTO theme_to_citation_id;
    END WHILE;
    CLOSE delete_citation_reference_cursor;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_bible_theme_to_citation` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `delete_bible_theme_to_citation`(theme_to_citation_id int)
    DETERMINISTIC
BEGIN
	SELECT @bible_citation_id = bible_citation_id FROM bible_theme_to_citation WHERE bible_theme_to_citation_id = theme_to_citation_id;
    SELECT @count = COUNT(*) FROM bible_theme_to_citation WHERE bible_citation_id = @bible_citation_id;
    IF @count = 1 THEN
		CALL delete_citation(@bible_citation_id);
    END IF;
    
    DELETE FROM bible_theme_to_citations WHERE bible_theme_to_citation_id = theme_to_citation_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `delete_citation` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `delete_citation`(citation_id int)
    DETERMINISTIC
BEGIN
	DELETE FROM bible_citation_markups WHERE bible_citation_id = citation_id;
    DELETE FROM bible_citation_verses WHERE bible_citation_id = citation_id;
    DELETE FROM bible_citation WHERE bible_citation_id = citation_id;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `normalize_citation_sequence` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `normalize_citation_sequence`(in_theme_id INT)
    DETERMINISTIC
BEGIN
	DECLARE new_sequence INT;
    DECLARE theme_to_citation_id, seq INT;
	DECLARE done BOOL DEFAULT FALSE;
	DECLARE normalize_sequence_cursor CURSOR FOR
		SELECT bible_theme_to_citation_id, bible_theme_sequence FROM bible_theme_to_citations
        WHERE bible_theme_id = in_theme_id
        ORDER BY bible_theme_sequence;
        
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN normalize_sequence_cursor;
	SET new_sequence = 1;
    FETCH normalize_sequence_cursor INTO theme_to_citation_id, seq;
    WHILE NOT done DO
		IF seq <> new_sequence THEN
			UPDATE bible_theme_to_citations
            SET bible_theme_sequence = new_sequence, updated_at = NOW()
            WHERE bible_theme_to_citation_id = theme_to_citation_id;
        END IF;
        SET new_sequence = new_sequence + 1;
		FETCH normalize_sequence_cursor INTO theme_to_citation_id, seq;
    END WHILE;
    CLOSE normalize_sequence_cursor;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `normalize_theme_sequence` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `normalize_theme_sequence`(in_theme_id INT)
    DETERMINISTIC
BEGIN
	DECLARE new_sequence INT;
    DECLARE child_id, seq INT;
	DECLARE done BOOL DEFAULT FALSE;
	DECLARE normalize_theme_cursor CURSOR FOR
		SELECT bible_theme_id, sequence FROM bible_themes
        WHERE bible_theme_parent_id = in_theme_id
        ORDER BY sequence;
        
	DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN normalize_theme_cursor;
	SET new_sequence = 1;
    FETCH normalize_theme_cursor INTO child_id, seq;
    WHILE NOT done DO
		IF seq <> new_sequence THEN
			UPDATE bible_themes SET sequence = new_sequence, updated_at = NOW() WHERE bible_theme_id = child_id;
        END IF;
        SET new_sequence = new_sequence + 1;
		FETCH normalize_theme_cursor INTO child_id, seq;
    END WHILE;
    CLOSE normalize_theme_cursor;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `reorder_citation_sequence` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `reorder_citation_sequence`(in_parent_theme_id int, in_theme_to_citation_id_sequence varchar(500))
    DETERMINISTIC
BEGIN
    DECLARE citation_count INT DEFAULT 0;
    DECLARE citation_index INT DEFAULT 0;
    DECLARE theme_to_citation_id_string VARCHAR(10);
    DECLARE theme_to_citation_id INT;
    DECLARE theme_to_citation_id_from_db INT;
    DECLARE new_sequence INT DEFAULT 1;
    
    SELECT COUNT(*) INTO citation_count FROM bible_theme_to_citations WHERE bible_theme_id = in_parent_theme_id;
    SET theme_to_citation_id_string = REGEXP_SUBSTR(in_theme_to_citation_id_sequence, '\\d+', 1, citation_index + 1);
	SET theme_to_citation_id = CAST(theme_to_citation_id_string AS SIGNED);
    SET theme_to_citation_id_from_db = NULL;
    IF theme_to_citation_id IS NOT NULL THEN
		SELECT bible_theme_to_citation_id INTO theme_to_citation_id_from_db
			FROM bible_theme_to_citations
			WHERE bible_theme_id = in_parent_theme_id AND bible_theme_to_citation_id = theme_to_citation_id;
	END IF;
    
    WHILE theme_to_citation_id_from_db IS NOT NULL DO
        SET citation_index = citation_index + 1;
		SET theme_to_citation_id_string = REGEXP_SUBSTR(in_theme_to_citation_id_sequence, '\\d+', 1, citation_index + 1);
		SET theme_to_citation_id = CAST(theme_to_citation_id_string AS SIGNED);
		SET theme_to_citation_id_from_db = NULL;
		IF theme_to_citation_id IS NOT NULL THEN
			SELECT bible_theme_to_citation_id INTO theme_to_citation_id_from_db
				FROM bible_theme_to_citations
				WHERE bible_theme_id = in_parent_theme_id AND bible_theme_to_citation_id = theme_to_citation_id;
		END IF;
    END WHILE;
    
    if (child_index <> child_theme_count) THEN
		SIGNAL SQLSTATE '45000'
		  SET MESSAGE_TEXT = 'ERROR: reorder_citation_sequence - Unexpected input ';
	ELSE
		SET citation_index = 1;
		SET theme_to_citation_id_string = REGEXP_SUBSTR(in_theme_to_citation_id_sequence, '\\d+', 1, citation_index);
		SET theme_to_citation_id = CAST(theme_to_citation_id_string AS SIGNED);
		
		WHILE new_sequence <= citation_count DO
			UPDATE bible_theme_to_citations
				SET sequence = new_sequence, updated_at = NOW()
				WHERE sequence <> new_sequence AND bible_theme_id = in_parent_theme_id AND bible_theme_to_citation_id = theme_to_citation_id;

			SET new_sequence = new_sequence + 1;
			SET citation_index = citation_index + 1;            
			SET theme_to_citation_id_string = REGEXP_SUBSTR(in_theme_to_citation_id_sequence, '\\d+', 1, citation_index);
            SET theme_to_citation_id = CAST(theme_to_citation_id AS SIGNED);
		END WHILE;		
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `reorder_theme_sequence` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `reorder_theme_sequence`(in_parent_theme_id int, in_child_theme_id_sequence varchar(500))
    DETERMINISTIC
BEGIN
	DECLARE child_counter INT DEFAULT 0;
    DECLARE child_theme_count INT DEFAULT 0;
    DECLARE child_index INT DEFAULT 0;
    DECLARE child_theme_id_string VARCHAR(10);
    DECLARE child_theme_id INT;
    DECLARE child_theme_id_from_db INT;
    DECLARE new_sequence INT DEFAULT 1;
    
    SELECT COUNT(*) INTO child_theme_count FROM bible_themes WHERE bible_theme_parent_id = in_parent_theme_id;
    SET child_theme_id_string = REGEXP_SUBSTR(in_child_theme_id_sequence, '\\d+', 1, child_index + 1);
	SET child_theme_id = CAST(child_theme_id_string AS SIGNED);
    SET child_theme_id_from_db = NULL;
    IF child_theme_id IS NOT NULL THEN
		SELECT bible_theme_id INTO child_theme_id_from_db
			FROM bible_themes
			WHERE bible_theme_parent_id = in_parent_theme_id AND bible_theme_id = child_theme_id;
	END IF;
    
    WHILE child_theme_id_from_db IS NOT NULL DO
        SET child_index = child_index + 1;
		SET child_theme_id_string = REGEXP_SUBSTR(in_child_theme_id_sequence, '\\d+', 1, child_index + 1);
		SET child_theme_id = CAST(child_theme_id_string AS SIGNED);
		SET child_theme_id_from_db = NULL;
		IF child_theme_id IS NOT NULL THEN
			SELECT bible_theme_id INTO child_theme_id_from_db
				FROM bible_themes
				WHERE bible_theme_parent_id = in_parent_theme_id AND bible_theme_id = child_theme_id;
		END IF;
    END WHILE;
    
    if (child_index <> child_theme_count) THEN
		SIGNAL SQLSTATE '45000'
		  SET MESSAGE_TEXT = 'ERROR: reorder_theme_sequence - Unexpected input ';
	ELSE
		SET child_index = 1;
		SET child_theme_id_string = REGEXP_SUBSTR(in_child_theme_id_sequence, '\\d+', 1, child_index);
		SET child_theme_id = CAST(child_theme_id_string AS SIGNED);
		
		WHILE new_sequence <= child_theme_count DO
			UPDATE bible_themes
				SET sequence = new_sequence, updated_at = NOW()
				WHERE sequence <> new_sequence AND bible_theme_parent_id = in_parent_theme_id AND bible_theme_id = child_theme_id;

			SET new_sequence = new_sequence + 1;
			SET child_index = child_index + 1;            
			SET child_theme_id_string = REGEXP_SUBSTR(in_child_theme_id_sequence, '\\d+', 1, child_index);
            SET child_theme_id = CAST(child_theme_id_string AS SIGNED);
		END WHILE;		
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 DROP PROCEDURE IF EXISTS `test` */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `test`()
BEGIN
	 DECLARE in_child_theme_id_sequence VARCHAR(100) DEFAULT '6,7,8,26,25,14,15,18';
     DECLARE child_theme_id_string VARCHAR(10);
     SET child_theme_id_string = REGEXP_SUBSTR(in_child_theme_id_sequence, '\d+', 1, 1);
     SELECT child_theme_id_string;
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

-- Dump completed on 2025-08-26  8:09:55
