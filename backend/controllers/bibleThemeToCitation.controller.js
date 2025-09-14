const bibleThemeToCitation = require("../models/bibleThemeToCitation.model");
const bibleTheme = require("../models/bibleTheme.model");
const bibleCitation = require("../models/bibleCitation.model");
const dbAccess = require("../db/db.access");
const errorMessage = require("./helpers/errorMessage");
const responseTools = require("./helpers/responseTools");
const tools = new responseTools;

const pagination = 200;
exports.listOne = (req, res) => {
    const themeToCitation = new bibleThemeToCitation;
    if (req.params.id) {
        var query = eval(req.params.id);
        if (typeof query !== "number") {
            res.status(400).send(errorMessage(
                400,
                "Invalid Parameter",
                req.path,
                "Query argument must be the numeric theme to citation id",
                "Usage (e.g. /themeToCitation/2000) returns the theme to citation element whose id equates to 2000.",
                ""
            ));
        }
        else {
            themeToCitation.values = { id: query };
        }
    }
    else if (req.params.themeId && req.params.citationId) {
        var query1 = eval(req.params.themeId);
        var query2 = eval(req.params.citationId);
        if (typeof query1 !== "number" || typeof query2 !== "number") {
            res.status(400).send(errorMessage(
                400,
                "Invalid Parameter",
                req.path,
                "Query theme and citation argurment must both be numeric",
                "Usage (e.g. /themeToCitation/theme/2000/citation/1000) returns the theme to citation element whose theme id equates to 2000 and whose  citation id equates to 1000.",
                ""
            ));
        }
        else {
            themeToCitation.values = { themeId: query1, citationId: query2 };
        }
    }

    var isFull = req.route.path.endsWith("full");
    if (isFull) {
        const selectString = themeToCitation.getJoinSelectString();
        console.log(selectString);
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
                var themeToCitation = null;

                console.log(results[0]);
                var result = results[0];
                if (result) {
                    themeToCitation = tools.getObjectFromResult(result, 1);
                    themeToCitation.theme = tools.getObjectFromResult(result, 2);
                    themeToCitation.theme.path = global.themePaths[themeToCitation.theme.id].path;
                    themeToCitation.citation = tools.getObjectFromResult(result, 3);
                    if (themeToCitation.citation.description === null) {
                        themeToCitation.citation.description = "";
                    }
                }

                if (themeToCitation === null) {
                    console.log("NULL THEME TO CITATION");
                }

                res.send({ themeToCitation: themeToCitation });
            }
        });
    }
    else {
        const selectString = themeToCitation.getSelectString() + " limit 1";
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
    const params = req.params;
    var input = "/themeToCitations/";
    if (params && Object.keys(params) > 0) {
        input += "?";
        var comma = "";
        for (var index in params) {
            input += `${comma}${params[index]}`;
            comma = ",";
        }
    }

    var citationId = req.params.citationId;
    var themeId = req.params.themeId;
    var page = 1;
    if (params && params.page) {
        page = params.page;
    }

    if (params && params.themeId) {
        themeId = params.themeId;
    }

    if (params && params.citationId) {
        citationId = params.citationId;
    }

    var offset = (page - 1) * pagination;
    var limit = pagination + 1;

    const themeToCitation = new bibleThemeToCitation;
    if (themeId) {
        themeToCitation.themeId.value = themeId;
    }

    if (citationId) {
        themeToCitation.citationId.value = citationId;
    }

    var selectString = themeToCitation.getSelectString();
    
    selectString += ` ORDER BY themeId, sequence LIMIT ${offset}, ${limit}`;
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
    var themePath = null;
    var citationId = null;

    confirmCitation = (themeId, citationId, sequence) => {
        return new Promise((resolve, reject) => {
            var citation = new bibleCitation;
            citation.values = { id: citationId };
            var selectString = citation.getSelectString(selectString);
            dbAccess.query(selectString, (err, response) => {
                if (err) { return reject({ message: `Error: citationId: ${id} does not exist.` }); }
                return resolve({ themeId: themeId, citationId: citationId, sequence: sequence });
            });
        });
    }

    confirmSequence = (themeId, citationId, sequence) => {
        return new Promise((resolve, reject) => {
            console.log(themeId, citationId, sequence);
            var themeToCitation = new bibleThemeToCitation;
            themeToCitation.values = { themeId: themeId };
            var selectString = themeToCitation.getSelectString();
            selectString = `${selectString} ORDER BY sequence`;
            dbAccess.query(selectString, (err, results) => {
                if (err) { return reject(err) }
                return resolve({ themeId: themeId, citationId: citationId, sequence: sequence, existing: results });
            });
        });
    }

    createThemeToCitation = (insertObject, indexIssue, existingThemeToCitations) => {
        return new Promise((resolve, reject) => {
            var error;
            var themeToCitation;
            dbAccess.insert(insertObject, (err, result) => {
                if (err) {
                    error = err;
                    reject(error);
                }
                else {
                    themeToCitation = new bibleThemeToCitation;
                    var values = tools.getObjectFromResult(result);
                    themeToCitation.setFromInsertObjectValues(values);
                    resolve({ themeToCitation: themeToCitation.values, indexIssue: indexIssue, existingThemeToCitations: existingThemeToCitations });
                }
            });
        });
    }

    updateThemeToCitation = (updateObject) => {
        return new Promise((resolve, reject) => {
            dbAccess.update(updateObject, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    console.log("resolving updateThemeToCitation");
                    console.log(result[0]);
                    resolve();
                }
            });
        });
    }

    if (req.body) {
        try {
            obj = req.body;
            if (obj.themeId && typeof eval(obj.themeId) == "number" && eval(obj.themeId) > 0) {
                themeId = eval(obj.themeId);
                if (global.themePaths[themeId]) {
                    themePath = global.themePaths[themeId].path;
                }
                else {
                    message = `Error: themeId: ${themeId} does not exist`;
                }

                if (!message && obj.citationId && typeof eval(obj.citationId) == "number" && eval(obj.citationId) > 0) {
                    citationId = eval(obj.citationId);
                }
                else {
                    message = `Error: citationId was not supplied or is not a positive number`;
                }
            }
            else if (req.body) {
                message = `Error: themeId was not supplied or is not a positive number`;
            }
            else {
                message = "Error: Request body is missing. Must be of the form { \"themeId\": 999, \"citationId\": 999 } where 999 is a numeric identifier";
            }

            if (message) {
                res.status(400).send(errorMessage(
                    400,
                    "Invalid Parameter",
                    `/citation/create  (${req.body})`,
                    message,
                    ""
                ));

                return;
            }

            confirmCitation(themeId, citationId, obj.sequence)
                .then(response => {
                    confirmSequence(response.themeId, response.citationId, response.sequence)
                        .then(response => {
                            var themeId = response.themeId;
                            var citationId = response.citationId;
                            var sequence = response.sequence;  // This is the sequence order number of the new themeToCitation.
                            var existing = response.existing;  // These are the other themeToCitations attached to the same parent Theme node.

                            var existingThemeToCitations = [];
                            var index = 1;
                            var indexIssue = false;
                            for (var i in existing) {
                                var link = existing[i];
                                existingThemeToCitations.push({ id: link.id, citationId: link.citationId, sequence: link.sequence, index: index });
                                indexIssue |= link.sequence !== index++;
                            }

                            if (!sequence && !indexIssue) {
                                sequence = index;  // unspecified new bibleThemeToCitation goes to the end of the list
                            }
                            else if (sequence && !indexIssue) {
                                if (sequence >= index) {
                                    sequence = index;  // new bibleThemeToCitation specifies the end of the list
                                }
                                else if (sequence <= 1) {
                                    sequence = 1;
                                    indexIssue = true;  // new bibleThemeToCitation goes to the front of the list
                                }
                                else {
                                    indexIssue = true;  // new bibleThemeToCitation goes to somewhere in the middle of the list.
                                }
                            }
                            else if (!sequence) {
                                sequence = existingThemeToCitations.length + 1; // default to the back of the pack
                            }

                            if (indexIssue) {
                                for (var i = 0; i < existingThemeToCitations.length; i++) {
                                    existingThemeToCitations[i].sequence = existingThemeToCitations[i].index;  // fix the sequences
                                    if (existingThemeToCitations[i].sequence >= sequence) {
                                        existingThemeToCitations[i].sequence++; // leave a gap for the new sequence
                                    }
                                }
                            }

                            var themeToCitation = new bibleThemeToCitation;
                            themeToCitation.values = {
                                themeId: themeId,
                                citationId: citationId,
                                sequence: sequence
                            };

                            var insertObject = themeToCitation.getInsertObject();
                            createThemeToCitation(insertObject, indexIssue, existingThemeToCitations)
                                .then(result => {
                                    var values = {
                                        id: result.themeToCitation.id,
                                        themeId: result.themeToCitation.themeId,
                                        citationId: result.themeToCitation.citationId,
                                        sequence: result.themeToCitation.sequence
                                    };

                                    var indexIssue = result.indexIssue;
                                    var existingThemeToCitations = result.existingThemeToCitations;

                                    var tasks = [];
                                    if (indexIssue) {
                                        for (var i = 0; i < existingThemeToCitations.length; i++) {
                                            var link = new bibleThemeToCitation;
                                            link.values = { id: existingThemeToCitations[i].id, sequence: existingThemeToCitations[i].sequence };
                                            var updateObject = link.getUpdateObject();
                                            tasks.push(updateThemeToCitation(updateObject));
                                        }

                                        Promise.all(tasks).then();
                                    }

                                    res.send(values);
                                });
                        });
                });
        }
        catch (err) {
            var stringObj = JSON.stringify(obj);
            res.status(500).send(errorMessage(
                500,
                "System Error",
                `/citation/create  (${stringObj})`,
                err.message,
                "Error while attempting to insert new citation in database"
            ));
        }

        console.log("After createThemeToCitation completion");
    }
    else {
        if (message) {
            res.status(400).send(errorMessage(
                400,
                "Invalid Parameter",
                `/citation/create  (${req.body})`,
                message,
                ""
            ));
        }
    }
}


exports.delete = (req, res) => {
    var linkId = eval(req.params.id);
    var themeToCitation = new bibleThemeToCitation;
    themeToCitation.values = { id: linkId };

    if (typeof linkId !== "number") {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Query argument must be the numeric themeToCitation id",
            "Usage (e.g. /themeToCitation/2000) deletes the themeToCitation whose id equates to 2000.",
            ""
        ));
    }

    const queryObjects = (selectString, context) => {
        return new Promise((resolve, reject) => {
            dbAccess.query(selectString, (err, results) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ results: results, context: context });
                }
            });
        });
    }

    const deleteLink = (deleteString, context) => {
        return new Promise((resolve, reject) => {
            dbAccess.delete(deleteString, (err, results) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve({ results: results, context: context });
                }
            });
        });
    }

    const editSequence = (updateString) => {
        return new Promise((resolve, reject) => {
            dbAccess.update(updateString, (err, results) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(results);
                }
            });
        });
    }

    var selectString = themeToCitation.getSelectString();
    var context = { themeToCitationToDeleteId: linkId };
    queryObjects(selectString, context)
        .then(data => {
            if (data.results.length == 0) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    `Theme to Citation id: ${data.context.themeToCitationToDeleteId} was not found.`,
                    ""
                ));

                return;
            }

            context.themeToCitationValues = data.results[0];
            context.citationId = context.themeToCitationValues.citationId;

            var themeToCitation = new bibleThemeToCitation;
            themeToCitation.values = { citationId: context.citationId };
            var selectString = themeToCitation.getSelectString() + " ORDER BY bible_theme_sequence";

            queryObjects(selectString, context)
                .then(data => {
                    if (data.results.length == 1) {
                        var linkId = data.context.themeToCitationValues.id;
                        var citationId = data.context.themeToCitationValues.citationId;

                        res.status(500).send(errorMessage(
                            500,
                            "Server Error",
                            req.path,
                            `Unable to delete Theme to Citation id: ${linkId} - references to Citation id: ${citationId} lost. Citation must be deleted explicitly`,
                            ""
                        ));

                        return;
                    }

                    var themeToCitation = new bibleThemeToCitation;
                    themeToCitation.values = { id: data.context.themeToCitationValues.id };
                    var deleteString = themeToCitation.getDeleteString();
                    data.context.toResequence = data.results;

                    deleteLink(deleteString, context)
                        .then(data => {

                            var resequence = [];
                            index = 1;
                            if (data.context.toResequence.length > 1) {
                                for (var i = 0; i < data.context.toResequence.length; i++) {
                                    if (data.context.toResequence[i].id != data.context.themeToCitationToDeleteId) {
                                        if (data.context.toResequence[i].sequence != index) {
                                            var themeToCitation = new bibleThemeToCitation;
                                            themeToCitation.values = { id: data.context.toResequence[i].id, sequence: index };
                                            var updateObject = themeToCitation.getUpdateObject();
                                            resequence.push(editSequence(updateObject));
                                        }

                                        index++;
                                    }
                                }

                                Promise.all(resequence);
                            }

                            res.send({ deleted: data.context.themeToCitationValues });
                            return;
                        });
                });
        })
        .catch(err => {
            var message = err;
            if (err.message) {
                message = err.message;
            }

            res.status(500).send(errorMessage(
                500,
                "Server Error",
                req.path,
                message,
                ""
            ));
        })

}

exports.update = (req, res) => {
    var edited = req.body;
    var newThemeToCitation = new bibleThemeToCitation;
    newThemeToCitation.values = edited;
    var message = null;
    if (!newThemeToCitation.id.value) {
        message = "Error: themeToCitation edit operation \"id\" is required";
    }
    else if (!newThemeToCitation.themeId.value) {
        message = "Error: themeToCitation edit operation \"themeId\" is required";
    }
    else if (!newThemeToCitation.citationId.value) {
        message = "Error: themeToCitation edit operation \"citationId\" is required";
    }
    else if (!newThemeToCitation.sequence.value) {
        message = "Error: themeToCitation edit operation \"sequence\" is required";
    }

    if (message) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            message,
            "Usage, PUT operation body e.g. { \"id\": value, \"themeId\": value, \"citationId\": value, \"sequence\": value }",
            ""
        ));
    }

    const queryObjects = selectString => {
        return new Promise((resolve, reject) => {
            dbAccess.query(selectString, (err, results) => {
                if (err) { reject(err); }
                else { resolve(results); }
            });
        });
    }

    const updateObject = (updateString) => {
        return new Promise((resolve, reject) => {
            dbAccess.update(updateString, (err, results) => {
                if (err) { reject(err); }
                else { resolve(results); }
            });
        });
    }

    const addContext = context => {
        return new Promise(resolve => {
            resolve({ context: context });
        });
    }

    var originalThemeToCitation = new bibleThemeToCitation;
    originalThemeToCitation.values = { id: edited.id };

    var context = { edited: edited };
    var tasks = [];

    tasks.push(addContext(context));

    tasks.push(queryObjects(originalThemeToCitation.getSelectString()));

    var theme = new bibleTheme;
    theme.values = { id: edited.themeId };

    tasks.push(queryObjects(theme.getSelectString()));

    var siblings = new bibleThemeToCitation;
    siblings.values = { themeId: edited.themeId };

    tasks.push(queryObjects(siblings.getSelectString() + " ORDER BY bible_theme_sequence"));

    Promise.all(tasks)
        .then(data => {
            var context = data[0].context;
            var original = data[1][0];
            var editedTheme = data[2][0];
            var editedSiblings = data[3];

            if (data[1].length == 0) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    `Theme to Citation id: ${data.context.edited.id} was not found.`,
                    ""
                ));

                return;
            }

            context.original = original;
            context.editedTheme = editedTheme;
            context.editedSiblings = editedSiblings;
            context.changeThemes = context.original.themeId != context.edited.themeId;

            message = "";
            if (context.original.citationId !== context.edited.citationId) {
                message = `Error: editing of citationId values in themeToCitation is not allowed. Previous citationId: ${context.original.citationId},` +
                    ` new citationId: ${context.edited.id}`;

                res.status(400).send(errorMessage(
                    400,
                    "Invalid Parameter",
                    req.path,
                    message,
                    ""
                ));

                return;
            }

            if (context.original.themeId == context.edited.themeId) {
                if (context.edited.sequence < 1 || context.edited.sequence > context.editedSiblings.length) {
                    message = `Error: invalid sequence ${context.edited.sequence} must be within the range of citations in the theme, (1 - ${context.editedSiblings.length})`;
                }
            }
            else if (context.edited.sequence < 1 || context.edited.sequence > context.editedSiblings.length + 1) {
                message = `Error: invalid sequence ${context.edited.sequence} must be within the range of citations in the target theme, (1 - ${context.editedSiblings.length + 1})`;
            }

            if (message) {
                res.status(400).send(errorMessage(
                    400,
                    "Invalid Parameter",
                    req.path,
                    message,
                    ""
                ));

                return;
            }

            var tasks = [];

            tasks.push(addContext(context));

            var themeToCitation = new bibleThemeToCitation;
            themeToCitation.values = context.edited;
            console.log(themeToCitation.getUpdateString());

            tasks.push(updateObject(themeToCitation.getUpdateString()));

            if (context.changeThemes) {
                var originalSiblings = new bibleThemeToCitation;
                originalSiblings.values = { themeId: context.original.themeId };
                console.log(originalSiblings.getSelectString() + " ORDER BY bible_theme_sequence");

                tasks.push(queryObjects(originalSiblings.getSelectString() + " ORDER BY bible_theme_sequence"));
            }   

            index = 1;
            for (var i = 0; i < editedSiblings.length; i++) {
                var sib = editedSiblings[i];
                if (sib.id != edited.id) {
                    if (sib.sequence < edited.sequence) {
                        if (sib.sequence != index) {
                            themeToCitation.values = { id: sib.id, sequence: index };

                            tasks.push(updateObject(themeToCitation.getUpdateString()));
                        }
                    }
                    else {
                        if (sib.sequence != index + 1) {
                            themeToCitation.values = { id: sib.id, sequence: index + 1 };

                            tasks.push(updateObject(themeToCitation.getUpdateString()));
                        }
                    }

                    index++;
                }
            }

            Promise.all(tasks)
                .then(data => {
                    var context = data[0].context;
                    var editedThemeToCitation = data[1];

                    var tasks = [];

                    var themeToCitation = new bibleThemeToCitation;
                    themeToCitation.values = { id: context.edited.id };

                    tasks.push(queryObjects(themeToCitation.getSelectString()));

                    if (context.changeThemes) {
                        var originalSiblings = data[2];

                        var index = 1;
                        var sibling = new bibleThemeToCitation;
                        for (var i = 0; i < originalSiblings.length; i++) {
                            var sib = originalSiblings[i];
                            if (sib.id != context.edited.id) {
                                if (sib.sequence != index) {
                                    sibling.values = { id: sib.id, sequence: index };

                                    tasks.push(updateObject(sibling.getUpdateString()));
                                }

                                index++;
                            }
                        }
                    }

                    Promise.all(tasks)
                        .then(data => {
                            res.send({ modified: data[0][0] });
                        });
                });
        })
        .catch(err => {
            var message = err;
            if (err.message) {
                message = err.message;
            }

            res.status(500).send(errorMessage(
                500,
                "Server Error",
                req.path,
                message,
                ""
            ));
        });
}


exports.setSequence = (req, res) => {
    var message;
    if (!message && (!req.params.id || typeof Number(req.params.id) != "number")) {
        message = "Error: id is missing or invalid. Must be a number.";
    }

    if (!message && (!req.params.sequence || typeof Number(req.params.sequence) != "number")) {
        message = "Error: sequence is missing or invlaid. Must be a number.";
    }

    if (!message && req.params.sequence < 1) {
        message = "Error: sequence must be a number greater than zero";
    }

    if (message) {
        res.status(500).send(errorMessage(
            500,
            "Server Error",
            req.path,
            message,
            "Usage: PUT/themeToCitations/[id]/sequence/[sequence]"
        ));

        return;
    }
    (async (req) => {
        await dbAccess.execute(`call set_theme_to_citation_sequence(${+req.params.id}, ${+req.params.sequence})`, (err, results) => {
            if (err) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    `Error attempting to set theme sequence number: ${err.message}`,
                    "Usage: PUT/themeToCitations/[id]/sequence/[sequence]"

                ))
            }
            else {
                res.send({ message: "Success" });
            }
        });

    })(req);
}
