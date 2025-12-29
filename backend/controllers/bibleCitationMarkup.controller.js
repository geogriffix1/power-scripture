const bibleCitationMarkup = require("../models/bibleCitationMarkup.model");
const bibleCitationVerse = require("../models/bibleCitationVerse.model");
const bibleCitation = require("../models/bibleCitation.model");
const bibleScripture = require("../models/bibleScripture.model");
const dbAccess = require("../db/db.access");
const responseTools = require("./helpers/responseTools");
const tools = new responseTools;
const errorMessage = require("./helpers/errorMessage");

const pagination = 200;
exports.listOne = (req, res) => {
    var id = eval(req.params.id);
    if (!typeof id == "number") {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Query argument must be the numeric citation verse id",
            "Usage (e.g. /markups/2000) returns the citation verse markup whose id equates to 2000."
        ));
    }

    var bibleVerseMarkup = new bibleCitationMarkup;
    bibleVerseMarkup.values = { id: id };
    dbAccess.query(bibleVerseMarkup.getSelectString(), (err, result) => {
        if (err) {
            res.status(500).send(errorMessage(
                500,
                "Server Error",
                req.path,
                err.message,
                "Usage (e.g. /markups/2000) returns the citation verse markup whose id equates to 2000."
            ));
        }
        else {
            res.send(result[0]);
        }
    });
}

exports.listAll = (req, res) => {
    var citationVerseMarkup = new bibleCitationMarkup;
    dbAccess.query(citationVerseMarkup.getJoinSelectString(), (err, results) => {
        if (err) {
            res.status(500).send(errorMessage(
                500,
                "Server Error",
                req.path,
                err.message,
                "Usage (e.g. /markups/2000) returns the citation verse markup whose id equates to 2000."
            ));
        }
        else {
            var citationVerseMarkups = [];

            console.log(results);
            var citationVerseMarkup = null;
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                if (citationVerseMarkup === null) {
                    citationVerseMarkup = tools.getObjectFromResult(result, 1);
                }

                citationVerseMarkup.citation = tools.getObjectFromResult(result, 2);
                citationVerseMarkup.verse = tools.getObjectFromResult(result, 3);
                citationVerseMarkup.scripture = tools.getObjectFromResult(result, 4);

                citationVerseMarkups.push(citationVerseMarkup);
                citationVerseMarkup = null;
            }

            res.send(citationVerseMarkups);
        }
    });
}

exports.create = (req, res) => {
    var obj = null;
    var message = null;
    var citationVerseId = null;
    var startIndex = null;
    var endIndex = null;
    var kind = null;
    var replacementText = null;
    if (req.body) {
        obj = req.body;

        if (!message) {
            if (obj.citationVerseId && typeof obj.citationVerseId == "number" && obj.citationVerseId > 0) {
                citationVerseId = eval(obj.citationVerseId);
            }
            else {
                message = `Error: citationVerseId is missing or invalid`;
            }
        }

        if (!message) {
            if (typeof obj.startIndex == "number" && obj.startIndex >= 0) {
                startIndex = obj.startIndex;
            }
            else {
                message = `Error: startIndex is missing or invalid`;
            }
        }

        if (!message) {
            if (typeof obj.endIndex == "number" && obj.endIndex >= 0) {
                endIndex = obj.endIndex;
            }
            else {
                message = `Error: endIndex is missing or invalid`;
            }
        }

        if (!message) {
            if (typeof obj.kind != "string" || (typeof obj.kind == "string" && /highlight|suppress|paragraph|replace/.test(obj.kind.toLowerCase()))) {
                kind = obj.kind.toLowerCase();
            }
            else {
                message = `Error: kind is missing or invalid (highlight, suppress, paragraph, or replace)`;
            }
        }

        if (!message && obj.kind.toLowerCase() == "replace") {
            if (obj.replacementText) {
                replacementText = obj.replacementText;
            }
            else {
                message = `Error: replacementText is required when kind = "replace"`;
            }
        }

        if (message) {
            res.status(400).send(errorMessage(
                400,
                "Invalid Parameter",
                req.path,
                message,
                `Usage: Object in the form: { "citationVerseId": 3, "kind": "highlight", "startText": 5, "endText": 12, "replacementText": "optional" } must be supplied.`
            ));

            return;
        }
    }
    else {
        res.status(400).send(errorMessage(
            400,
            "citation_verse_markup object is missing from the package body",
            req.path,
            `Error: CitationVerseMarkup definition is missing from the message body.`,
            `Usage: Object in the form: { "citationId": 2, "citationVerseId": 3, "kind": "highlight", "startText": 5, "endText": 12, "replacementText": "optional" } must be supplied.`
        ));

        return;
    }

    addContext = (context) => {
        return new Promise(resolve => {
            resolve({ context: context });
        });
    }

    getQuery = (selectString) => {
        return new Promise((resolve, reject) => {
            dbAccess.query(selectString, (err, results) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(results);
                }
            });
        });
    }

    createCitationVerseMarkup = (insertString) => {
        return new Promise((resolve, reject) => {
            dbAccess.insert(insertString, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    getCitationVerseFromTemplate = (citationVerseTemplate) => {
        var citationVerse = null;
        for (var i = 0; i < citationVerseTemplate.length; i++) {
            var result = citationVerseTemplate[0];
            if (citationVerse === null) {
                citationVerse = tools.getObjectFromResult(result, 1);
                citationVerse.citation = tools.getObjectFromResult(result, 2);
                citationVerse.scripture = tools.getObjectFromResult(result, 3);
                citationVerse.markups = [];
            }

            var markup = tools.getObjectFromResult(result, 4);
            if (markup.id) {
                citationVerse.markups.push(markup);
            }
        }

        if (citationVerse.markups.length > 1) {
            citationVerse.markups = citationVerse.markups.slice().sort((a, b) => {
                if (a.startIndex !== b.startIndex) return a.startIndex - b.startIndex;
                if (a.kind === "paragraph" && b.kind !== "paragraph") return -1;
                if (b.kind === "paragraph" && a.kind !== "paragraph") return 1;
                return 0;
            });
        }

        return citationVerse;
    }

    if (endIndex < startIndex) {
        let start = endIndex;
        endIndex = startIndex;
        startIndex = start;
    }

    var context = {
        citationVerseId: citationVerseId,
        startIndex: startIndex,
        endIndex: endIndex,
        kind: kind,
        replacementText: replacementText
    };

    tasks = [];

    tasks.push(addContext(context));

    var citationVerse = new bibleCitationVerse;
    citationVerse.values = { id: citationVerseId };

    tasks.push(getQuery(citationVerse.getJoinSelectString()));

    Promise.all(tasks)
        .then(data => {
            var context = data[0].context;
            var citationVerseTemplate = data[1].length > 0 ? data[1] : null;

            if (citationVerseTemplate == null) {
                res.status(400).send(errorMessage(
                    400,
                    "Invalid Parameter",
                    req.path,
                    `Error: CitationVerse with id: ${context.citationVerseId} not found`,
                    `Usage: Object in the form: { "citationVerseId": citationVerseId, "textIndex": 5, "textLength": 22, "markupText": "hello!" } must be supplied.`
                ));

                return;
            }

            context.citationId = citationVerseTemplate.citationId;
            var citationVerse = getCitationVerseFromTemplate(citationVerseTemplate);
            var isError = false;
            for (var i = 0; i < citationVerse.markups.length; i++) {
                var existingMarkup = citationVerse.markups[i];

                var rangeLow = existingMarkup.startText;
                var rangeHigh = rangeLow + existingMarkup.endText;

                // overlap low end not allowed
                if (context.kind != "paragraph" && context.startIndex <= rangeLow && context.endIndex >= rangeLow) {
                    isError = true;
                    break;
                }

                // overlap high end not allowed
                if (context.kind != "paragraph" && context.startIndex <= rangeHigh && context.endIndex >= rangeHigh) {
                    isError = true;
                    break;
                }

                // overlap within a range not allowed
                if (context.kind != "paragraph" && context.startIndex >= rangeLow && context.endIndex <= rangeHigh) {
                    isError = true;
                    break;
                }

                // paragraphs are allowed at the start index but not within a range or on the last character of the range
                if (context.kind == "paragraph" && context.startIndex > rangeLow && context.endIndex <= rangeHigh) {
                    isError = true;
                    break;
                }
            }

            if (isError) {
                res.status(400).send(errorMessage(
                    400,
                    "Invalid Parameter",
                    req.path,
                    `Error: The markup definition overlaps an existing markup definition for the textIndex, textLength range of the original verse. This is not allowed.`,
                    `Usage: Object in the form: { "citationVerseId": citationVerseId, "startIndex": 5, "endIndex": 22, "replacementText": "optional" } must be supplied.`
                ));

                return;
            }

            context.citationVerse = citationVerse;

            tasks = [];

            tasks.push(addContext(context));

            var markup = new bibleCitationMarkup;
            markup.values = {
                citationVerseId: context.citationVerse.id,
                citationId: context.citationVerse.citationId,
                startIndex: context.startIndex,
                endIndex: context.endIndex,
                kind: context.kind,
                replacementText: context.replacementText ?? ""
            };

            tasks.push(createCitationVerseMarkup(markup.getInsertString()));

            Promise.all(tasks)
                .then(data => {
                    var context = data[0].context;
                    var insertId = data[1].insertId;

                    context.citationVerseMarkupId = insertId;

                    tasks = [];

                    tasks.push(addContext(context));

                    var markup = new bibleCitationMarkup;
                    markup.values = { id: context.citationVerseMarkupId };

                    tasks.push(getQuery(markup.getSelectString()));

                    Promise.all(tasks)
                        .then(data => {
                            var context = data[0].context;
                            var result = data[1].length == 1 ? data[1][0] : null;

                            if (result == null) {
                                res.status(500).send(errorMessage(
                                    500,
                                    "Server Error",
                                    req.path,
                                    `Error: Attempt create markup failed.`,
                                    `Usage: Object in the form: { "citationVerseId": citationVerseId, "startIndex": 5, "endIndex": 22, kind="highlight", "replacementText": "optional" } must be supplied.`
                                ));

                                return;
                            }

                            res.send({ created: result });
                        });
                });
        })
        .catch(err => {
            res.status(500).send(errorMessage(
                500,
                "Server Error",
                req.path,
                err.message,
                ""
            ));
        });
}

exports.delete = (req, res) => {
    var id = Number(req.params.id);
    if (id === NaN) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Delete argument must be the numeric citation markup id",
            "Usage (e.g. /2000) deletes the markup whose id equates to 2000 from its citation."
        ));

        return;
    }

    addContext = (context) => {
        return new Promise(resolve => {
            resolve({ context: context });
        });
    }

    getQuery = (selectString) => {
        return new Promise((resolve, reject) => {
            dbAccess.query(selectString, (err, results) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(results);
                }
            });
        });
    }

    deleteCitationMarkup = (deleteString) => {
        return new Promise((resolve, reject) => {
            dbAccess.delete(deleteString, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    var context = { idToDelete: id };
    tasks = [];

    tasks.push(addContext(context));

    var citationMarkup = new bibleCitationMarkup;
    citationMarkup.values = { id: context.idToDelete };

    tasks.push(deleteCitationMarkup(citationMarkup.getDeleteString()));
    Promise.all(tasks)
        .then(data => {
            var context = data[0].context;
            var deleteResults = data[1];

            res.send({ deleted: deleteResults });
        })
}


exports.deleteByVerseId = (req, res) => {
    var verseId = Number(req.params.verseId);
    if (verseId === NaN) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Delete argument must be the numeric verseId of the verse containing the markups",
            "Usage (e.g. /verse/2000) deletes the markups whose parent verse id equates to 2000 from its citation."
        ));

        return;
    }

    addContext = (context) => {
        return new Promise(resolve => {
            resolve({ context: context });
        });
    }

    getQuery = (selectString) => {
        return new Promise((resolve, reject) => {
            dbAccess.query(selectString, (err, results) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(results);
                }
            });
        });
    }

    deleteCitationMarkup = (deleteString) => {
        return new Promise((resolve, reject) => {
            dbAccess.delete(deleteString, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    var context = { idOfParentVerse: verseId };
    tasks = [];

    tasks.push(addContext(context));

    var citationMarkup = new bibleCitationMarkup;
    citationMarkup.values = { citationVerseId: context.idOfParentVerse };
    const queryString = citationMarkup.getSelectString();
    tasks.push(getQuery(queryString));
    Promise.all(tasks)
        .then(data => {
            var context = data[0].context;
            var markups = data[1];
            var citationMarkup = new bibleCitationMarkup;

            tasks = [];
            markups.forEach(markup => {
                citationMarkup.values = { id: markup.id };
                const deleteString = citationMarkup.getDeleteString();
                tasks.push(deleteCitationMarkup(deleteString));
            });

            Promise.all(tasks)
                .then(data => {
                    res.send({ deleted: data.length });
                });
        });

}

