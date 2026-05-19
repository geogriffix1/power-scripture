CREATE INDEX ix_bible_chapters_book
ON bible_chapters (`book`);

CREATE INDEX ix_bible_scriptures_niv_reference
ON bible_scriptures_niv (`book`, `chapter_number`, `verse_number`);

CREATE INDEX ix_bible_scriptures_niv_bible_order
ON bible_scriptures_niv (`bible_order`);

CREATE INDEX ix_bible_themes_parent_id
ON bible_themes (`bible_theme_parent_id`);

CREATE INDEX ix_bible_themes_parent_sequence
ON bible_themes (`bible_theme_parent_id`, `sequence`);

CREATE INDEX ix_bible_themes_name
ON bible_themes (`name`);

CREATE INDEX ix_bible_theme_to_citations_theme_id
ON bible_theme_to_citations (`bible_theme_id`);

CREATE INDEX ix_bible_theme_to_citations_citation_id
ON bible_theme_to_citations (`bible_citation_id`);

CREATE INDEX ix_bible_theme_to_citations_theme_sequence
ON bible_theme_to_citations (`bible_theme_id`, `bible_theme_sequence`);

CREATE INDEX ix_bible_citation_verses_citation_id
ON bible_citation_verses (`bible_citation_id`);

CREATE INDEX ix_bible_citation_verses_scripture_id
ON bible_citation_verses (`bible_scripture_niv_id`);

CREATE INDEX ix_bible_citation_markups_citation_id
ON bible_citation_markups (`bible_citation_id`);

CREATE INDEX ix_bible_citation_markups_verse_id
ON bible_citation_markups (`bible_citation_verse_id`);

CREATE INDEX ix_bible_citation_markups_kind
ON bible_citation_markups (`kind`);