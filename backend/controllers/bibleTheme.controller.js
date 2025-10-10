const bibleTheme = require("../models/bibleTheme.model");
const dbAccess = require("../db/db.access");
const errorMessage = require("./helpers/errorMessage");
const responseTools = require("./helpers/responseTools");
const tools = new responseTools;

exports.listOne = (req, res) => {
    var originalPath = req.path;
    var path = originalPath.toLowerCase();
    var query = eval(req.params.id);
    var byId = false;
    if (typeof query == "number") {
        originalPath = query;
        byId = true;
    }
    else if (path.startsWith("/path=")) {
        path = path.substr(6);
        if (!path.startsWith("/")) {
            path = "/" + path;
        }
        if (path.endsWith("/")) {
            path = path.substr(0, path.length - 1);
        }

        for (var index in global.themePaths) {
            themePath = global.themePaths[index].path;
            if (themePath.toLowerCase() == path) {
                query = eval(index);
            }
        }
    }
    else {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            `/theme/${originalPath}`,
            "Query argument must be the numeric theme id or path=... followed by the theme path",
            "Usage (e.g. /theme/2000) returns the value of the theme whose id equates to 2000.",
            "Or (e.g. /theme/path=/persons/Jesus) path names are not case sensitive."
        ));
    }

    const theme = new bibleTheme;
    theme.values = { id: query };

    const selectString = theme.getChildrenSelectString();
    dbAccess.query(selectString, (err, results) => {
        if (err) {
            res.status(500).send(errorMessage(
                500,
                "Server Error",
                "/theme/" + originalPath,
                err.message,
                ""
            ));
        }
        else {
            var theme = null;

            for (var i = 0; i < results.length; i++) {
                var result = results[i];
                if (theme === null) {
                    theme = tools.getObjectFromResult(result, 1);
                    theme.path = global.themePaths[theme.id].path;
                    theme.themes = [];
                    theme.themeToCitationLinks = [];
                }

                var newChildTheme = tools.getObjectFromResult(result, 2);
                if (newChildTheme) {
                    var activeChildTheme = null;
                    theme.themes.map(th => {
                        if (th.theme.id == newChildTheme.id) {
                            activeChildTheme = th;
                        }
                    });

                    if (!activeChildTheme && newChildTheme.id) {
                        activeChildTheme = newChildTheme;
                        activeChildTheme.path = global.themePaths[activeChildTheme.id].path;
                        theme.themes.push({ theme: activeChildTheme });
                    }
                }

                var newThemeToCitation = tools.getObjectFromResult(result, 3);
                if (newThemeToCitation) {
                    var activeThemeToCitation = null;
                    theme.themeToCitationLinks.map(link => {
                        if (link.themeToCitation.id == newThemeToCitation.id) {
                            activeThemeToCitation = link;
                        }
                    });

                    if (!activeThemeToCitation && newThemeToCitation.id) {
                        activeThemeToCitation = newThemeToCitation;
                        activeThemeToCitation.citation = tools.getObjectFromResult(result, 4);
                        theme.themeToCitationLinks.push({ themeToCitation: activeThemeToCitation });
                    }
                }
            }

            theme.themes.sort((a, b) => a.theme.sequence - b.theme.sequence);
            theme.themeToCitationLinks.sort((a, b) => a.themeToCitation.sequence - b.themeToCitation.sequence);
            res.send({ theme: theme });
        }

    });
};

exports.chain = (req, res) => {
    var child = req.params.id;

    buildChain = (theme, chain) => {
        chain.push({
            id: theme.id,
            name: theme.name,
            parent: theme.parent
        });

        if (+theme.parent > 0) {
            var parentTheme = global.themePaths[+theme.parent];
            buildChain(parentTheme, chain);
        }
    }

    reverseChain = (chain) => {
        var popChain = [];
        while (chain.length > 0) {
            popChain.push(chain.pop());
        }

        return popChain;
    }

    var id = child.replace(/theme(\d+)/, "$1");
    var chain = [];
    try {
        var theme = global.themePaths[+id];
        buildChain(theme, chain);
        chain = reverseChain(chain);
        res.send({ chain: chain });
    }
    catch {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            child,
            message,
            "Usage: /theme/chain/{themeId}"
        ));
    }
}

exports.listAll = (req, res) => {
    var parent = undefined;
    if (req.query) {
        parent = req.query.parent;
    }

    var allNodes = [];
    if (parent === undefined) {
        for (var theme in global.themePaths) {
            allNodes.push(global.themePaths[theme]);
        }
    }
    else {
        for (var theme in global.themePaths) {
            if (global.themePaths[theme].parent == parent) {
                allNodes.push(global.themePaths[theme]);
            }
        }

        allNodes.sort((a, b) => { a.sequence - b.sequence });
    }


    res.send({ themes: allNodes });
};

exports.create = (req, res) => {
    var obj = req.body;
    console.log(obj);
    var message = null;
    if (!obj) {
        message = "Error: theme object is missing from the message body";
    }

    if (!message && (!obj.name || typeof obj.name != "string")) {
        message = "Error: theme name is missing or invaid";
    }

    if (!message && ((!obj.parent && obj.parent !== 0) || typeof eval(obj.parent) != "number")) {
        message = "Error: theme parent is missing or invalid. Parent must be a valid theme id";
    }

    if (!message && (obj.sequence && typeof eval(obj.sequence) != "number")) {
        message = "Error: theme sequence is missing or invalid. Sequence is the numeric order of the theme within the parent theme.";
    }

    if (message) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            message,
            "Usage: In message body { \"name\": name, \"description\": description, \"parent\": parentThemeId, \"sequence\": orderWithinParentTheme }"
        ));

        return;
    }

    addContext = context => {
        return new Promise(resolve => {
            resolve({ context: context });
        });
    }

    getQuery = selectString => {
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

    insertTheme = insertString => {
        return new Promise((resolve, reject) => {
            dbAccess.insert(insertString, (err, results) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(results);
                }
            });
        });
    }

    var context = { insert: obj };

    var tasks = [];

    tasks.push(addContext(context));

    tasks.push(getQuery(`SELECT count(*) count FROM bible_themes WHERE bible_theme_parent_id=${obj.parent} AND name="${obj.name}"`));

    tasks.push(getQuery(`SELECT get_next_theme_sequence_from_parent_theme(${obj.parent}) AS nextSequence`));

    Promise.all(tasks)
        .then(data => {
            //console.log("after get_next_theme_sequence_from_parent_theme");
            var context = data[0].context;
            var count = data[1][0].count;

            if (count > 0) {
                res.status(400).send(errorMessage(
                    400,
                    "Duplicate Subtheme names are not allowed in the same parent theme",
                    req.path,
                    message,
                    "Usage: (POST) In message body { \"name\": name, \"description\": description, \"parent\": parentThemeId, \"sequence\": orderWithinParentTheme }"
                ));

                return;
            }

            var nextSequence = data[2][0].nextSequence;

            //console.log(`nextSequence: ${nextSequence}`);

            context.insert.sequence = nextSequence;
            //console.log("context:");
            console.log(JSON.stringify(context));

            tasks = [];
            tasks.push(addContext(context));

            var theme = new bibleTheme;
            theme.values = context.insert;
            tasks.push(insertTheme(theme.getInsertString()));

            Promise.all(tasks)
                .then(data => {
                    var insertId = data[1].insertId;

                    var tasks = [];
                    var context = { insertId: data[1].insertId };
                    const refreshThemePathsAsync = require("../appHelpers/refreshThemePathsAsync");
                    tasks.push(addContext(context));
                    tasks.push(refreshThemePathsAsync());
                    Promise.all(tasks)
                        .then(data => {
                            var theme = new bibleTheme;
                            theme.values = { id: data[0].context.insertId };
                            getQuery(theme.getSelectString())
                                .then(results => {
                                    results[0].path = global.themePaths[results[0].id].path;
                                    res.send(results[0]);
                                });
                        });
                });
        });
}

exports.delete = (req, res) => {
    var themeId = req.params.id;
    (async (themeId) => {
        await dbAccess.execute(`call delete_bible_theme(${themeId})`, (err, results) => {
            if (err) {
                res.send(`Error attempting to delete theme: ${err.message}`);
                return;
            }
            else {
                (async () => {
                    const refreshThemePathsAsync = require("../appHelpers/refreshThemePathsAsync");
                    await refreshThemePathsAsync();
                    res.send({ deleted: themeId });
                 })();
           }
        });
    })(themeId);
}

exports.edit = (req, res) => {
    var obj = req.body;
    console.log(obj);
    var message = null;
    if (!obj) {
        message = "Error: theme object is missing from the message body";
    }

    if (!message && (!obj.id || typeof Number(obj.id) != "number")) {
        message = "Error: theme id is missing or invaid";
    }
    else if (!message) {
        obj.id = Number(obj.id);
    }

    if (!message && (obj.parent && typeof Number(obj.parent) != "number")) {
        message = "Error: theme parent is invalid. Parent must be a valid theme id";
    }
    else if (!message && obj.parent) {
        obj.parent = Number(obj.parent);
    }

    if (!message && (obj.sequence && typeof Number(obj.sequence) != "number")) {
        message = "Error: theme sequence is invalid. Sequence is the numeric order of the theme within the parent theme.";
    }
    else if (!message && obj.sequence) {
        obj.sequence = Number(obj.sequence);
    }

    if (message) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            message,
            "Usage: In message body { \"id\": themeId, \"name\": name, \"description\": description, \"parent\": parentThemeId, \"sequence\": orderWithinParentTheme }"
        ));

        return;
    }

    addContext = context => {
        return new Promise(resolve => {
            resolve({ context: context });
        });
    }

    getQuery = selectString => {
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

    updateTheme = updateString => {
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

    refreshThemes = () => {
        return new Promise(resolve => {
            const refreshThemePaths = require("../appHelpers/refreshThemePaths");
            refreshThemePaths();
            resolve();
        });
    }

    var context = { edited: obj };

    var tasks = [];

    tasks.push(addContext(context));

    var theme = new bibleTheme;
    theme.values = { id: context.edited.id };
    tasks.push(getQuery(theme.getSelectString()));

    Promise.all(tasks)
        .then(data => {
            var context = data[0].context;
            var original = data[1].length == 1 ? data[1][0] : null;

            var message = null;
            if (!original) {
                message = `Error: theme not found, id: ${context.edited.id}`;
            }

            var parentId = context.edited.parent;
            if (!parentId) {
                parentId = original.parent; 
            }

            var name = context.edited.name;
            if (!name) {
                name = original.name;
            }

            var description = context.edited.description;
            if (!description) {
                description = original.description;
            }

            var isChanging = name != original.name ||
                description != original.description ||
                parentId != original.parent;

            var sequence = context.edited.sequence;
            if (sequence && sequence != original.sequence) {
                isChanging = true;
            }
            else if (!sequence && !isChanging) {
                sequence = original.sequence;
            }

            if (!isChanging) {
                res.status(200).send(errorMessage(
                    200,
                    "Unchanged",
                    req.path,
                    "No changes were indicated",
                    "Usage: In message body { \"id\": themeId, \"name\": name, \"description\": description, \"parent\": parentThemeId, \"sequence\": orderWithinParentTheme }"
                ));

                return;
            }

            if (message) {
                res.status(400).send(errorMessage(
                    400,
                    "Invalid Parameter",
                    req.path,
                    message,
                    "Usage: In message body { \"id\": themeId, \"name\": name, \"description\": description, \"parent\": parentThemeId, \"sequence\": orderWithinParentTheme }"
                ));

                return;
            }

            context.edited = {
                id: original.id,
                parent: parentId,
                name: name,
                description: description,
                sequence: sequence
            };

            context.original = original;
            context.changeParent = original.parent != context.edited.parent;

            tasks = [];

            tasks.push(addContext(context));

            var theme = new bibleTheme;
            theme.values = { id: context.edited.parent };

            tasks.push(getQuery(theme.getChildrenSelectString()));

            theme.values = { id: context.edited.id };

            var query = theme.getChildrenSelectString();
            console.log(query);
            tasks.push(getQuery(query));

            if (context.changeParent) {
                theme.values = { parent: context.original.parent };
                query = theme.getChildrenSelectString();
                tasks.push(getQuery(query));
                console.log(query);
            }

            Promise.all(tasks)
                .then(data => {
                    var context = data[0].context;

                    var siblings = [];
                    var originalSiblings = [];
                    var parentTheme = tools.buildExtendedTheme(data[1]);
                    var originalParent = null;
                    if (context.changeParent) {
                        originalParent = tools.buildExtendedTheme(data[2]);
                    }

                    var sameName = null;
                    var message = null;
                    if (!parentTheme) {
                        message = `Error: Parent theme id: ${context.edited.parent} not found.`;
                    }
                    else {
                        if (context.changeParent) {
                            if (
                                !context.edited.sequence ||
                                context.edited.sequence < 1 ||
                                context.edited.sequence > parentTheme.themes.length + 1) {
                                    context.edited.sequence = parentTheme.themes.length + 1;
                            }

                            originalParent.themes.forEach(theme => {
                                if (theme.theme.id != context.original.id) {
                                    originalSiblings.push(theme.theme);
                                }
                            });

                            siblings = parentTheme.themes;
                        }
                        else {
                            parentTheme.themes.forEach(theme => {
                                if (theme.theme.id != context.original.id) {
                                    siblings.push(theme.theme);
                                }
                            });
                        }

                        sameName = siblings.find(theme => theme.name.toLowerCase() == context.edited.name.toLowerCase());
                        if (sameName) {
                            message = `Error: Theme "${context.edited.name}" already exists, and has the same parent theme`;
                        }
                    }

                    if (message) {
                        res.status(400).send(errorMessage(
                            400,
                            "Invalid Parameter",
                            req.path,
                            message,
                            "Usage: In message body { \"id\": themeId, \"name\": name, \"description\": description, \"parent\": parentThemeId, \"sequence\": orderWithinParentTheme }"
                        ));

                        return;
                    }

                    if (!message && context.edited.sequence < 1 || context.edited.sequence > siblings.length + 1) {
                            context.edited.sequence = siblings.length + 1;
                    }

                    if (message) {
                        res.status(400).send(errorMessage(
                            400,
                            "Invalid Parameter",
                            req.path,
                            message,
                            "Usage: In message body { \"id\": themeId, \"name\": name, \"description\": description, \"parent\": parentThemeId, \"sequence\": orderWithinParentTheme }"
                        ));

                        return;
                    }

                    var tasks = [];

                    tasks.push(addContext(context));

                    var theme = new bibleTheme;
                    theme.values = context.edited;

                    // Update the theme
                    tasks.push(updateTheme(theme.getUpdateString()));

                    if (context.edited.parent != context.original.parent ||
                        context.edited.sequence != context.original.sequence) {

                        // Adjust the sequence of sibling themes if they need to be adjusted.
                        // If the updated theme was moved from one parent theme to another,
                        // adjust the sequence of the siblings from the former parent and of
                        // the new parent.
                        var index = 1;
                        for (var i = 0; i < siblings.length; i++) {
                            var sib = siblings[i];
                            if (siblings[i].id != context.edited.id) {
                                if (index < context.edited.sequence) {
                                    if (sib.sequence != index) {
                                        theme.values = { id: sib.id, sequence: index };
                                        tasks.push(updateTheme(theme.getUpdateString()));
                                    }
                                }
                                else {
                                    if (sib.sequence != index + 1) {
                                        theme.values = { id: sib.id, sequence: index + 1 };
                                        tasks.push(updateTheme(theme.getUpdateString()));
                                    }
                                }

                                index++;
                            }
                        }

                        index = 1;
                        for (var i = 0; i < originalSiblings.length; i++) {
                            var sib = originalSiblings[i];
                            if (sib.id != context.edited.id) {
                                if (sib.sequence != index) {
                                    theme.values = { id: sib.id, sequence: index };
                                    tasks.push(updateTheme(theme.getUpdateString()));
                                }

                                index++;
                            }
                        }
                    }

                    Promise.all(tasks)
                        .then(data => {
                            const refreshThemePaths = require("../appHelpers/refreshThemePathsAsync");
                            refreshThemePaths();
                            res.send({ message: "Success" });
                        });
                });
        })
        .catch(err => {
            res.status(500).send(errorMessage(
                500,
                "Server Error",
                req.path,
                err.message,
                "Usage: In message body { \"id\": themeId, \"name\": name, \"description\": description, \"parent\": parentThemeId, \"sequence\": orderWithinParentTheme }"
            ));
        });
}

exports.resequenceThemes = (req, res) => {
    var themeId = req.params.id;
    var message = null;
    if (!obj) {
        message = "Error: theme resequence object is missing from the message body";
    }

    if (!message && (!obj.parentTheme || typeof Number(obj.parentTheme) != "number")) {
        message = "Error: parentTheme is missing or invaid. Must be a number.";
    }

    if (
        !message &&
        (!obj.themes || !Array.isArray(obj.themes))) {
        message = "Error: themes is missing or invaid. Must be an array of { themeId: id } where id is a number";
    }

    var parentId = +obj.parentTheme;
    var themes = [];

    if (!message) {
        for (var i = 0; i < obj.themes.length; i++) {
            if (!obj.themes[i] || typeof Number(obj.themes[i]) !== "number") {
                message = "Error: themes array objects must contain the numeric themeId property";
                break;
            }

            themes.push(+obj.themes[i]);
        }
    }

    if (message) {
        res.status(500).send(errorMessage(
            500,
            "Server Error",
            req.path,
            message,
            "Usage: In message body { \"parentTheme\": themeId, \"theme\": [{\"themeId\": id1}, {\"themeId\": id2}, ...] }"
        ));

        return;
    }

    var themeArray = themes.join(",");
    var query = `CALL reorder_theme_sequence(${parentId}, '${themeArray}')`;

    (async () => {
        await dbAccess.execute(query, (err, results) => {
            if (err) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    `Error attempting to resequence themes: ${err.message}`,
                    "Usage: In message body { \"parentTheme\": themeId, \"theme\": [{\"themeId\": id1}, {\"themeId\": id2}, ...] }"
                ));
            }
            else {
                refreshThemePaths();
                res.send({ message: "Success" });
            }
        });
    })();
}

exports.normalizeThemes = (req, res) => {
    var parentId = req.params.id;
    (async (parentId) => {
        await dbAccess.execute(`call normalize_theme_sequence(${parentId})`, (err, results) => {
            if (err) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    `Error attempting to normalize child themes: ${err.message}`,
                    "Usage: In message body { \"parentTheme\": themeId, \"citations\": [{\"themeToCitationId\": id1}, {\"themeToCitationId\": id2}, ...] }"
                ));
            }
            else {
                (async () => {
                    const refreshThemePathsAsync = require("../appHelpers/refreshThemePathsAsync");
                    await refreshThemePathsAsync();
                    res.send({ message: "Success" });
                })();
            }
        });
    })(parentId);
}

exports.resequenceCitations = (req, res) => {
    var obj = req.body;
    console.log(obj);
    var message = null;
    if (!obj) {
        message = "Error: citation resequence object is missing from the message body";
    }

    if (!message && (!obj.parentTheme || typeof Number(obj.parentTheme) != "number")) {
        message = "Error: parentTheme is missing or invaid. Must be a number.";
    }

    if (
        !message &&
        (!obj.citations || !Array.isArray(obj.themes))) {
        message = "Error: citations is missing or invaid. Must be an array of { themeToCitationId: id } where id is a number";
    }

    var parentId = +obj.parentId;
    var themes = [];

    if (!message) {
        for (var i = 0; i < obj.citations.length; i++) {
            if (!obj.citations[i].themeToCitationId || typeof Number(obj.citation[i].themeToCitationId) !== "number") {
                message = "Error: citations array objects must contain the numeric themeToCitationId property";
                break;
            }

            themes.push(+obj.citations[i].themeToCitationId);
        }
    }

    if (message) {
        res.status(500).send(errorMessage(
            500,
            "Server Error",
            req.path,
            message,
            "Usage: In message body { \"parentTheme\": themeId, \"citations\": [{\"themeToCitationId\": id1}, {\"themeToCitationId\": id2}, ...] }"
        ));

        return;
    }

    var citationArray = citations.join(",");
    var query = `CALL reorder_citation_sequence(${parentId}, '${citationArray}')`;

    (async () => {
        await dbAccess.execute(query, (err, results) => {
            if (err) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    `Error attempting to resequence citations: ${err.message}`,
                    "Usage: In message body { \"parentTheme\": themeId, \"citations\": [{\"themeToCitationId\": id1}, {\"themeToCitationId\": id2}, ...] }"
                ));
                res.send();
            }
            else {
                res.send({ message: "Success" });
            }
        });
    })();
}


exports.normalizeCitations = (req, res) => {
    var parentId = req.params.id;
    (async (parentId) => {
        await dbAccess.execute(`call normalize_citation_sequence(${parentId})`, (err, results) => {
            if (err) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    `Error attempting to normalize citation sequence: ${err.message}`,
                    "Usage: In message body { \"parentTheme\": themeId, \"citations\": [{\"themeToCitationId\": id1}, {\"themeToCitationId\": id2}, ...] }"
                ));
                res.send();
            }
            else {
                res.send({ message: "Success" });
            }
        });
    })(parentId);
}

exports.setSequence = (req, res) => {
    var message;
    if (!message && (!req.params.id || typeof Number(req.params.id) != "number")) {
        message = "Error: theme Id is missing or invalid. Must be a number.";
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
            "Usage: PUT /themes/[id]/sequence/[sequence]"
        ));

        return;
    }
    (async (req) => {
        await dbAccess.execute(`call set_theme_sequence(${+req.params.id}, ${+req.params.sequence})`, (err, results) => {
            if (err) {
                res.status(500).send(errorMessage(
                    500,
                    "Server Error",
                    req.path,
                    `Error attempting to set theme sequence number: ${err.message}`,
                    "Usage: PUT /themes/[id]/sequence/[sequence]"

                ))
            }
            else {
                res.send({ message: "Success" });
            }
        });

    })(req);
}
