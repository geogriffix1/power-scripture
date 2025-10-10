const bibleCitation = require("../models/bibleCitation.model");
const bibleThemeToCitation = require("../models/bibleThemeToCitation.model");
const bibleCitationVerse = require("../models/bibleCitationVerse.model");
const bibleScripture = require("../models/bibleScripture.model");
const dbAccess = require("../db/db.access");
const errorMessage = require("./helpers/errorMessage");
const responseTools = require("./helpers/responseTools");
const tools = new responseTools;

const pagination = 200;
exports.listOne = (req, res) => {
    var query = eval(req.params.id);
    if (typeof query !== "number") {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Query argument must be the numeric citation id",
            "Usage (e.g. /citation/2000) returns the citation whose id equates to 2000.",
            ""
        ));
    }

    const citation = new bibleCitation;
    citation.values = { id: query };
    var isFull = req.route.path == "/:id/full";

    if (isFull) {
        const selectString = citation.getChildrenSelectString();
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
                var citation = null;

                console.log(results);
                for (var i = 0; i < results.length; i++) {
                    var result = results[i];
                    if (citation === null) {
                        citation = tools.getObjectFromResult(result, 1);
                        citation.verses = [];
                    }

                    var newVerse = tools.getObjectFromResult(result, 2);
                    if (newVerse) {
                        var activeVerse = citation.verses.find(v => v.id == newVerse.id);

                        if (!activeVerse && newVerse.id) {
                            activeVerse = newVerse;
                            var newScripture = tools.getObjectFromResult(result, 3);
                            if (newScripture) {
                                activeVerse.scripture = newScripture;
                            }

                            activeVerse.markups = [];
                            citation.verses.push(activeVerse);
                        }

                        var newMarkup = tools.getObjectFromResult(result, 4);
                        if (newMarkup && newMarkup.id) {
                            activeVerse.markups.push(newMarkup);
                            activeVerse.markups.sort((a, b) => { a.textIndex = b.textIndex });
                        }
                    }

                    citation.verses.sort((a, b) => {
                        a.scripture.bibleOrder - b.scripture.bibleOrder
                    });
                }

                res.send({ citation: citation });
            }
        });
    }
    else {
        const selectString = citation.getSelectString();
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
                res.send(results[0]);
            }
        });
    }
};

exports.listAll = (req, res) => {
    const params = req.query;
    var input = "/citations/";
    if (params && Object.keys(params) > 0) {
        input += "?";
        var comma = "";
        for (var index in params) {
            input += `${comma}${params[index]}`;
            comma = ",";
        }
    }

    var page = 1;
    if (params && params.page) {
        page = params.page;
    }

    var offset = (page - 1) * pagination;
    var limit = pagination + 1;

    const citation = new bibleCitation;
    var selectString = citation.getSelectString();
    selectString += ` ORDER BY bibleOrder LIMIT ${offset}, ${limit}`;
    console.log(selectString);

    dbAccess.query(selectString, (err, results) => {
        if (err) {
            res.status(500).send(errorMessage(
                500,
                "Server Error",
                input,
                err.message,
                ""
            ));
        }
        else {
            var output = results;
            if (page > 1 || results.length === limit) {
                results.splice(pagination, 1);
                var output = {
                    page: page,
                    citations: results
                };
            }
            else if (page > 1) {
                var output = {
                    page: page,
                    citations: results
                }
            }

            res.send(output);
        }
    });
}

exports.create = (req, res) => {
    var obj = null;
    var methodType = null;
    var message = null;
    var themeId = null;
    var scriptureIds = [];
    var scriptures = [];
    var foundVerse = null;
    if (req.body) {
        try {
            obj = req.body;
            if (obj.themeId && typeof Number(obj.themeId) == "number" && obj.themeId > 0) {
                themeId = Number(obj.themeId);
                var allThemeIds = Object.keys(global.themePaths).map(key => eval(key));
                if (!allThemeIds.includes(themeId)) {
                    message = `Error: themeId:${themeId} is not the id of a valid theme`;
                }

                obj.description = (obj.description ?? "").padEnd(80).substring(0, 80).trim();

                if (!message && obj.scriptureIds && Array.isArray(obj.scriptureIds)) {
                    methodType = "scripture ids";
                    obj.scriptureIds.forEach(scriptureId => {
                        id = Number(scriptureId);
                        if (id === NaN) {
                            message = `Error: scriptureIds is an array of numeric values: ${id} is not a number.`
                            return;
                        }

                        scriptureIds.push(id);
                    });
                }
                else if (!message && obj.scriptures && Array.isArray(obj.scriptures)) {
                    obj.scriptures.forEach(scripture => {
                        var id;
                        if (scripture.id) {
                            id = Number(scripture.id);
                            if (id !== NaN && id > 0) {
                                scriptureIds.push(id);
                                methodType = "scripture ids"
                            }
                        }
                        else {
                            methodType = null;
                            return;
                        }
                    });

                    if (!methodType) {
                        methodType = "scriptures";
                        for (var scripture in obj.scriptures) {
                            console.log("scripture:");
                            console.log(scripture);
                            foundVerse = null;
                            for (var idx in global.verseValidation) {
                                var validBook = global.verseValidation[idx];
                                if (validBook.book.toLowerCase() == scripture.book.toLowerCase()) {
                                    console.log(`book found: ${scripture.book}`);
                                    console.log(JSON.stringify(validBook.chapters));
                                    for (var ix in validBook.chapters) {
                                        var validChapter = validBook.chapters[ix];
                                        if (scripture.chapter && validChapter.chapter == scripture.chapter) {
                                            console.log(`chapter found: ${validChapter}`);
                                            if (scripture.verse > 0 && scripture.verse <= validChapter.lastVerse) {
                                                foundVerse = { book: validBook.book, chapter: scripture.chapter, verse: scripture.verse };
                                                break;
                                            }
                                        }
                                        else if (!scripture.chapter && validBook.chapters.length == 1 && scripture.verse > 0 && scripture.verse <= validChapter.lastVerse) {
                                            foundVerse = { book: validBook.book, chapter: 1, verse: scripture.verse };
                                            break;
                                        }
                                    }
                                }

                                if (foundVerse) break;
                            }

                            if (foundVerse) {
                                scriptures.push(foundVerse);
                            }
                            else {
                                message = `Error: invalid scripture: { book: "${scripture.book}", chapter: ${scripture.chapter}, verse: ${scripture.verse} }`;
                                break;
                            }
                        }
                    }
                }
                else if (!message) {
                    message = "Error: Neither \"scriptureIds\" nor \"scriptures\" arrays are present in the input JSON object.";
                }
            }
            else if (!message) {
                message = "Error: property \"themeId\" is missing or invalid.";
            }
        }
        catch(e) {
            message = `Error: JSON parsing error: ${e.message}`;
        }
    }
    else if (!message) {
        message = "Error: Request body is missing";
    }

    if (message) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            `/citation  (${req.body})`,
            message,
            ""
        ));
    }

    var citation = new bibleCitation;
    citation.values = obj;
    var newCitation = null;
    var newThemeToCitation = null;
    var newCitationVerse = null;

    getQuery = (query) => {
        return new Promise((resolve, reject) => {
            dbAccess.query(query, (err, result) => {
                if (err) { return reject(err); }
                return resolve(result);
            });
        });
    }

    createCitation = citation => {
        console.log("in biblecitation.controller createCitation");
        return new Promise((resolve, reject) => {
            var error;
            var coreCitation = citation;
            var insertString = citation.getInsertString();
            console.log(insertString);
            dbAccess.insert(insertString, (err, result) => {
                if (err) {
                    console.log("biblecitation.controller createCitation insert error");
                    error = err;
                    console.log("rejecting");
                    return reject(error);
                }
                else {
                    coreCitation.id.value = result.insertId;
                    return resolve({ citation: coreCitation.values });
                }
            });
        });
    }

    createThemeToCitation = (themeToCitation) => {
        return new Promise((resolve, reject) => {
            var coreThemeToCitation = themeToCitation;
            var insertString = themeToCitation.getInsertString();
            console.log(insertString);
            dbAccess.insert(insertString, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    coreThemeToCitation.id.value = result.insertId;
                    resolve({ themeToCitation: coreThemeToCitation.values });
                }
            });
        });
    }

    createCitationVerse = (citationVerse) => {
        var coreCitationVerse = citationVerse;
        var insertString = citationVerse.getInsertString();
        console.log(insertString);
        return new Promise((resolve, reject) => {
            dbAccess.insert(insertString, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    coreCitationVerse.id.value = result.insertId;
                    resolve({ citationVerse: coreCitationVerse.values });
                }
            })
        });
    }

    getScriptureVerse = scriptureId => {
        return new Promise((resolve, reject) => {
            var scripture = new bibleScripture;
            scripture.values = { id: scriptureId };
            var selectString = scripture.getSelectString();
            dbAccess.query(selectString, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    scripture.values = result[0];
                    resolve({ scripture: scripture.values });
                }
            });
        });
    }

    getFunctionValue = (columnName, func) => {
        return new Promise((resolve, reject) => {
            var query = `SELECT ${func}`;
            dbAccess.query(query, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    var res = result[0];
                    var key = Object.keys(res)[0];
                    resolve({ columnName: columnName, value: res[key] });
                }
            });
        });
    }

    addContext = context => {
        return new Promise(resolve => {
            resolve({ context: context });
        });
    }

    context = {};
    context.themeId = themeId;

    var tasks = [];

    tasks.push(addContext(context));

    tasks.push(getQuery(`SELECT get_next_citation_sequence_from_parent_theme(${themeId}) AS nextSequence`));

    if (methodType == "scriptures") {
        for (var index in scriptures) {
            scr = new bibleScripture;
            scr.values = scriptures[index];
            var selectString = scr.getSelectString();
            console.log(selectString);

            tasks.push(getQuery(selectString));
        }
    }

    Promise.all(tasks)
        .then(data => {
            console.log("scriptures selection completed.");

            var context = data[0].context;

            var nextSequence = data[1][0].nextSequence;
            for (var index in data) {
                if (index > 1) {
                    var result = data[index];
                    scriptureIds.push(result.id);
                }
            }

            tasks = [];
            context.scriptureIds = scriptureIds;

            tasks.push(addContext(context));

            tasks.push(createCitation(citation));

            Promise.all(tasks)
                .then(data => {
                    var context = data[0].context;
                    var citation = data[1].citation;

                    context.citation = citation;

                    var tasks = [];
                    tasks.push(addContext(context));

                    console.log(`Citation ${citation.id} created. Attaching scriptures`);
                    var themeToCitation = new bibleThemeToCitation;
                    themeToCitation.themeId.value = context.themeId;
                    themeToCitation.citationId.value = context.citation.id;
                    themeToCitation.sequence.value = nextSequence;

                    tasks.push(createThemeToCitation(themeToCitation));

                    var citationVerse = new bibleCitationVerse;
                    for (var i = 0; i < scriptureIds.length; i++) {
                        citationVerse.citationId.value = citation.id;
                        citationVerse.scriptureId.value = scriptureIds[i];

                        tasks.push(createCitationVerse(citationVerse));
                    }

                    for (var i = 0; i < scriptureIds.length; i++) {
                        tasks.push(getScriptureVerse(scriptureIds[i]));
                    }

                    console.log("waiting for themeToCitation and multiple verse completions");
                    Promise.all(tasks)
                        .then(data => {
                            var context = data[0].context;
                            var themeToCitation = data[1].themeToCitation;
                            var scriptures = [];
                            var citationVerses = [];
                            var markups = [];

                            for (var i = 2; i < data.length; i++) {
                                var result = data[i];

                                if (result.scripture) {
                                    scriptures.push(result.scripture);
                                }
                                else if (result.citationVerse) {
                                    citationVerses.push(result.citationVerse);
                                }
                            }

                            for (var i = 0; i < citationVerses.length; i++) {
                                citationVerses[i].scripture = scriptures.find(s => s.id == citationVerses[i].scriptureId);
                            }

                            context.themeToCitation = themeToCitation;
                            context.citationVerses = citationVerses;

                            tasks = [];

                            tasks.push(addContext(context));

                            var citation = new bibleCitation;
                            citation.values = context.citation;

                            tasks.push(getQuery(citation.getSelectString()));

                            Promise.all(tasks)
                                .then(data => {
                                    var context = data[0].context;
                                    var citation = data[1][0];

                                    citation.themeToCitation = context.themeToCitation;
                                    citation.verses = context.citationVerses;

                                    res.send({ created: citation });
                                });
                        });
                });
        })
        .catch(err => {
            var stringObj = JSON.stringify(obj);
            res.status(500).send(errorMessage(
                500,
                "System Error",
                `/citation/create  (${stringObj})`,
                err.message,
                "Error while attempting to insert new citation in database"
            ));
        });

    console.log("After createCitation completion");
}

exports.update = (req, res) => {
    var obj = null;
    var message = null;

    if (req.body) {
        try {
            obj = req.body;
            var citation = new bibleCitation;
            citation.values = obj;
            if (!obj.id || typeof obj.id != "number") {
                message = "Error: property \"id\" is missing or invalid.";
            }
        }
        catch (e) {
            message = `Error: JSON parsing error: ${e.message}`;
        }
    }
    else if (!message) {
        message = "Error: Request body is missing";
    }

    if (message) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            `/citation (${req.body})`,
            message,
            ""
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

    verifyCitation = (obj) => {
        return new Promise((resolve, reject) => {
            console.log("in the verifyCitation Promise");
            var error;
            var citation = new bibleCitation;
            citation.id.value = obj.id;
            var selectString = citation.getSelectString();
            console.log(selectString);
            dbAccess.query(selectString, (err, result) => {
                if (err) {
                    console.log("biblecitation.controller updateCitation citation does not exist");
                    error = err;
                    console.log("rejecting");
                    reject(error);
                }
                else {
                    console.log("query successful");
                    citation = new bibleCitation;
                    citation.values = result[0];
                    resolve(citation);
                }
            });
        });
    };

    updateCitation = (updateString) => {
        console.log("in biblecitation.controller updateCitation");
        return new Promise((resolve, reject) => {
            var error;
            dbAccess.update(updateString, (err, result) => {
                if (err) {
                    error = err;
                    console.log("Error updating");
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
        });
    }

    var context = { values: obj };
    tasks = [];

    tasks.push(addContext(context));

    tasks.push(verifyCitation(obj))

    Promise.all(tasks)
        .then(data => {
            var context = data[0].context;
            var cit = data[1];

            console.log("Citation verified");
            console.log(cit.values);
            context.originalCitation = cit;

            var tasks = [];

            tasks.push(addContext(context));

            var citation = new bibleCitation;
            citation.values = context.values;
            tasks.push(updateCitation(citation.getUpdateString()));

            Promise.all(tasks)
                .then(data => {
                    var context = data[0].context;

                    var citation = new bibleCitation;
                    citation.values = { id: context.values.id };
                    getQuery(citation.getSelectString())
                        .then(results => {
                            var result = results[0];
                            console.log("returning results");
                            console.log(result);
                            res.send(result);
                        });
                });
        })
        .catch(err => {
            var stringObj = JSON.stringify(obj);
            res.status(500).send(errorMessage(
                500,
                "System Error",
                `/citation/create  (${stringObj})`,
                err.message,
                "Error while attempting to update a citation in database"
            ));
        });
}

