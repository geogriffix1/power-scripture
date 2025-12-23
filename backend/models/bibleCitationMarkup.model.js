class BibleCitationMarkupModel {
    constructor() {
        const attr = require("./dbAttributes");
        this.table = new attr.tableAttribute("bible_citation_markups", this);
        this.id = new attr.columnAttribute("bible_citation_markup_id", "INT", true);
        this.citationVerseId = new attr.columnAttribute("bible_citation_verse_id", "INT", false, "bible_citation_verses");
        this.citationId = new attr.columnAttribute("bible_citation_id", "INT", false, "bible_citations");
        this.startIndex = new attr.columnAttribute("start_index", "INT")
        this.endIndex = new attr.columnAttribute("end_index", "INT");
        this.replacementText = new attr.columnAttribute("replacement_text", "VARCHAR(200)");
        this.kind = new attr.columnAttribute("kind", "VARCHAR(10)");
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
            startIndex: this.startIndex.value,
            endIndex: this.endIndex.value,
            replacementText: this.replacementText.value,
            kind: this.kind.value,
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
        this.startIndex.value = value.startIndex ? value.startIndex : null;
        this.endIndex.value = value.endIndex ? value.endIndex : null;
        this.replacementText.value = value.replacementText ? value.replacementText : null;
        this.kind = value.kind ? value.kind : null;
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