class PublisherModel {
    constructor(themeName, themeDescription, citations, themes) {
        this.themeName = themeName;
        this.themeDescription = themeDescription;
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

        var prevBook = null;
        var prevChapter = null;
        var prevVerse = null;
        var prevEndVerse = null;
        var markupLabel = null;
        var markupText = null;
        var mkup = null;

        for (var i = 0; i < this.citations.length; i++) {
            if (i > 0) {
                if (prevEndVerse == prevVerse) {
                    this.publishedCitations.push({ label: markupLabel, text: markupText })
                }
                else {
                    this.publishedCitations.push({ label: `${markupLabel}-${prevEndVerse}`, text: markupText });
                }
            }

            var citation = this.citations[i];
            if (!citation) {
                console.log(`citation is null - theme: ${header.themeName} citation[${i}]`);
            }

            if (citation.verses && citation.verses.length > 0) {

                if (citation.description) {
                    header.citationDescription = citation.description;
                }

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
                        var verseNumberString = "" + verse.scripture.verse;
                        markupLabel = mkup.label;
                        markupText = (mkup.markupText && mkup.markupText.length > verseNumberString.length) ? mkup.markupText.substring(verseNumberString.length) : "";
                    }
                    else if (
                        verse.scripture.book == prevBook &&
                        verse.scripture.chapter == prevChapter &&
                        verse.scripture.verse == prevEndVerse + 1) {
                        prevEndVerse = verse.scripture.verse;
                        markupText = `${markupText} ${mkup.markupText}`;
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
                        var verseNumberString = "" + verse.scripture.verse;
                        markupLabel = mkup.label;
                        markupText = (mkup.markupText && mkup.markupText.length > verseNumberString.length) ? mkup.markupText.substring(verseNumberString.length) : "";
                    }
                }

                if (prevEndVerse == prevVerse) {
                    this.publishedCitations.push({ label: markupLabel, text: markupText })
                }
                else {
                    this.publishedCitations.push({ label: `${markupLabel}-${prevEndVerse}`, text: markupText });
                }
            }
        }

        for (var i = 0; i < this.themes.length; i++) {
            //var theme = new this.themeModel;
            var themeValues = this.themes[i];
            var publisher = new PublisherModel(
                themeValues.name,
                themeValues.description,
                themeValues.citations,
                themeValues.themes
            );

            var publishedTheme = publisher.publish();    
            this.publishedThemes.push(publishedTheme);
        }

        return {
            header: header,
            citations: this.publishedCitations,
            themes: this.publishedThemes
        };
    }
}

module.exports = PublisherModel;