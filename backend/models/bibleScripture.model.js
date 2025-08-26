class BibleScriptureModel {
    constructor() {
        const attr = require("../models/dbAttributes");
        this.table = new attr.tableAttribute("bible_scriptures_niv", this);
        this.id = new attr.columnAttribute("bible_scripture_niv_id", "INT", true);
        this.book = new attr.columnAttribute("book", "VARCHAR(32)");
        this.chapter = new attr.columnAttribute("chapter_number", "INT");
        this.verse = new attr.columnAttribute("verse_number", "INT");
        this.text = new attr.columnAttribute("text", "VARCHAR(500)")
        this.bibleOrder = new attr.columnAttribute("bible_order", "INT");

        this.table.getColumnAttributes(this);
    }

    get values() {
        return {
            id: this.id.value ? this.id.value : null,
            book: this.book.value ? this.book.value : null,
            chapter: this.chapter.value ? this.chapter.value : null,
            verse: this.verse.value ? this.verse.value : null,
            text: this.text.value ? this.text.value : null,
            bibleOrder: this.bibleOrder.value ? this.bibleOrder.value : null
        };
    }

    set values(value) {
        this.id.value = value.id ? value.id : null;
        this.book.value = value.book ? value.book : null;
        this.chapter.value = value.chapter ? value.chapter : null;
        this.verse.value = value.verse ? value.verse : null;
        this.text.value = value.text ? value.text : null;
        this.bibleOrder.value = value.bibleOrder ? value.bibleOrder : null;
    }

    getSelectString = () => {
        const attr = require("../models/dbAttributes");
        return attr.tableAttribute.getSelectString(this.table.tableName, this);
    }
}

module.exports = BibleScriptureModel;
