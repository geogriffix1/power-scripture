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

    var bibleVerseMarkup = new BibleCitationMarkup;
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
    var citationVerseMarkup = new BibleCitationMarkup;
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
    var textIndex = null;
    var textLength = null;
    var markupText = null;
    if (req.body) {
        obj = req.body;

        if (!(message)) {
            if (obj.citationVerseId && typeof obj.citationVerseId == "number" && obj.citationVerseId > 0) {
                citationVerseId = eval(obj.citationVerseId);
            }
            else {
                message = `Error: citationVerseId is missing or invalid`;
            }
        }

        if (!message) {
            if (typeof obj.textIndex == "number" && obj.textIndex >= 0) {
                textIndex = obj.textIndex;
            }
            else {
                message = `Error: textIndex is missing or invalid`;
            }
        }

        if (!message) {
            if (typeof obj.textLength == "number" && obj.textLength >= 0) {
                textLength = obj.textLength;
            }
            else {
                message = `Error: textLength is missing or invalid`;
            }
        }

        if (!message) {
            if (obj.markupText && typeof obj.markupText == "string") {
                markupText = obj.markupText;
            }
            else {
                message = `Error: markupText is missing or invalid`;
            }
        }

        if (message) {
            res.status(400).send(errorMessage(
                400,
                "Invalid Parameter",
                req.path,
                message,
                `Usage: Object in the form: { "citationVerseId": citationVerseId, "textIndex": 5, "textLength": 22, "markupText": "hello!" } must be supplied.`
            ));

            return;
        }
    }
    else {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            `Error: CitationVerseMarkup definition is missing from the message body.`,
            `Usage: Object in the form: { "citationVerseId": citationVerseId, "textIndex": 5, "textLength": 22, "markupText": "hello!" } must be supplied.`
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
            citationVerse.markups.sort((a, b) => { a.textIndex - b.textIndex });
        }

        return citationVerse;
    }

    var context = {
        citationVerseId: citationVerseId,
        textIndex: textIndex,
        textLength: textLength,
        markupText: markupText
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

            var citationVerse = getCitationVerseFromTemplate(citationVerseTemplate);
            var isError = false;
            for (var i = 0; i < citationVerse.markups.length; i++) {
                var existingMarkup = citationVerse.markups[i];

                var rangeLow = existingMarkup.textIndex;
                var rangeHigh = rangeLow + existingMarkup.textLength - 1;

                if (context.textIndex <= rangeLow && context.textIndex + context.textLength - 1 >= rangeLow) {
                    isError = true;
                    break;
                }

                if (context.textIndex <= rangeHigh && context.textIndex + context.textLength - 1 >= rangeHigh) {
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
                    `Usage: Object in the form: { "citationVerseId": citationVerseId, "textIndex": 5, "textLength": 22, "markupText": "hello!" } must be supplied.`
                ));

                return;
            }

            context.citationVerse = citationVerse;

            tasks = [];

            tasks.push(addContext(context));

            var markup = new BibleCitationMarkup;
            markup.values = {
                citationVerseId: context.citationVerse.id,
                citationId: context.citationVerse.citationId,
                textIndex: context.textIndex,
                textLength: context.textLength,
                markupText: context.markupText
            };

            tasks.push(createCitationVerseMarkup(markup.getInsertString()));

            Promise.all(tasks)
                .then(data => {
                    var context = data[0].context;
                    var insertId = data[1].insertId;

                    context.citationVerseMarkupId = insertId;

                    tasks = [];

                    tasks.push(addContext(context));

                    var markup = new BibleCitationMarkup;
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
                                    `Usage: Object in the form: { "citationVerseId": citationVerseId, "textIndex": 5, "textLength": 22, "markupText": "hello!" } must be supplied.`
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

exports.edit = (req, res) => {
    var obj = null;
    var message = null;

    var citationVerseId = null;
    var citationId = null;
    var scriptureId = null;

    if (req.body) {
        obj = req.body;
        if (!message && obj.id && typeof eval(obj.id) == "number" && eval(obj.id) > 0) {
            citationVerseId = eval(obj.id);
        }
        else {
            message = `Error: id is missing or invalid`;
        }

        if (!message && eval(obj.citationId) && typeof obj.citationId == "number" && obj.citationId > 0) {
            citationId = eval(obj.citationId);
        }
        else {
            message = `Error: citationId is missing or invalid`;
        }

        if (!message && obj.scriptureId && typeof obj.scriptureId == "number" && obj.scriptureId > 0) {
            scriptureId = eval(obj.scriptureId);
        }
        else {
            message = `Error: scriptureId is missing or invalid`;
        }

        if (message) {
            res.status(400).send(errorMessage(
                400,
                "Invalid Parameter",
                req.path,
                message,
                `Usage: Object in the form: { "id: citationVerseId, "citationId": citationId, "scriptureId": scriptureId } must be supplied.`
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

        updateCitationVerse = (updateString) => {
            return new Promise((resolve, reject) => {
                dbAccess.delete(updateString, (err, result) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(result);
                    }
                });
            });
        }

        context = {};
        context.citationVerseId = citationVerseId;
        context.citationId = citationId;
        context.scriptureId = scriptureId;

        tasks = [];

        tasks.push(addContext(context));

        var citationVerse = new bibleCitationVerse;
        citationVerse.values = { id: context.citationVerseId };

        tasks.push(getQuery(citationVerse.getSelectString()));

        var citation = new bibleCitation;
        citation.values = { id: context.citationId };

        tasks.push(getQuery(citation.getSelectString()));

        var scripture = new bibleScripture;
        scripture.values = { id: context.scriptureId };

        tasks.push(getQuery(citation.getSelectString()));

        Promise.all(tasks)
            .then(data => {
                var context = data[0].context;
                var originalCitationVerse = data[1].length == 1 ? data[1][0] : null;
                var citation = data[2].length == 1 ? data[2][0] : null;
                var scripture = data[3].length == 1 ? data[3][0] : null;

                var message = "";
                if (!originalCitationVerse) {
                    message = `Error: CitationVerse id: ${context.citationVerseId} not found`;
                }

                if (!message && !citation) {
                    message = `Error: Citation id: ${context.citationId} not found`;
                }

                if (!message && !scripture) {
                    message = `Error: Scripture id: ${context.scriptureId} not found`;
                }

                if (message) {
                    res.status(400).send(errorMessage(
                        400,
                        "Invalid Parameter",
                        req.path,
                        message,
                        `Usage: Object in the form: { "id: citationVerseId, "citationId": citationId, "scriptureId": scriptureId } must be supplied.`
                    ));

                    return;
                }

                var tasks = [];

                tasks.push(addContext(context));

                var citationVerse = new bibleCitationVerse;
                citationVerse.values = {
                    id: context.citationVerseId,
                    citationId: context.citationId,
                    scriptureId: context.scriptureId
                };

                tasks.push(updateCitationVerse(citationVerse.getUpdateString()));

                Promise.all(tasks)
                    .then(data => {
                        var context = data[0].context;
                        var result = data[1];

                        var citationVerse = new bibleCitationVerse;
                        citationVerse.values = { id: context.citationVerseId };
                        getQuery(citationVerse.getJoinSelectString())
                            .then(results => {

                                var citationVerse = null;
                                var result = results[0];
                                if (citationVerse === null) {
                                    citationVerse = tools.getObjectFromResult(result, 1);
                                }

                                citationVerse.citation = tools.getObjectFromResult(result, 2);
                                citationVerse.scripture = tools.getObjectFromResult(result, 3);

                                res.send({ created: citationVerse });
                            });
                    })
            });
    }
    else {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            `Error: CitationVerse definition is missing from the message body.`,
            `Usage: Object in the form: { "id": citationVerseId, "citationId": citationId, "scriptureId": scriptureId } must be supplied.`
        ));
    }
}

exports.delete = (req, res) => {
    var id = eval(req.params.id);
    if (!typeof id == "number") {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Delete argument must be the numeric citation Verse id",
            "Usage (e.g. /verse/2000) deletes the verse whose id equates to 2000 from its citation."
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

    deleteCitationVerse = (deleteString) => {
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

    var citationVerse = new bibleCitationVerse;
    citationVerse.values = { id: context.idToDelete };

    tasks.push(getQuery(citationVerse.getSelectString()));
    Promise.all(tasks)
        .then(data => {
            var context = data[0].context;
            var citationVerseValues = data[1].length == 1 ? data[1][0] : null;

            if (!citationVerseValues) {
                res.status(400).send(new errorMessage(
                    400,
                    "Not Found",
                    req.path,
                    `CitationVerse: ${context.idToDelete} was not found.`,
                    "No action was taken"
                ));

                return;
            }

            context.citationVerseValues = citationVerseValues;

            tasks = []

            tasks.push(addContext(context));

            var citationVerse = new bibleCitationVerse;
            citationVerse.values = { id: context.idToDelete };

            tasks.push(deleteCitationVerse(citationVerse.getDeleteString()));

            Promise.all(tasks)
                .then(data => {
                    var context = data[0].context;
                    var deleteResults = data[1];

                    res.send({ deleted: context.citationVerseValues });
                })
        });
}