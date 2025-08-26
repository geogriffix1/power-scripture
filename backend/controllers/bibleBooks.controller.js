const bibleBooks = require("../models/bibleBook.model");
const errorMessage = require("./helpers/errorMessage");
const dbAccess = require("../db/db.access");
exports.create = (req, res) => {
    if (!req.body.book) {
        res.status(400).send({
            message: "Content cannot be empty!"
        });

        return;
    }
}

exports.findAll = (req, res) => {
    const book = new bibleBooks();
    var query = book.getSelectString();

    dbAccess.query(query, (err, result) => {
        if (err) {
            res.send(errorMessage(
                500,
                "Server Error",
                "/biblebooks/" + query,
                err.message,
                ""
            ));
        }
        else if (result) {
            res.send(result);
        }
    });
}

exports.findOne = (req, res) => {
    const bookId = req.params.id;
    const book = new bibleBooks();
    book.id.value = eval(bookId);
    var query = book.getSelectString();
    dbAccess.query(query, (err, result) => {
        if (err) {
            res.send(errorMessage(
                500,
                "Server Error",
                "/biblebooks/" + bookId,
                err.message,
                ""
            ));
        }
        else if (result) {
            res.send(result);
        }
    });
}
