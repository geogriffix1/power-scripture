class PublisherModel {
    constructor(themeName, themeDescription, citationDescription, citations, themes) {
        this.themeName = themeName;
        this.themeDescription = themeDescription;
        this.citationDescription = citationDescription;
        this.citations = citations ? citations : [];
        this.themes = themes ? themes : [];
        this.publishedCitations = [];
        this.publishedThemes = [];

        this.verseModel = require("../models/bibleCitationVerse.model");
        this.themeModel = require("../models/bibleTheme.model");
    }

    publish = () => {
        var header = {};
        if (this.themeName) {
            header.themeName = this.themeName;
        }

        if (this.themeDescription) {
            header.themeDescription = this.themeDescription;
        }

        if (this.citationDescription) {
            header.citationDescription = this.citationDescription;
        }

        var prevBook = null;
        var prevChapter = null;
        var prevVerse = null;
        var prevEndVerse = null;
        var markupLabel = null;
        var markupText = null;
        var mkup = null;

        for (var i = 0; i < citations.length; i++) {
            if (i > 0) {
                if (prevEndVerse == prevVerse) {
                    this.publishedCitations.push({ label: markupLabel, text: markupText })
                }
                else {
                    this.publishedCitations.push({ label: `${markupLabel}-${prevEndVerse}`, text: markupText });
                }
            }

            var citation = citations[i];
            for (var j = 0; j < citation.verses.length; j++) {
                var verse = citation.verses[j];

                var citationVerse = new this.verseModel;
                citationVerse.values = verse;
                mkup = citationVerse.getMarkupText();
                
                if (j == 0) {
                    prevBook = verse.scripture.book;
                    prevChapter = verse.scripture.chapter;
                    prevVerse = verse.scripture.verse;
                    prevEndVerse = verse.scripture.verse;
                    markupLabel = mkup.label;
                    markupText = mkup.text.length > 1 ? mkup.text.substring(1) : "";
                }
                else if (
                    verse.scripture.book == prevBook &&
                    verse.scripture.chapter == prevChapter &&
                    verse.scripture.verse == prevEndVerse + 1) {
                        prevEndVerse = verse.scripture.verse;
                        markupText = `${markupText} ${mkup.text}`;
                }
                else {
                    if (prevEndVerse == prevVerse) {
                        this.publishedCitations.push({ label: markupLabel, text: markupText })
                    }
                    else {
                        this.publishedCitations.push({ label: `${markupLabel}-${prevEndVerse}`, text: markupText });
                    }

                    prevBook = verse.scripture.book;
                    prevChapter = verse.scripture.chapter;
                    prevVerse = verse.scripture.verse;
                    prevEndVerse = verse.scripture.verse;
                    markupLabel = mkup.label;
                    markupText = mkup.text.length > 1 ? mkup.text.substring(1) : "";
                }
            }

            if (citation.verses.length > 0) {
                if (prevEndVerse == prevVerse) {
                    this.publishedCitation.push({ label: markupLabel, text: markupText })
                }
                else {
                    this.publishedCitation.push({ label: `${markupLabel}-${prevEndVerse}`, text: markupText });
                }
            }
        }

        for (var i = 0; i < this.themes.length; i++) {
            var theme = new themeModel;
            theme.values = this.themes[i];

            var published = theme.publish();
            if (published.citations.length > 0 || published.themes.length > 0) {
                this.publishedTheme.push(published);
            }
        }        

        return {
            header: header,
            citations: this.publishedCitations,
            themes: this.publishedThemes
        };
    }
}