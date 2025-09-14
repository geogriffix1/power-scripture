class BibleCitationMarkupModel {
    constructor() {
        const attr = require("./dbAttributes");
        this.table = new attr.tableAttribute("bible_citation_markups", this);
        this.id = new attr.columnAttribute("bible_citation_markup_id", "INT", true);
        this.citationVerseId = new attr.columnAttribute("bible_citation_verse_id", "INT", false, "bible_citation_verses");
        this.citationId = new attr.columnAttribute("bible_citation_id", "INT", false, "bible_citations");
        this.textIndex = new attr.columnAttribute("text_index", "INT");
        this.textLength = new attr.columnAttribute("text_length", "INT", false, "text_length");
        this.markupText = new attr.columnAttribute("markup_text", "VARCHAR(80)")
        this.createdAt = new attr.columnAttribute("created_at", "DATETIME");
        this.updatedAt = new attr.columnAttribute("updated_at", "DATETIME");
        this.citation = null;
        this.verse = null;
        this.table.getColumnAttributes(this);
    }

    get values() {
        return {
            id: this.id.value,
            citationVerseId: this.citationVerseId.value,
            citationId: this.citationId.value,
            textIndex: this.textIndex.value,
            textLength: this.textLength.value,
            markupText: this.markupText.value,
            createdAt: this.createdAt.value,
            updatedAt: this.updatedAt.value,
            citation: this.citation,
            verse: this.verse
        };
    }

    set values(value) {
        this.id.value = value.id ? value.id : null;
        this.citationVerseId.value = value.citationVerseId ? value.citationVerseId : null,
        this.citationId.value = value.citationId ? value.citationId : null;
        this.textIndex.value = value.textIndex || value.textIndex === 0 ? value.textIndex : null;
        this.textLength.value = value.textLength || value.textLength === 0 ? value.textLength : null;
        this.markupText.value = value.markupText ? value.markupText : null;
        this.createdAt.value = value.createdAt ? value.createdAt : null;
        this.updatedAt.value = value.updatedAt ? value.updatedAt : null;
        this.citation = value.citation ? value.citation : null;
        this.verse = value.verse ? value.verse : null;
    }

    getSelectString = () => {
        const attr = require("./dbAttributes");
        return attr.tableAttribute.getSelectString(this.table.tableName, this);
    }

    getJoinSelectString = () => {
        const attr = require("./dbAttributes");
        const citationModel = require("./bibleCitation.model");
        const citationVerseModel = require("./bibleCitationVerse.model");
        const scriptureModel = require("./bibleScripture.model");
        const markupModel = require("./bibleCitationMarkup.model");

        const citation = new citationModel;
        const verse = new citationVerseModel;
        const scripture = new scriptureModel;
        const markup = new markupModel;
        verse.childLinks = [ scripture, markup ];

        return attr.tableAttribute.getJoinSelectString(this.table.tableName, this, [citation, verse]);
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
}

module.exports = BibleCitationMarkupModel;