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
            "Usage (e.g. /verse/2000) returns the citation verse whose id equates to 2000."
        ));
    }

    var bibleVerse = new bibleCitationVerse;
    bibleVerse.values = { id: id };

    var isFull = req.route.path == "/:id/full";

    if (isFull) {
        const selectString = bibleVerse.getJoinSelectString();
        dbAccess.query(selectString, (err, results) => {
            if (err) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    err.message,
                    ""
                ));
            }
            else {
                var verse = null;

                console.log(results);
                for (var i = 0; i < results.length; i++) {
                    var result = results[i];
                    if (verse === null) {
                        verse = tools.getObjectFromResult(result, 1);
                        var newScripture = tools.getObjectFromResult(result, 2);
                        verse.scripture = newScripture;
                        verse.markups = [];
                    }

                    var newMarkup = tools.getObjectFromResult(result, 3);
                    if (newMarkup && newMarkup.id) {
                        verse.markups.push(newMarkup);
                        verse.markups.sort((a, b) => { a.textIndex = b.textIndex });
                    }
                }

                res.send({ verse: verse });
            }
        });
    }
    else {
        dbAccess.query(bibleVerse.getSelectString(), (err, result) => {
            if (err) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    err.message,
                    "Usage (e.g. /verse/2000) returns the citation verse whose id equates to 2000."
                ));
            }
            else {
                res.send(result[0]);
            }
        });
    }
}

exports.listAll = (req, res) => {
    var bibleVerse = new bibleCitationVerse;
    dbAccess.query(bibleVerse.getJoinSelectString(), (err, results) => {
        if (err) {
            res.status(500).send(errorMessage(
                500,
                "Server Error",
                req.path,
                err.message,
                "Usage (e.g. /verse/2000) returns the citation verse whose id equates to 2000."
            ));
        }
        else {
            var verses = [];

            console.log(results);
            var citationVerse = null;
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                if (citationVerse === null || citationVerse.id != tools.getObjectFromResult(result, 1).id) {
                    if (citationVerse !== null) {
                        verses.push(citationVerse);
                    }

                    citationVerse = tools.getObjectFromResult(result, 1);
                    citationVerse.scripture = tools.getObjectFromResult(result, 2);
                    let markup = tools.getObjectFromResult(result, 3);
                    if (markup.id === null) {
                        citationVerse.markups = [];
                    }
                    else {
                        citationVerse.markups = [markup];
                    }
                }
                else {
                    citationVerse.markups.push(tools.getObjectFromResult(result, 3));
                }
            }

            if (citationVerse !== null) {
                verses.push(citationVerse);
            }

            res.send(verses);
        }
    });
}

exports.citationId = (req, res) => {
    var citationId = Number(req.params.id);
    if (!typeof id == NaN) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Query argument must be the numeric citation id of the verses",
            "Usage (e.g. /verse/citation/2000) returns all citation verses whose parent citation id equates to 2000."
        ));
    }

    var bibleVerse = new bibleCitationVerse;
    bibleVerse.values = { citationId: citationId };

    const selectString = bibleVerse.getJoinSelectString();
    dbAccess.query(selectString, (err, results) => {
        if (err) {
            res.status(500).send(errorMessage(
                500,
                "Server Error",
                req.path,
                err.message,
                ""
            ));
        }
        else {
            var verses = [];

            console.log(results);
            var citationVerse = null;
            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                if (citationVerse === null || citationVerse.id != tools.getObjectFromResult(result, 1).id) {
                    if (citationVerse !== null) {
                        verses.push(citationVerse);
                    }

                    citationVerse = tools.getObjectFromResult(result, 1);
                    citationVerse.scripture = tools.getObjectFromResult(result, 2);
                    let markup = tools.getObjectFromResult(result, 3);
                    if (markup.id === null) {
                        citationVerse.markups = [];
                    }
                    else {
                        citationVerse.markups = [markup];
                    }
                }
                else {
                    citationVerse.markups.push(tools.getObjectFromResult(result, 3));
                }
            }

            if (citationVerse !== null) {
                verses.push(citationVerse);
            }

            res.send(verses);
        }
    });
}

exports.create = (req, res) => {
    var obj = null;
    var methodType = null;
    var message = null;
    var citationId = null;
    var scriptureId = null;
    if (req.body) {
        obj = req.body;

        if (!(message) && eval(obj.citationId) && typeof obj.citationId == "number" && obj.citationId > 0) {
            citationId = eval(obj.citationId);
        }
        else {
            message = `Error: citationId is missing or invalid`;
        }

        if (!message && obj.scriptureId && typeof obj.scriptureId == "number" && obj.scriptureId > 0) {
            scriptureId = obj.scriptureId;
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
                `Usage: Object in the form: { "citationId": citationId, "scriptureId": scriptureId } must be supplied.`
            ));
        }
    }
    else {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            `Error: CitationVerse definition is missing from the message body.`,
            `Usage: Object in the form: { "citationId": citationId, "scriptureId": scriptureId } must be supplied.`
        ));
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

    createCitationVerse = (insertString) => {
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

    var context = { input: obj };
    tasks = [];

    tasks.push(addContext(context));

    var citation = new bibleCitation;
    citation.values = { id: citationId };
    tasks.push(getQuery(citation.getSelectString()));

    var scripture = new bibleScripture;
    scripture.values = { id: scriptureId };
    tasks.push(getQuery(scripture.getSelectString()));

    Promise.all(tasks)
        .then(data => {
            var context = data[0].context;
            var citation = data[1].length == 1 ? data[1][0] : null;
            var scripture = data[2].length == 1 ? data[2][0] : null;

            var message = "";
            if (!citation) {
                message = `Error: citationId: ${context.citationId} is not the id of a valid citation`;
            }

            if (!message && !scripture) {
                message = `Error: scriptureId: ${context.scriptureId} is not the id of a valid scripture`;
            }

            if (message) {
                res.status(400).send(errorMessage(
                    400,
                    "Invalid Parameter",
                    req.path,
                    message,
                    `Usage: Object in the form: { "citationId": citationId, "scriptureId": scriptureId } must be supplied.`
                ));

                return;
            }

            var citationVerse = new bibleCitationVerse;
            citationVerse.values = context.input;
            createCitationVerse(citationVerse.getInsertString())
                .then(result => {
                    var insertId = result.insertId;

                    if (insertId) {
                        var citationVerse = new bibleCitationVerse;
                        citationVerse.values = { id: insertId };

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
                    }
                })
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