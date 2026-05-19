CREATE TABLE `bible_books` (
  `bible_book_id` INT NOT NULL AUTO_INCREMENT,
  `testament` VARCHAR(20) NOT NULL,
  `book` VARCHAR(32) NOT NULL,
  `chapter_count` INT NOT NULL,

  PRIMARY KEY (`bible_book_id`),
  
  UNIQUE KEY `uq_bible_books_book` (`book`)
)
ENGINE=InnoDB
AUTO_INCREMENT=1
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `bible_chapters` (
  `bible_chapter_id` INT NOT NULL AUTO_INCREMENT,
  `book` VARCHAR(32) NOT NULL,
  `chapter_number` INT NOT NULL,
  `verse_count` INT NOT NULL,

  PRIMARY KEY (`bible_chapter_id`),

  UNIQUE KEY `uq_bible_chapters_book_chapter`
    (`book`, `chapter_number`)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `bible_citation_markups` (
  `bible_citation_markup_id` INT NOT NULL AUTO_INCREMENT,
  `bible_citation_id` INT NOT NULL,
  `bible_citation_verse_id` INT NOT NULL,
  `start_index` INT NOT NULL,
  `end_index` INT NOT NULL,
  `kind` VARCHAR(10) NOT NULL,
  `replacement_text` VARCHAR(200) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`bible_citation_markup_id`)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4;

COLLATE=utf8mb4_0900_ai_ci;CREATE TABLE `bible_citation_verses` (
  `bible_citation_verse_id` INT NOT NULL AUTO_INCREMENT,
  `bible_citation_id` INT NOT NULL,
  `bible_scripture_niv_id` INT NOT NULL,
  `hide` CHAR(1) NOT NULL DEFAULT 'N',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`bible_citation_verse_id`),

  UNIQUE KEY `uq_bible_citation_verses_citation_scripture`
    (`bible_citation_id`, `bible_scripture_niv_id`)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `bible_citations` (
  `bible_citation_id` INT NOT NULL AUTO_INCREMENT,
  `description` VARCHAR(200) DEFAULT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`bible_citation_id`)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `bible_scriptures_niv` (
  `bible_scripture_niv_id` INT NOT NULL AUTO_INCREMENT,
  `book` VARCHAR(32) NOT NULL,
  `chapter_number` INT NOT NULL,
  `verse_number` INT NOT NULL,
  `text` VARCHAR(500) NOT NULL,
  `bible_order` INT NOT NULL,

  PRIMARY KEY (`bible_scripture_niv_id`),

  UNIQUE KEY `uq_bible_scriptures_niv_reference`
    (`book`, `chapter_number`, `verse_number`),

  UNIQUE KEY `uq_bible_scriptures_niv_bible_order`
    (`bible_order`)
)
ENGINE=InnoDB
AUTO_INCREMENT=10001
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `bible_theme_to_citations` (
  `bible_theme_to_citation_id` INT NOT NULL AUTO_INCREMENT,
  `bible_theme_id` INT NOT NULL,
  `bible_citation_id` INT NOT NULL,
  `bible_theme_sequence` INT NOT NULL,
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`bible_theme_to_citation_id`),

  UNIQUE KEY `uq_bible_theme_to_citations_theme_citation`
    (`bible_theme_id`, `bible_citation_id`)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE `bible_themes` (
  `bible_theme_id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(45) NOT NULL,
  `description` VARCHAR(200) DEFAULT NULL,
  `sequence` INT NOT NULL,
  `bible_theme_parent_id` INT DEFAULT NULL,
  `remarks` CHAR(1) NOT NULL DEFAULT 'N',
  `created_at` DATETIME NOT NULL,
  `updated_at` DATETIME NOT NULL,

  PRIMARY KEY (`bible_theme_id`),

  UNIQUE KEY `uq_bible_themes_parent_name`
    (`bible_theme_parent_id`, `name`)
)
ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_0900_ai_ci;