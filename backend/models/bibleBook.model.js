class BibleBookModel {
    constructor() {
        const attr = require("./dbAttributes");
        this.table = new attr.tableAttribute("bible_books", this);
        this.id = new attr.columnAttribute("bible_book_id", "INT", true);
        this.testament = new attr.columnAttribute("testament", "VARCHAR(20)");
        this.book = new attr.columnAttribute("book", "VARCHAR(32)");
        this.chapterCount = new attr.columnAttribute("chapter_count", "INT");

        this.table.getColumnAttributes(this);
    }

    get values() {
        return {
            id: idColumn.value,
            testament: testamentColumn.value,
            book: bookColumn.value,
            chapterCount: chapterCountColumn.value
        };
    }

    set values(value) {
        this.idColumn.value = value.id ? value.id : null;
        this.testamentColumn.value = value.testament ? value.testament : null;
        this.bookColumn.value = value.book ? value.book : null;
        this.chapterCountColumn = value.chapterCount ? value.chapterCount : null;
    }

    getSelectString = () => {
        const attr = require("./dbAttributes");
        return attr.tableAttribute.getSelectString(this.table.tableName, this);
    }
}

module.exports = BibleBookModel;
