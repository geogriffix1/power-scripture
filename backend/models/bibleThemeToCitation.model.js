/// <reference path="bibleCitationVerse.model.js" />
class BibleThemeToCitationModel {
    constructor() {
        const attr = require("./dbAttributes");
        this.table = new attr.tableAttribute("bible_theme_to_citations", this);
        this.id = new attr.columnAttribute("bible_theme_to_citation_id", "INT", true);
        this.themeId = new attr.columnAttribute("bible_theme_id", "INT", false, "bible_themes");
        this.citationId = new attr.columnAttribute("bible_citation_id", "INT", false, "bible_citations");
        this.sequence = new attr.columnAttribute("bible_theme_sequence", "INT");
        this.path = null;
        this.createdAt = new attr.columnAttribute("created_at", "DATETIME");
        this.updatedAt = new attr.columnAttribute("updated_at", "DATETIME");
        this.theme = null;
        this.citation = null;
        this.table.getColumnAttributes(this);
    }

    get values() {
        return {
            id: this.id.value,
            themeId: this.themeId.value,
            citationId: this.citationId.value,
            sequence: this.sequence.value,
            createdAt: this.createdAt.value,
            updatedAt: this.updatedAt.value,
            path: this.path,
            theme: this.theme,
            citation: this.citation
        };
    }

    set values(value) {
        this.id.value = value.id ? value.id : null;
        this.themeId.value = value.themeId ? value.themeId : null;
        this.citationId.value = value.citationId ? value.citationId : null;
        this.sequence.value = value.sequence ? value.sequence : null;
        this.path = value.path ? value.path : null;
        this.createdAt.value = value.createdAd ? value.createdAt : null;
        this.updatedAt.value = value.updatedAt ? value.updatedAt : null;
        this.theme = value.theme ? this.theme : null;
        this.citation = value.citation ? value.citation : null;
    }

    getSelectString = () => {
        const attr = require("./dbAttributes");
        return attr.tableAttribute.getSelectString(this.table.tableName, this);
    }

    getJoinSelectString = () => {
        const attr = require("./dbAttributes");
        const themeModel = require("./bibleTheme.model");
        const citationModel = require("./bibleCitation.model");
        return attr.tableAttribute.getJoinSelectString(this.table.tableName, this, [new themeModel, new citationModel]);
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

module.exports = BibleThemeToCitationModel;
