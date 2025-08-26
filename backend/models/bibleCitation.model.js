class BibleCitationModel {
    constructor() {
        const attr = require("./dbAttributes");
        this.table = new attr.tableAttribute("bible_citations", this);
        this.id = new attr.columnAttribute("bible_citation_id", "INT", true);
        this.citationLabel = { function: `get_citation_label(t1.bible_citation_id)` };
        this.description = new attr.columnAttribute("description", "VARCHAR(80)");
        this.bibleOrder = { function: `get_citation_bible_order(t1.bible_citation_id)` };
        this.createdAt = new attr.columnAttribute("created_at", "DATETIME");
        this.updatedAt = new attr.columnAttribute("updated_at", "DATETIME");
        this.themeToCitation = [];
        this.verses = [];
        this.table.getColumnAttributes(this);
    }

    get values() {
        return {
            id: this.id.value,
            citationLabel: this.citationLabel,
            description: this.description.value,
            bibleOrder: this.bibleOrder,
            createdAt: this.createdAt.value,
            updatedAt: this.updatedAt.value,
            themeToCitation: this.themeToCitation,
            verses: this.verses
        };
    }

    set values(value) {
        this.id.value = value.id ? value.id : null;
        this.citationLabel = { function: `get_citation_label(t1.bible_citation_id)` };
        this.description.value = value.description ? value.description : null;
        this.bibleOrder = { function: `get_citation_bible_order(t1.bible_citation_id)` };
        this.createdAt.value = value.createdAt ? value.createdAt : null;
        this.updatedAt.value = value.updatedAt ? value.updatedAt : null;
        this.themeToCitation = value.themeToCitation ? value.themeToCitation : [];
        this.verses = value.verses ? value.verses : [];
    }

    getSelectString = () => {
        const attr = require("./dbAttributes");
        return attr.tableAttribute.getSelectString(this.table.tableName, this);
    }

    getChildrenSelectString = () => {
        const attr = require("./dbAttributes");
        const verseTable = require("../models/bibleCitationVerse.model");
        const scriptureTable = require("../models/bibleScripture.model");
        const markupTable = require("../models/bibleCitationVerseMarkup.model");

        const verse = new verseTable;
        const scripture = new scriptureTable;
        const markup = new markupTable;
        verse.childLinks = [scripture, markup];

        return attr.tableAttribute.getJoinSelectString(this.table.tableName, this, [verse]);
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
}

module.exports = BibleCitationModel;
