const bibleThemeToCitation = require("../models/bibleThemeToCitation.model");
const bibleTheme = require("../models/bibleTheme.model");
const bibleCitation = require("../models/bibleCitation.model");
const bibleCitationVerse = require("../models/bibleCitationVerse.model");
const bibleScripture = require("../models/bibleScripture.model");
const bibleCitationVerseMarkup = require("../models/bibleCitationVerseMarkup.model");
const publisherModel = require("../models/publisher.model");
const dbAccess = require("../db/db.access");
const errorMessage = require("./helpers/errorMessage");
const responseTools = require("./helpers/responseTools");
const tools = new responseTools;

exports.listCitation = (req, res) => {
    var query = eval(req.params.id);
    if (typeof query !== "number") {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Query argument must be the numeric citation id",
            "Usage (e.g. /publisher/citation/2000) returns the published citation whose id equates to 2000.",
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

    getCitationFromTemplate = (citationTemplate) => {

        var citation = null;
        var citationVerse = null;
        var markup = null;

        for (var i = 0; i < citationTemplate.length; i++) {
            if (citation == null) {
                citation = tools.getObjectFromResult(citationTemplate[i], 1);
                citation.verses = [];
                citationVerse = null;
                markup = null;
            }

            if (citationVerse == null) {
                citationVerse = tools.getObjectFromResult(citationTemplate[i], 2);
                citationVerse.scripture = tools.getObjectFromResult(citationTemplate[i], 3);
                citationVerse.markups = [];
                citation.verses.push(citationVerse);

                markup = null;
            }
            else {
                var newCitationVerse = tools.getObjectFromResult(citationTemplate[i], 2);
                if (newCitationVerse.id != citationVerse.id) {
                    citationVerse = newCitationVerse;
                    citationVerse.scripture = tools.getObjectFromResult(citationTemplate[i], 3);
                    citationVerse.markups = [];
                    citation.verses.push(citationVerse);
                }
            }

            markup = tools.getObjectFromResult(citationTemplate[i], 4);
            if (markup.id) {
                citationVerse.markups.push(markup);
            }
        }

        citation.verses.sort((a, b) => a.scripture.bibleOrder - b.scripture.bibleOrder);
        for (var i = 0; i < citation.verses.length; i++) {
            citation.verses[i].markups.sort((a, b) => a.textIndex - b.textIndex);
        }

        return citation;
    }

    tasks = [];

    var context = { citationId: query };
    tasks.push(addContext(context));

    var citation = new bibleCitation;
    citation.values = { id: context.citationId };
    tasks.push(getQuery(citation.getChildrenSelectString()));

    Promise.all(tasks)
        .then(data => {
            var context = data[0].context;
            var citation = getCitationFromTemplate(data[1]);

            var header = { citationDescription: citation.description ? citation.description : "" };
            var published = [];

            var book = null;
            var chapter = null;
            var startVerse = null;
            var endVerse = null;

            var label = null;
            var verseRange = [];
            context.citation = citation;

            for (var i = 0; i < citation.verses.length; i++) {
                var verse = citation.verses[i];
                var citationVerse = new bibleCitationVerse;
                citationVerse.values = verse;

                var markupText = citationVerse.getMarkupText();

                if (i == 0) {
                    book = verse.scripture.book;
                    chapter = verse.scripture.chapter;
                    startVerse = verse.scripture.verse;
                    endVerse = verse.scripture.verse;

                    label = markupText.label;
                    verseRange.push(markupText.markupText);
                }
                else if (book == verse.scripture.book && chapter == verse.scripture.chapter && verse.scripture.verse == endVerse + 1) {
                    endVerse = verse.scripture.verse;
                    verseRange.push(markupText.markupText);
                }
                else {
                    if (startVerse != endVerse) {
                        label = `${label}-${endVerse}`;
                    }

                    published.push({ label: label, verses: verseRange });
                    verseRange = [];

                    book = verse.scripture.book;
                    chapter = verse.scripture.chapter;
                    startVerse = verse.scripture.verse;
                    endVerse = verse.scripture.verse;

                    label = markupText.label;
                    verseRange.push(markupText.markupText);
                }
            }

            res.send({ header: header, verses: published });
        })
        .catch(err => {
            res.status(400).send(errorMessage(
                400,
                "Invalid Parameter",
                req.path,
                err.message,
                "Usage (e.g. /publisher/citation/2000) returns the published citation whose id equates to 2000.",
                ""
            ));
        });

}

exports.listTheme = (req, res) => {
    var query = eval(req.params.id);
    if (typeof query !== "number") {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Query argument must be the numeric citation id",
            "Usage (e.g. /publisher/theme/2000) returns the published theme whose id equates to 2000.",
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

    getThemeFromTemplate = (themeTemplate) => {
        var theme = null;
        var activeChildTheme = null;
        var activeThemeToCitation = null;

        for (var i = 0; i < themeTemplate.length; i++) {
            if (!theme) {
                theme = tools.getObjectFromResult(themeTemplate[i], 1)
                theme.themeToCitations = [];
                theme.citations = [];
                theme.themes = [];
            }


            var childTheme = tools.getObjectFromResult(themeTemplate[i], 2);
            if (childTheme.id && (!activeChildTheme || activeChildTheme.id != childTheme.id)) {
                theme.themes.push(childTheme);
                activeChildTheme = childTheme;
            }

            var themeToCitation = tools.getObjectFromResult(themeTemplate[i], 3);
            if (themeToCitation.id && (!activeThemeToCitation || activeThemeToCitation.id != themeToCitation.id)) {
                themeToCitation.citation = tools.getObjectFromResult(themeTemplate[i], 4);
                activeThemeToCiation = themeToCitation;
                theme.themeToCitations.push(themeToCitation);
            }
        }

        if (theme.themes.length > 1) {
            theme.themes.sort((a, b) => a.sequence - b.sequence);
        }

        if (theme.themeToCitations.length > 1) {
            theme.themeToCitations.sort((a, b) => a.sequence - b.sequence);
        }

        for (var i = 0; i < theme.themeToCitations.length; i++) {
            theme.citations.push(theme.themeToCitations[i].citation);
        }

        delete theme.themeToCitations;

        return theme;
    }

    getCitationFromTemplate = (citationTemplate) => {
        var citation = null;
        var citationVerse = null;
        var markup = null;

        for (var i = 0; i < citationTemplate.length; i++) {
            if (citation == null) {
                citation = tools.getObjectFromResult(citationTemplate[i], 1);
                citation.verses = [];
                citationVerse = null;
                markup = null;
            }

            if (citationVerse == null) {
                citationVerse = tools.getObjectFromResult(citationTemplate[i], 2);
                citationVerse.scripture = tools.getObjectFromResult(citationTemplate[i], 3);
                citationVerse.markups = [];
                citation.verses.push(citationVerse);

                markup = null;
            }
            else {
                var newCitationVerse = tools.getObjectFromResult(citationTemplate[i], 2);
                if (newCitationVerse.id != citationVerse.id) {
                    citationVerse = newCitationVerse;
                    citationVerse.scripture = tools.getObjectFromResult(citationTemplate[i], 3);
                    citationVerse.markups = [];
                    citation.verses.push(citationVerse);
                }
            }

            markup = tools.getObjectFromResult(citationTemplate[i], 4);
            if (markup.id) {
                citationVerse.markups.push(markup);
            }
        }

        if (citation && citation.verses && citation.verses.length > 0) {
            citation.verses.sort((a, b) => a.scripture.bibleOrder - b.scripture.bibleOrder);
            for (var i = 0; i < citation.verses.length; i++) {
                citation.verses[i].markups.sort((a, b) => a.textIndex - b.textIndex);
            }
        }

        return citation;
    }


    assembleTheme = (theme, themeList) => {
        var subthemeIds = [];
        theme.themes.map(th => subthemeIds.push(th.id));
        theme.themes = [];
        for (var i = 0; i < subthemeIds.length; i++) {
            theme.themes.push(themeList.find(th => th.id == subthemeIds[i]));
            assembleTheme(theme.themes[i], themeList);
        }

        return theme;
    }

    getSubthemes = async (theme) => {
        var tasks = [];

        var childTheme = new bibleTheme;
        for (var i = 0; i < theme.themes.length; i++) {
            childTheme.values = { id: theme.themes[i].id };
            tasks.push(getQuery(childTheme.getChildrenSelectString()));
        }

        var subthemes = [];

        var results = await Promise.all(tasks);
        for (i = 0; i < theme.themes.length; i++) {
            var subtheme = getThemeFromTemplate(results[i]);
            subthemes.push(subtheme);
        }

        return subthemes;
    }

    addAllChildThemes = async (theme) => {
        var themeQueue = [];
        var themeList = [];

        themeQueue.push(theme);
        while (themeQueue.length > 0) {
            var nextTheme = themeQueue.pop();

            if (nextTheme.themes) {
                themeList.push(nextTheme);

                var subthemes = await getSubthemes(nextTheme);

                for (var i = 0; i < subthemes.length; i++) {
                    var childTheme = subthemes[i];

                    themeQueue.push(childTheme);
                    console.log("childTheme:");
                    console.log(childTheme);
                }
            }
        }

        return themeList;
    }

    addAllVerses = async (themeList) => {
        tasks = [];

        context = { themeList: themeList };
        tasks.push(addContext(context));

        for (var i = 0; i < themeList.length; i++) {
            var theme = themeList[i];
            for (var j = 0; j < theme.citations.length; j++) {
                var citation = new bibleCitation;
                citation.values = { id: theme.citations[j].id };
                tasks.push(getQuery(citation.getChildrenSelectString()));
            }
        }

        var data = await Promise.all(tasks);
        var context = data[0].context;
        var themeList = context.themeList;

        var index = 1;
        for (var i = 0; i < themeList.length; i++) {
            var theme = themeList[i];
            var citations = theme.citations;
            theme.citations = [];
            for (var j = 0; j < citations.length; j++) {
                if (citations[j]) {
                    theme.citations.push(getCitationFromTemplate(data[index++]));
                }
                else {

                }
            }
        }

        return themeList;
    }

    var theme = new bibleTheme;
    theme.values = { id: query };

    getQuery(theme.getChildrenSelectString())
        .then(data => {
            (async () => {
                var theme = getThemeFromTemplate(data);
                var themeList = await addAllChildThemes(theme);
                themeList = await addAllVerses(themeList);
                theme = assembleTheme(theme, themeList);

                var publisher = new publisherModel(theme.name, theme.description, theme.citations, theme.themes);
                var published = publisher.publish();

                res.send(published);
            })();
        });
}
