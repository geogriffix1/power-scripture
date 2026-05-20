DROP FUNCTION IF EXISTS `get_bible_chapter_max_verse`;

DELIMITER $$

CREATE FUNCTION `get_bible_chapter_max_verse`(
  p_book VARCHAR(32),
  p_chapter INT
)
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
DECLARE v_max_verse INT DEFAULT NULL;

  SELECT verse_count
  INTO v_max_verse
  FROM bible_chapters
  WHERE book = p_book
    AND chapter_number = p_chapter;

  RETURN v_max_verse;
END$$

DELIMITER ;

DROP FUNCTION IF EXISTS `get_bible_citation_child_count`;

DELIMITER $$

CREATE FUNCTION `get_bible_citation_child_count`(
  p_id INT
)
RETURNS INT
NOT DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_count INT DEFAULT 0;

  SELECT COUNT(*)
  INTO v_count
  FROM bible_theme_to_citations
  WHERE bible_theme_id = p_id;

  RETURN v_count;
END$$

DELIMITER ;

DROP FUNCTION IF EXISTS `get_bible_theme_child_count`;

DELIMITER $$

CREATE FUNCTION `get_bible_theme_child_count`(
  p_id INT
)
RETURNS INT
NOT DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_theme_count INT DEFAULT 0;
  DECLARE v_citation_count INT DEFAULT 0;

  SELECT COUNT(*)
  INTO v_theme_count
  FROM bible_themes
  WHERE bible_theme_parent_id = p_id;

  SELECT COUNT(*)
  INTO v_citation_count
  FROM bible_theme_to_citations
  WHERE bible_theme_id = p_id;

  RETURN v_theme_count + v_citation_count;
END$$

DELIMITER ;

DROP FUNCTION IF EXISTS `get_citation_bible_order`;

DELIMITER $$

CREATE FUNCTION `get_citation_bible_order`(
  p_id INT
)
RETURNS INT
NOT DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_bible_order INT DEFAULT NULL;

  SELECT MIN(t3.bible_order)
  INTO v_bible_order
  FROM bible_citation_verses t2
  JOIN bible_scriptures_niv t3
    ON t2.bible_scripture_niv_id = t3.bible_scripture_niv_id
  WHERE t2.bible_citation_id = p_id;

  RETURN v_bible_order;
END$$

DELIMITER ;

DROP FUNCTION IF EXISTS `get_citation_label`;

DELIMITER $$

CREATE FUNCTION `get_citation_label`(
  p_citation_id INT
)
RETURNS VARCHAR(100)
CHARACTER SET utf8mb4
NOT DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_label VARCHAR(132) DEFAULT '';

  DECLARE v_book VARCHAR(32);
  DECLARE v_chapter INT;
  DECLARE v_verse INT;

  DECLARE v_open_book VARCHAR(32) DEFAULT '';
  DECLARE v_open_chapter INT DEFAULT 0;
  DECLARE v_open_start_verse INT DEFAULT 0;
  DECLARE v_open_verse INT DEFAULT 0;

  DECLARE v_comma VARCHAR(2) DEFAULT '';
  DECLARE v_done BOOL DEFAULT FALSE;

  DECLARE citation_cursor CURSOR FOR
    SELECT
      t3.book,
      t3.chapter_number,
      t3.verse_number
    FROM bible_citation_verses t2
    JOIN bible_scriptures_niv t3
      ON t2.bible_scripture_niv_id = t3.bible_scripture_niv_id
    WHERE t2.bible_citation_id = p_citation_id
    ORDER BY t3.bible_order;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

  OPEN citation_cursor;

  FETCH citation_cursor INTO v_book, v_chapter, v_verse;

  WHILE NOT v_done DO

    IF LENGTH(v_label) < 100 THEN

      IF v_book <> v_open_book
         OR v_chapter <> v_open_chapter
         OR v_verse <> v_open_verse + 1 THEN

        IF v_open_book <> '' THEN

          IF v_open_book REGEXP '^(Philemon|Obadiah|Jude|2 John|3 John)$' THEN
            SET v_label = CONCAT(
              v_label,
              v_comma,
              v_open_book,
              ' ',
              v_open_start_verse
            );
          ELSE
            SET v_label = CONCAT(
              v_label,
              v_comma,
              v_open_book,
              ' ',
              v_open_chapter,
              ':',
              v_open_start_verse
            );
          END IF;

          IF v_open_start_verse <> v_open_verse THEN
            SET v_label = CONCAT(v_label, '-', v_open_verse);
          END IF;

          SET v_comma = ', ';
        END IF;

        SET v_open_book = v_book;
        SET v_open_chapter = v_chapter;
        SET v_open_start_verse = v_verse;
        SET v_open_verse = v_verse;

      ELSE

        SET v_open_verse = v_verse;

      END IF;

    END IF;

    FETCH citation_cursor INTO v_book, v_chapter, v_verse;

  END WHILE;

  CLOSE citation_cursor;

  IF LENGTH(v_label) < 100
     AND v_open_book <> '' THEN

    IF v_open_book REGEXP '^(Philemon|Obadiah|Jude|2 John|3 John)$' THEN
      SET v_label = CONCAT(
        v_label,
        v_comma,
        v_open_book,
        ' ',
        v_open_start_verse
      );
    ELSE
      SET v_label = CONCAT(
        v_label,
        v_comma,
        v_open_book,
        ' ',
        v_open_chapter,
        ':',
        v_open_start_verse
      );
    END IF;

    IF v_open_start_verse <> v_open_verse THEN
      SET v_label = CONCAT(v_label, '-', v_open_verse);
    END IF;

  END IF;

  IF LENGTH(v_label) > 100 THEN
    SET v_label = CONCAT(
      TRIM(SUBSTRING(v_label, 1, 97)),
      '...'
    );
  END IF;

  IF LENGTH(v_label) = 0 THEN
    SET v_label = '[empty]';
  END IF;

  RETURN v_label;
END$$

DELIMITER ;

DROP FUNCTION IF EXISTS `get_next_citation_sequence_from_parent_theme`;

DELIMITER $$

CREATE FUNCTION `get_next_citation_sequence_from_parent_theme`(
  p_theme_id INT
)
RETURNS INT
NOT DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_max_sequence INT DEFAULT 0;

  SELECT COALESCE(MAX(bible_theme_sequence), 0)
  INTO v_max_sequence
  FROM bible_theme_to_citations
  WHERE bible_theme_id = p_theme_id;

  RETURN v_max_sequence + 1;
END$$

DELIMITER ;

DROP FUNCTION IF EXISTS `get_next_theme_sequence_from_parent_theme`;

DELIMITER $$

CREATE FUNCTION `get_next_theme_sequence_from_parent_theme`(
  p_theme_id INT
)
RETURNS INT
NOT DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_max_sequence INT DEFAULT 0;

  SELECT COALESCE(MAX(sequence), 0)
  INTO v_max_sequence
  FROM bible_themes
  WHERE bible_theme_parent_id = p_theme_id;

  RETURN v_max_sequence + 1;
END$$

DELIMITER ;