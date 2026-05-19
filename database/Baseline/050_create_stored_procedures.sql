DROP PROCEDURE IF EXISTS `add_scriptures_to_citation`;

DELIMITER $$

CREATE PROCEDURE `add_scriptures_to_citation`(
  IN obj_json JSON
)
BEGIN
  DECLARE v_citation_id INT;
  DECLARE v_scripture_id INT;
  DECLARE v_i INT DEFAULT 0;
  DECLARE v_total INT DEFAULT 0;

  SET v_citation_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(obj_json, '$.citation_id')) AS UNSIGNED);
  SET v_total = JSON_LENGTH(JSON_EXTRACT(obj_json, '$.scripture_ids'));

  WHILE v_i < v_total DO
    SET v_scripture_id = CAST(
      JSON_UNQUOTE(JSON_EXTRACT(obj_json, CONCAT('$.scripture_ids[', v_i, ']')))
      AS UNSIGNED
    );

    INSERT IGNORE INTO bible_citation_verses
      (bible_citation_id, bible_scripture_niv_id, hide, created_at, updated_at)
    VALUES
      (v_citation_id, v_scripture_id, 'N', NOW(), NOW());

    SET v_i = v_i + 1;
  END WHILE;

  SELECT
    t1.bible_citation_verse_id AS id,
    t1.bible_citation_id AS citation_id,
    t1.bible_scripture_niv_id AS scripture_id,
    t1.hide,
    t2.book,
    t2.chapter_number,
    t2.verse_number,
    t2.text,
    t2.bible_order
  FROM bible_citation_verses t1
  JOIN bible_scriptures_niv t2
    ON t2.bible_scripture_niv_id = t1.bible_scripture_niv_id
  WHERE t1.bible_citation_id = v_citation_id
  ORDER BY t2.bible_order;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `debug_msg`;

DELIMITER $$

CREATE PROCEDURE `debug_msg`(
  IN msg VARCHAR(255)
)
BEGIN
  SELECT CONCAT('** ', msg, ' ** DEBUG:') AS debug_message;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `delete_bible_citation`;

DELIMITER $$

CREATE PROCEDURE `delete_bible_citation`(
  IN p_citation_id INT
)
BEGIN
  DELETE FROM bible_citation_markups
  WHERE bible_citation_id = p_citation_id
    AND bible_citation_markup_id > 0;

  DELETE FROM bible_citation_verses
  WHERE bible_citation_id = p_citation_id
    AND bible_citation_verse_id > 0;

  DELETE FROM bible_theme_to_citations
  WHERE bible_citation_id = p_citation_id
    AND bible_theme_to_citation_id > 0;

  DELETE FROM bible_citations
  WHERE bible_citation_id = p_citation_id;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `delete_bible_citation_verse`;

DELIMITER $$

CREATE PROCEDURE `delete_bible_citation_verse`(
  IN p_verse_id INT
)
BEGIN
  DELETE FROM bible_citation_markups
  WHERE bible_citation_verse_id = p_verse_id
    AND bible_citation_markup_id > 0;

  DELETE FROM bible_citation_verses
  WHERE bible_citation_verse_id = p_verse_id
    AND bible_citation_verse_id > 0;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `delete_bible_theme`;

DELIMITER $$

CREATE PROCEDURE `delete_bible_theme`(
  IN p_theme_id INT
)
BEGIN
  DECLARE v_parent_id INT DEFAULT 0;

  SELECT bible_theme_parent_id
  INTO v_parent_id
  FROM bible_themes
  WHERE bible_theme_id = p_theme_id;

  IF p_theme_id > 0 AND v_parent_id > 0 THEN

    DROP TEMPORARY TABLE IF EXISTS temp_theme_ids;
    DROP TEMPORARY TABLE IF EXISTS temp_citation_ids;
    DROP TEMPORARY TABLE IF EXISTS temp_orphan_citation_ids;

    CREATE TEMPORARY TABLE temp_theme_ids (
      bible_theme_id INT NOT NULL PRIMARY KEY
    );

    CREATE TEMPORARY TABLE temp_citation_ids (
      bible_citation_id INT NOT NULL PRIMARY KEY
    );

    CREATE TEMPORARY TABLE temp_orphan_citation_ids (
      bible_citation_id INT NOT NULL PRIMARY KEY
    );

    INSERT INTO temp_theme_ids (bible_theme_id)
    WITH RECURSIVE theme_tree AS (
      SELECT bible_theme_id
      FROM bible_themes
      WHERE bible_theme_id = p_theme_id

      UNION ALL

      SELECT child.bible_theme_id
      FROM bible_themes child
      JOIN theme_tree parent
        ON child.bible_theme_parent_id = parent.bible_theme_id
    )
    SELECT bible_theme_id
    FROM theme_tree;

    INSERT IGNORE INTO temp_citation_ids (bible_citation_id)
    SELECT bible_citation_id
    FROM bible_theme_to_citations
    WHERE bible_theme_id IN (
      SELECT bible_theme_id FROM temp_theme_ids
    );

    DELETE FROM bible_theme_to_citations
    WHERE bible_theme_id IN (
      SELECT bible_theme_id FROM temp_theme_ids
    )
    AND bible_theme_to_citation_id > 0;

    INSERT IGNORE INTO temp_orphan_citation_ids (bible_citation_id)
    SELECT t1.bible_citation_id
    FROM temp_citation_ids t1
    LEFT JOIN bible_theme_to_citations t2
      ON t2.bible_citation_id = t1.bible_citation_id
    WHERE t2.bible_citation_id IS NULL;

    DELETE FROM bible_citation_markups
    WHERE bible_citation_id IN (
      SELECT bible_citation_id FROM temp_orphan_citation_ids
    )
    AND bible_citation_markup_id > 0;

    DELETE FROM bible_citation_verses
    WHERE bible_citation_id IN (
      SELECT bible_citation_id FROM temp_orphan_citation_ids
    )
    AND bible_citation_verse_id > 0;

    DELETE FROM bible_citations
    WHERE bible_citation_id IN (
      SELECT bible_citation_id FROM temp_orphan_citation_ids
    )
    AND bible_citation_id > 0;

    DELETE FROM bible_themes
    WHERE bible_theme_id IN (
      SELECT bible_theme_id FROM temp_theme_ids
    )
    AND bible_theme_id > 0;

  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `delete_bible_theme_to_citation`;

DELIMITER $$

CREATE PROCEDURE `delete_bible_theme_to_citation`(
  IN p_theme_to_citation_id INT
)
BEGIN
  DECLARE v_bible_citation_id INT;
  DECLARE v_bible_theme_id INT;
  DECLARE v_theme_sibling_count INT DEFAULT 0;
  DECLARE v_citation_sibling_count INT DEFAULT 0;

  SELECT bible_citation_id, bible_theme_id
  INTO v_bible_citation_id, v_bible_theme_id
  FROM bible_theme_to_citations
  WHERE bible_theme_to_citation_id = p_theme_to_citation_id;

  SELECT COUNT(*)
  INTO v_theme_sibling_count
  FROM bible_theme_to_citations
  WHERE bible_theme_id = v_bible_theme_id;

  SELECT COUNT(*)
  INTO v_citation_sibling_count
  FROM bible_theme_to_citations
  WHERE bible_citation_id = v_bible_citation_id;

  IF v_citation_sibling_count = 1 THEN
    CALL delete_bible_citation(v_bible_citation_id);
  ELSE
    DELETE FROM bible_theme_to_citations
    WHERE bible_theme_to_citation_id = p_theme_to_citation_id
      AND bible_theme_to_citation_id > 0;
  END IF;

  IF v_theme_sibling_count > 1 THEN
    CALL normalize_citation_sequence(v_bible_theme_id);
  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `get_bible_theme_cascade`;

DELIMITER $$

CREATE PROCEDURE `get_bible_theme_cascade`(
  IN p_theme_id INT,
  OUT json_out JSON
)
BEGIN
  SET json_out = JSON_OBJECT(
    'themes', JSON_ARRAY(),
    'themeToCitations', JSON_ARRAY()
  );

  IF p_theme_id > 0 THEN

    SELECT JSON_OBJECT(
      'themes',
      COALESCE((
        WITH RECURSIVE theme_tree AS (
          SELECT
            bible_theme_id,
            name,
            remarks,
            0 AS depth
          FROM bible_themes
          WHERE bible_theme_id = p_theme_id

          UNION ALL

          SELECT
            child.bible_theme_id,
            child.name,
            child.remarks,
            parent.depth + 1 AS depth
          FROM bible_themes child
          JOIN theme_tree parent
            ON child.bible_theme_parent_id = parent.bible_theme_id
        )
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'themeId', bible_theme_id,
            'name', name,
            'remarks', remarks,
            'depth', depth
          )
        )
        FROM theme_tree
      ), JSON_ARRAY()),

      'themeToCitations',
      COALESCE((
        WITH RECURSIVE theme_tree AS (
          SELECT bible_theme_id
          FROM bible_themes
          WHERE bible_theme_id = p_theme_id

          UNION ALL

          SELECT child.bible_theme_id
          FROM bible_themes child
          JOIN theme_tree parent
            ON child.bible_theme_parent_id = parent.bible_theme_id
        )
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'themeId', btc.bible_theme_id,
            'themeToCitationId', btc.bible_theme_to_citation_id,
            'citationId', btc.bible_citation_id
          )
        )
        FROM bible_theme_to_citations btc
        JOIN theme_tree tt
          ON tt.bible_theme_id = btc.bible_theme_id
      ), JSON_ARRAY())
    )
    INTO json_out;

  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `normalize_citation_sequence`;

DELIMITER $$

CREATE PROCEDURE `normalize_citation_sequence`(
  IN p_theme_id INT
)
BEGIN
  UPDATE bible_theme_to_citations btc
  JOIN (
    SELECT
      bible_theme_to_citation_id,
      ROW_NUMBER() OVER (
        ORDER BY bible_theme_sequence, bible_theme_to_citation_id
      ) AS new_sequence
    FROM bible_theme_to_citations
    WHERE bible_theme_id = p_theme_id
  ) ordered
    ON ordered.bible_theme_to_citation_id = btc.bible_theme_to_citation_id
  SET
    btc.bible_theme_sequence = ordered.new_sequence,
    btc.updated_at = NOW()
  WHERE btc.bible_theme_id = p_theme_id
    AND btc.bible_theme_to_citation_id > 0
    AND btc.bible_theme_sequence <> ordered.new_sequence;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `normalize_theme_sequence`;

DELIMITER $$

CREATE PROCEDURE `normalize_theme_sequence`(
  IN p_theme_id INT
)
BEGIN
  UPDATE bible_themes bt
  JOIN (
    SELECT
      bible_theme_id,
      ROW_NUMBER() OVER (
        ORDER BY sequence, bible_theme_id
      ) AS new_sequence
    FROM bible_themes
    WHERE bible_theme_parent_id = p_theme_id
  ) ordered
    ON ordered.bible_theme_id = bt.bible_theme_id
  SET
    bt.sequence = ordered.new_sequence,
    bt.updated_at = NOW()
  WHERE bt.bible_theme_parent_id = p_theme_id
    AND bt.bible_theme_id > 0
    AND bt.sequence <> ordered.new_sequence;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `paste_bible_theme`;

DELIMITER $$

CREATE PROCEDURE `paste_bible_theme`(
    IN in_copy_theme_id INT,
    IN in_paste_parent_theme_id INT
)
BEGIN
    DECLARE v_copy_theme_count INT DEFAULT 0;
    DECLARE v_paste_parent_theme_count INT DEFAULT 0;
    DECLARE v_bad_paste_count INT DEFAULT 0;
    DECLARE v_paste_parent_name_match_count INT DEFAULT 0;
    DECLARE v_text VARCHAR(200);

    DECLARE v_done INT DEFAULT 0;

    DECLARE v_seq INT DEFAULT 0;
    DECLARE v_old_theme_id INT DEFAULT 0;
    DECLARE v_old_parent_theme_id INT DEFAULT 0;
    DECLARE v_new_parent_theme_id INT DEFAULT 0;
    DECLARE v_new_theme_id INT DEFAULT 0;

    DECLARE v_name VARCHAR(45) DEFAULT '';
    DECLARE v_description VARCHAR(200) DEFAULT '';
    DECLARE v_sequence INT DEFAULT 0;
    DECLARE v_depth INT DEFAULT 0;

    DECLARE v_next_root_sequence INT DEFAULT 1;

    DECLARE cur_theme_copy CURSOR FOR
        SELECT
            seq,
            old_theme_id,
            old_parent_theme_id,
            theme_name,
            theme_description,
            theme_sequence,
            depth
        FROM temp_theme_copy_map
        ORDER BY seq;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    DROP TEMPORARY TABLE IF EXISTS temp_theme_copy_map;
    DROP TEMPORARY TABLE IF EXISTS temp_theme_id_map;

    CREATE TEMPORARY TABLE temp_theme_copy_map (
        seq INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
        old_theme_id INT NOT NULL,
        old_parent_theme_id INT NULL,
        theme_name VARCHAR(45),
        theme_description VARCHAR(200),
        theme_sequence INT,
        depth INT
    );

    CREATE TEMPORARY TABLE temp_theme_id_map (
        old_theme_id INT NOT NULL PRIMARY KEY,
        new_theme_id INT NOT NULL
    );

    SELECT COUNT(*)
    INTO v_copy_theme_count
    FROM bible_themes
    WHERE bible_theme_id = in_copy_theme_id;

    SELECT COUNT(*)
    INTO v_paste_parent_theme_count
    FROM bible_themes
    WHERE bible_theme_id = in_paste_parent_theme_id;

    IF v_copy_theme_count <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Copy theme does not exist';
    END IF;

    IF v_paste_parent_theme_count <> 1 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Paste parent theme does not exist';
    END IF;

    SELECT name
    INTO v_name
    FROM bible_themes
    WHERE bible_theme_id = in_copy_theme_id;

    SELECT COUNT(*)
    INTO v_paste_parent_name_match_count
    FROM bible_themes
    WHERE bible_theme_parent_id = in_paste_parent_theme_id
      AND LOWER(name) = LOWER(v_name);

    IF v_paste_parent_name_match_count > 0 THEN
        SET v_text = CONCAT('Paste parent theme already has a theme named "', v_name, '"');

        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = v_text;
    END IF;

    WITH RECURSIVE theme_descendants AS (
        SELECT bible_theme_id
        FROM bible_themes
        WHERE bible_theme_id = in_copy_theme_id

        UNION ALL

        SELECT c.bible_theme_id
        FROM bible_themes c
        JOIN theme_descendants d
          ON c.bible_theme_parent_id = d.bible_theme_id
    )
    SELECT COUNT(*)
    INTO v_bad_paste_count
    FROM theme_descendants
    WHERE bible_theme_id = in_paste_parent_theme_id;

    IF v_bad_paste_count > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot paste a theme into its own descendant';
    END IF;

    SELECT COALESCE(MAX(sequence) + 1, 1)
    INTO v_next_root_sequence
    FROM bible_themes
    WHERE bible_theme_parent_id = in_paste_parent_theme_id;

    INSERT INTO temp_theme_copy_map (
        old_theme_id,
        old_parent_theme_id,
        theme_name,
        theme_description,
        theme_sequence,
        depth
    )
    WITH RECURSIVE theme_cascade (
	  old_theme_id,
	  old_parent_theme_id,
	  theme_name,
	  theme_description,
	  theme_sequence,
	  depth
	)
	AS (
        SELECT
            t.bible_theme_id,
            t.bible_theme_parent_id,
            t.name,
            t.description,
            v_next_root_sequence,
            0
        FROM bible_themes t
        WHERE t.bible_theme_id = in_copy_theme_id

        UNION ALL

        SELECT
            c.bible_theme_id,
            c.bible_theme_parent_id,
            c.name,
            c.description,
            c.sequence,
            p.depth + 1
        FROM bible_themes c
        JOIN theme_cascade p
          ON c.bible_theme_parent_id = p.old_theme_id
    )
    SELECT
        old_theme_id,
        old_parent_theme_id,
        theme_name,
        theme_description,
        theme_sequence,
        depth
    FROM theme_cascade
    ORDER BY depth, old_parent_theme_id, theme_sequence, old_theme_id;

    OPEN cur_theme_copy;

    read_loop: LOOP
        FETCH cur_theme_copy
        INTO
            v_seq,
            v_old_theme_id,
            v_old_parent_theme_id,
            v_name,
            v_description,
            v_sequence,
            v_depth;

        IF v_done = 1 THEN
            LEAVE read_loop;
        END IF;

        IF v_depth = 0 THEN
            SET v_new_parent_theme_id = in_paste_parent_theme_id;
        ELSE
            SELECT new_theme_id
            INTO v_new_parent_theme_id
            FROM temp_theme_id_map
            WHERE old_theme_id = v_old_parent_theme_id;
        END IF;

        INSERT INTO bible_themes (
            name,
            description,
            sequence,
            bible_theme_parent_id,
            remarks,
            created_at,
            updated_at
        )
        VALUES (
            v_name,
            v_description,
            v_sequence,
            v_new_parent_theme_id,
            'N',
            NOW(),
            NOW()
        );

        SET v_new_theme_id = LAST_INSERT_ID();

        INSERT INTO temp_theme_id_map (
            old_theme_id,
            new_theme_id
        )
        VALUES (
            v_old_theme_id,
            v_new_theme_id
        );

        INSERT INTO bible_theme_to_citations (
            bible_theme_id,
            bible_citation_id,
            bible_theme_sequence,
            created_at,
            updated_at
        )
        SELECT
            v_new_theme_id,
            btc.bible_citation_id,
            btc.bible_theme_sequence,
            NOW(),
            NOW()
        FROM bible_theme_to_citations btc
        WHERE btc.bible_theme_id = v_old_theme_id
        ORDER BY btc.bible_theme_sequence;
    END LOOP;

    CLOSE cur_theme_copy;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `paste_bible_theme_to_citation`;

DELIMITER $$

CREATE PROCEDURE `paste_bible_theme_to_citation`(
  IN p_theme_to_citation_id INT,
  IN p_theme_id INT
)
BEGIN
  DECLARE v_theme_to_citation_count INT DEFAULT 0;
  DECLARE v_theme_count INT DEFAULT 0;
  DECLARE v_citation_id INT DEFAULT 0;
  DECLARE v_existing_link_count INT DEFAULT 0;
  DECLARE v_theme_to_citation_sequence INT DEFAULT 1;

  SELECT COUNT(*)
  INTO v_theme_to_citation_count
  FROM bible_theme_to_citations
  WHERE bible_theme_to_citation_id = p_theme_to_citation_id;

  IF v_theme_to_citation_count <> 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Copy citation does not exist';
  END IF;

  SELECT COUNT(*)
  INTO v_theme_count
  FROM bible_themes
  WHERE bible_theme_id = p_theme_id;

  IF v_theme_count <> 1 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Paste parent theme does not exist';
  END IF;

  SELECT bible_citation_id
  INTO v_citation_id
  FROM bible_theme_to_citations
  WHERE bible_theme_to_citation_id = p_theme_to_citation_id;

  SELECT COUNT(*)
  INTO v_existing_link_count
  FROM bible_theme_to_citations
  WHERE bible_theme_id = p_theme_id
    AND bible_citation_id = v_citation_id;

  IF v_existing_link_count > 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Theme already contains this citation';
  END IF;

  SELECT COALESCE(MAX(bible_theme_sequence) + 1, 1)
  INTO v_theme_to_citation_sequence
  FROM bible_theme_to_citations
  WHERE bible_theme_id = p_theme_id;

  INSERT INTO bible_theme_to_citations (
    bible_theme_id,
    bible_citation_id,
    bible_theme_sequence,
    created_at,
    updated_at
  )
  VALUES (
    p_theme_id,
    v_citation_id,
    v_theme_to_citation_sequence,
    NOW(),
    NOW()
  );
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `reorder_citation_sequence`;

DELIMITER $$

CREATE PROCEDURE `reorder_citation_sequence`(
  IN p_obj_json JSON
)
BEGIN
  DECLARE v_parent_theme_id INT DEFAULT 0;
  DECLARE v_expected_count INT DEFAULT 0;
  DECLARE v_input_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_total INT DEFAULT 0;
  DECLARE v_theme_to_citation_id INT;

  SET v_parent_theme_id =
    CAST(JSON_UNQUOTE(JSON_EXTRACT(p_obj_json, '$.parentTheme')) AS UNSIGNED);

  SET v_total =
    JSON_LENGTH(JSON_EXTRACT(p_obj_json, '$.themeToCitations'));

  DROP TEMPORARY TABLE IF EXISTS temp_reorder_citations;

  CREATE TEMPORARY TABLE temp_reorder_citations (
    bible_theme_to_citation_id INT NOT NULL PRIMARY KEY,
    new_sequence INT NOT NULL
  );

  SELECT COUNT(*)
  INTO v_expected_count
  FROM bible_theme_to_citations
  WHERE bible_theme_id = v_parent_theme_id;

  WHILE v_index < v_total DO
    SET v_theme_to_citation_id =
      CAST(
        JSON_UNQUOTE(
          JSON_EXTRACT(p_obj_json, CONCAT('$.themeToCitations[', v_index, ']'))
        ) AS UNSIGNED
      );

    INSERT INTO temp_reorder_citations (
      bible_theme_to_citation_id,
      new_sequence
    )
    SELECT
      btc.bible_theme_to_citation_id,
      v_index + 1
    FROM bible_theme_to_citations btc
    WHERE btc.bible_theme_id = v_parent_theme_id
      AND btc.bible_theme_to_citation_id = v_theme_to_citation_id;

    SET v_index = v_index + 1;
  END WHILE;

  SELECT COUNT(*)
  INTO v_input_count
  FROM temp_reorder_citations;

  IF v_input_count <> v_expected_count THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'ERROR: reorder_citation_sequence - Unexpected input';
  ELSE
    UPDATE bible_theme_to_citations btc
    JOIN temp_reorder_citations r
      ON r.bible_theme_to_citation_id = btc.bible_theme_to_citation_id
    SET
      btc.bible_theme_sequence = r.new_sequence,
      btc.updated_at = NOW()
    WHERE btc.bible_theme_id = v_parent_theme_id
      AND btc.bible_theme_to_citation_id > 0
      AND btc.bible_theme_sequence <> r.new_sequence;
  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `reorder_theme_sequence`;

DELIMITER $$

CREATE PROCEDURE `reorder_theme_sequence`(
  IN p_obj_json JSON
)
BEGIN
  DECLARE v_parent_theme_id INT DEFAULT 0;
  DECLARE v_expected_count INT DEFAULT 0;
  DECLARE v_input_count INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_total INT DEFAULT 0;
  DECLARE v_theme_id INT;

  SET v_parent_theme_id =
    CAST(JSON_UNQUOTE(JSON_EXTRACT(p_obj_json, '$.parentTheme')) AS UNSIGNED);

  SET v_total =
    JSON_LENGTH(JSON_EXTRACT(p_obj_json, '$.themeIds'));

  DROP TEMPORARY TABLE IF EXISTS temp_reorder_themes;

  CREATE TEMPORARY TABLE temp_reorder_themes (
    bible_theme_id INT NOT NULL PRIMARY KEY,
    new_sequence INT NOT NULL
  );

  SELECT COUNT(*)
  INTO v_expected_count
  FROM bible_themes
  WHERE bible_theme_parent_id = v_parent_theme_id;

  WHILE v_index < v_total DO
    SET v_theme_id =
      CAST(
        JSON_UNQUOTE(
          JSON_EXTRACT(p_obj_json, CONCAT('$.themeIds[', v_index, ']'))
        ) AS UNSIGNED
      );

    INSERT INTO temp_reorder_themes (
      bible_theme_id,
      new_sequence
    )
    SELECT
      bt.bible_theme_id,
      v_index + 1
    FROM bible_themes bt
    WHERE bt.bible_theme_parent_id = v_parent_theme_id
      AND bt.bible_theme_id = v_theme_id;

    SET v_index = v_index + 1;
  END WHILE;

  SELECT COUNT(*)
  INTO v_input_count
  FROM temp_reorder_themes;

  IF v_input_count <> v_expected_count THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'ERROR: reorder_theme_sequence - Unexpected input';
  ELSE
    UPDATE bible_themes bt
    JOIN temp_reorder_themes r
      ON r.bible_theme_id = bt.bible_theme_id
    SET
      bt.sequence = r.new_sequence,
      bt.updated_at = NOW()
    WHERE bt.bible_theme_parent_id = v_parent_theme_id
      AND bt.bible_theme_id > 0
      AND bt.sequence <> r.new_sequence;
  END IF;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `set_theme_sequence`;

DELIMITER $$

CREATE PROCEDURE `set_theme_sequence`(
  IN p_theme_id INT,
  IN p_sequence INT
)
BEGIN
  UPDATE bible_themes
  SET
    sequence = p_sequence,
    updated_at = NOW()
  WHERE bible_theme_id = p_theme_id
    AND bible_theme_id > 0;
END$$

DELIMITER ;

DROP PROCEDURE IF EXISTS `set_theme_to_citation_sequence`;

DELIMITER $$

CREATE PROCEDURE `set_theme_to_citation_sequence`(
  IN p_theme_to_citation_id INT,
  IN p_sequence INT
)
BEGIN
  UPDATE bible_theme_to_citations
  SET
    bible_theme_sequence = p_sequence,
    updated_at = NOW()
  WHERE bible_theme_to_citation_id = p_theme_to_citation_id
    AND bible_theme_to_citation_id > 0;
END$$

DELIMITER ;