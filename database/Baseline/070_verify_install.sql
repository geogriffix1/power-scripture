SELECT count(*) INTO @count_books FROM bible_books;
SELECT count(*) INTO @count_chapters FROM bible_chapters;
SELECT count(*) INTO @count_scriptures FROM bible_scriptures_niv;
SELECT count(*) INTO @count_themes FROM bible_themes;
SELECT count(*) INTO @count_citations FROM bible_citations;
SELECT count(*) INTO @count_verses FROM bible_citation_verses;
SELECT count(*) INTO @count_markups FROM bible_citation_markups;
SELECT count(*) INTO @count_links FROM bible_theme_to_citations;

SELECT CONCAT(@count_books, ' = 66') 'Books', CONCAT(@count_chapters, ' = 1189') 'Chapters', CONCAT(@count_scriptures, ' = 31104') 'Scriptures',
CONCAT(@count_themes, ' = 101') 'Themes', CONCAT(@count_citations, ' = 0') 'Citations', CONCAT(@count_verses, ' = 0') 'Verses', CONCAT(@count_markups, ' = 0') Markups,
CONCAT(@count_links, ' = 0') 'Theme-to-Citation Links';
