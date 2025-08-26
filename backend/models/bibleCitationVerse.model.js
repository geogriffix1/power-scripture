class BibleCitationVerseModel {
    constructor() {
        const attr = require("./dbAttributes");
        this.table = new attr.tableAttribute("bible_citation_verses", this);
        this.id = new attr.columnAttribute("bible_citation_verse_id", "INT", true);
        this.citationId = new attr.columnAttribute("bible_citation_id", "INT", false, "bible_citations");
        this.scriptureId = new attr.columnAttribute("bible_scripture_niv_id", "INT", false, "bible_scriptures_niv");
        this.createdAt = new attr.columnAttribute("created_at", "DATETIME");
        this.updatedAt = new attr.columnAttribute("updated_at", "DATETIME");
        this.scripture = null;
        this.markups = [];
        this.table.getColumnAttributes(this);
    }

    get values() {
        return {
            id: this.id.value,
            citationId: this.citationId.value,
            scriptureId: this.scriptureId.value,
            createdAt: this.createdAt.value,
            updatedAt: this.updatedAt.value,
            scripture: this.scripture,
            markups: this.markups
        };
    }

    set values(value) {
        this.id.value = value.id ? value.id : null;
        this.citationId.value = value.citationId ? value.citationId : null;
        this.scriptureId.value = value.scriptureId ? value.scriptureId : null;
        this.createdAt.value = value.createdAt ? value.createdAt : null;
        this.updatedAt.value = value.updatedAt ? value.updatedAt : null;
        this.scripture = value.scripture ? value.scripture : null;
        this.markups = value.markups ? value.markups : [];
    }

    getSelectString = () => {
        const attr = require("./dbAttributes");
        return attr.tableAttribute.getSelectString(this.table.tableName, this);
    }

    getJoinSelectString = () => {
        const attr = require("./dbAttributes");
        const scriptureModel = require("./bibleScripture.model");
        const markupModel = require("./bibleCitationVerseMarkup.model");

        return attr.tableAttribute.getJoinSelectString(this.table.tableName, this, [new scriptureModel, new markupModel]);
    }
    getInsertString = () => {
        const attr = require("./dbAttributes");
        this.createdAt.value = new Date().toISOString();
        this.updatedAt.value = new Date().toISOString();
        return attr.tableAttribute.getInsertString(this);
    }

    getUpdateString = () => {
        const attr = require("./dbAttributes");
        this.updatedAt.value = new Date().toISOString();
        return attr.tableAttribute.getUpdateString(this);
    }

    getDeleteString = () => {
        const attr = require("./dbAttributes");
        return attr.tableAttribute.getDeleteString(this);
    }

    verseSuperscript = (verse) => {
        const superstring = "\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079";
        var verseString = "" + verse;
        var superscript = "";
        for (var i = 0; i < verseString.length; i++) {
            var char = verseString.substr(i, 1);
            superscript += superstring.substr(eval(char), 1);
        }

        return superscript;
    }

    getMarkupText = () => {
        var label = null;
        var text = null;
        if (this.scripture) {
            var book = this.scripture.book;
            var chapter = this.scripture.chapter;
            var verse = this.scripture.verse;
            var text = this.scripture.text;
            var markupText = this.verseSuperscript(verse);
            var isSingleChapterBook = book.match(/Obadiah|Philemon|2 John|3 John|Jude/);

            var prevIndex = 0;
            if (this.markups.length > 0) {
                this.markups = this.markups.sort((a, b) => a.textIndex - b.textIndex);

                for (var i = 0; i < this.markups.length; i++) {
                    var markup = this.markups[i];
                    if (markup.textIndex > prevIndex) {
                        markupText += text.substr(prevIndex, markup.textIndex - prevIndex);
                    }

                    markupText += `[${markup.markupText}]`;
                    prevIndex = markup.textIndex + markup.textLength;
                }

                if (prevIndex < text.length) {
                    markupText += text.substring(prevIndex);
                }
            }
            else {
                markupText += text;
            }

            var label = `${book} ${chapter}:${verse}`;
            if (isSingleChapterBook) {
                label = `${book} ${verse}`;
            }

            return { label: label, markupText: markupText };
        }
    }
}

module.exports = BibleCitationVerseModel;