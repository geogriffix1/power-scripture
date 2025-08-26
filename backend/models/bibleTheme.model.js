class BibleThemeModel {
    constructor() {
        const attr = require("../models/dbAttributes");
        this.table = new attr.tableAttribute("bible_themes", this);
        this.id = new attr.columnAttribute("bible_theme_id", "INT", true);
        this.name = new attr.columnAttribute("name", "VARCHAR(45)");
        this.description = new attr.columnAttribute("description", "VARCHAR(100)");
        this.sequence = new attr.columnAttribute("sequence", "INT");
        this.path = null;
        this.parent = new attr.columnAttribute("bible_theme_parent_id", "INT", false, "bible_themes");
        this.createdAt = new attr.columnAttribute("created_at", "DATETIME");
        this.updatedAt = new attr.columnAttribute("updated_at", "DATETIME");
        this.childCount = { function: `get_bible_theme_child_count(t1.bible_theme_id)` };
        this.themes = [];
        this.themeToCitationLinks = [];
        this.table.getColumnAttributes(this);
    }

    get values() {
        return {
            id: this.id.value,
            name: this.name.value,
            description: this.description.value,
            sequence: this.sequence.value,
            path: this.path,
            parent: this.parent.value,
            createdAt: this.createdAt.value,
            updatedAt: this.updatedAt.value,
            childCount: this.childCount,
            themes: this.themes,
            themeToCitationLinks: this.themeToCitationLinks
        };
    }

    set values(value) {
        this.id.value = value.id || value.id === 0 ? value.id : null;
        this.name.value = value.name ? value.name : null;
        this.description.value = value.description ? value.description : null;
        this.sequence.value = value.sequence ? value.sequence : null;
        this.path = value.path ? value.path : null;
        this.parent.value = value.parent || value.parent === 0 ? value.parent : null;
        this.createdAt.value = value.createdAt ? value.createdAt : null;
        this.updatedAt.value = value.updatedAt ? value.updatedAt : null;
        this.childCount = { function: `get_bible_theme_child_count(t1.bible_theme_id)` };
        this.themes = value.themes ? value.themes : [];
        this.themeToCitationLinks = value.themeToCitationLinks ? value.themeToCitationLinks : [];
        this.citations = value.citations ? value.citations : [];
    }

    getSelectString = () => {
        const attr = require("../models/dbAttributes");
        return attr.tableAttribute.getSelectString(this.table.tableName, this);
    }

    getChildrenSelectString = () => {
        const attr = require("../models/dbAttributes");
        const bibleThemeToCitation = require("../models/bibleThemeToCitation.model");
        const bibleCitation = require("../models/bibleCitation.model");

        const childTheme = new BibleThemeModel;
        const childThemeToCitation = new bibleThemeToCitation;
        const childCitation = new bibleCitation;

        childThemeToCitation.childLinks = [];
        childThemeToCitation.childLinks.push(childCitation);

        this.parent.foreignTable = null;
        return attr.tableAttribute.getJoinSelectString(this.table.tableName, this, [childTheme, childThemeToCitation]);
    }

    getThemesSelectString = () => {
        const attr = require("../models.dbAttributes");
        const newTheme = new BibleThemeModel;
        newTheme.values = { parent: this.id };
        return attr.tableAttribute.getSelectString(newTheme.table.tableName, newTheme) + ` ORDER BY ${newTheme.sequence.columnName}`;
    }

    getCitationReferencesSelectString = () => {
        const attr = require("../models.dbAttributes");
        const link = new BibleThemeToCitation;
        link.values = { bibleThemeId: this.id };
        return attr.tableAttribute.getSelectString(link.table.tableName, link) + ` ORDER BY ${link.sequence.columnName}`;
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

module.exports = BibleThemeModel;
