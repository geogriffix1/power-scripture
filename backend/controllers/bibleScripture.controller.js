const bibleScripture = require("../models/bibleScripture.model");
const dbAccess = require("../db/db.access");
const errorMessage = require("./helpers/errorMessage");
const allBooks = require("./helpers/allBooks")();
const validBookPattern = "(genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|1samuel|2samuel|1kings|2kings|1chronicles|2chronicles|ezra|nehemiah|esther|job|psalms|proverbs|ecclesiastes|songofsolomon|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|1corinthians|2corinthians|galatians|ephesians|philippians|colossians|1thessalonians|2thessalonians|1timothy|2timothy|titus|philemon|hebrews|james|1peter|2peter|1john|2john|3john|jude|revelation)";
const validVerseExpression = /(genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|1samuel|2samuel|1kings|2kings|1chronicles|2chronicles|ezra|nehemiah|esther|job|psalms|proverbs|ecclesiastes|songofsolomon|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|1corinthians|2corinthians|galatians|ephesians|philippians|colossians|1thessalonians|2thessalonians|1timothy|2timothy|titus|philemon|hebrews|james|1peter|2peter|1john|2john|3john|jude|revelation)(?:(\d{1,3}):)?(\d{1,3})(?:-(\d{1,3}))?/;
const matchSpaces = /\s/g;

exports.instructions = (req, res) => {
    res.status(400).send(errorMessage(
        400,
        "Invalid Parameter",
        req.path,
        "Unable to process request",
        "Usage (e.g. /scriptures/genesis1:1-10,john1:1-10) spaces and capitalzation are optional. " +
            "For scripture queries see: /scripture/contains and /scripture/like"                
    ));
}

getBibleChapterMaxVerse = async (book, chapter) => {
    var selectString = `SELECT get_bible_chapter_max_verse('${book}', ${chapter}) as max_verse;`;
    var maxVerse = null;

    query = (selectString) => {
        return new Promise((resolve, reject) => {
            dbAccess.query(selectString, (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    maxVerse = result[0].max_verse;
                    resolve(maxVerse);
                }
            });
        });
    }

    var maxVerse = await query(selectString);
    return maxVerse;
}

exports.maxVerse = (req, res) => {
    (async () => {
        var book;
        var chapter;
        if (req.params && req.params.book && req.params.chapter) {
            book = req.params.book;
            chapter = req.params.chapter;
        }

        if (!book || !chapter) {
            res.status(400).send(errorMessage(
                400,
                "Invalid Parameter",
                req.path,
                "Unable to process request",
                "Usage (e.g. /scriptures/maxverse?book=genesis&chapter=1 with { \"Content-Type\": \"application/json\" } in the headers"
            ));
        }

        var max = await getBibleChapterMaxVerse(book, chapter);
        res.send({
            book: book,
            chapter: chapter,
            maxVerse: max
        });
    })();
}

exports.citation = (req, res) => {
    (async () => {
        const query = req.params.query;
        var input = query.replace(matchSpaces, "").toLowerCase();
        const booklist = allBooks.map(function (b) {
            return b.book.replace(matchSpaces, "").toLowerCase()
        });

        var citationList = input.split(",");
        var charCount = 0;
        var validation = null;
        var accumulator = [];
        var citationIndex = 0;
        var citationCount = citationList.length;
        for (index in citationList) {
            var citation = citationList[index];
            validation = await citationValidate(citation);
            if (validation.error) {
                res.send(res.status(400).send(errorMessage(
                    400,
                    "Invalid Parameter",
                    req.path,
                    validation.error,
                    "Usage (e.g. /scriptures/genesis1:1-10,john1:1-10) spaces and capitalzation are optional. " +
                    ""
                )));

                return;
            }

            charCount += citation.length + 1;
            var scripture = new bibleScripture();
            scripture.book.value = validation.scripture.book;
            scripture.chapter.value = validation.scripture.chapter;

            var queryString = scripture.getSelectString();
            queryString += ` AND t1.verse_number BETWEEN ${validation.scripture.startVerse} AND ${validation.scripture.endVerse} order by bible_order`;
            dbAccess.query(queryString, (err, result) => {
                if (err) {
                    res.status(500).send(errorMessage.errorMessage(
                        500,
                        "Server Error",
                        req.path,
                        err.message,
                        "Usage (e.g. /scriptures/genesis1:1-10,john1:1-10) spaces and capitalzation are optional. " +
                        ""
                    ));
                }
                else if (result) {
                    for (index in result) {
                        accumulator.push(result[index]);
                    }

                    citationIndex++;
                    if (citationIndex == citationCount) {
                        res.send(accumulator);
                    }
                }
            });
        }
    })();
}



citationValidate = async (citation) => {
    var validation = {};
    var obj = {
        book: null,
        chapter: null,
        startVerse: null,
        endVerse: null
    };

    var match = validVerseExpression.exec(citation);
    if (match && match.length > 1) {
        obj.book = match[1];
    }
    if (match && match.length > 2) {
        obj.chapter = eval(match[2]);
    }
    if (match && match.length > 3) {
        obj.startVerse = eval(match[3]);
    }
    if (match && match.length > 4) {
        obj.endVerse = eval(match[4]);
    }

    var errorText = "";
    var book = null;
    if (!obj.book) {
        validation.error = `Invalid Bible book name, ${citation}`;
        return validation;

    }
    else {
        allBooks.map(function (b) {
            if (b.book.replace(matchSpaces, "").toLowerCase() == obj.book) {
                book = b;
                obj.book = b.book;
            }
        });
    }

    if (!obj.chapter) {
        if (book && book.chapterCount == 1) {
            obj.chapter = 1;
        }
        else {
            validation.error = "Chapter number is missing";
            return validation;
        }
    }
    else {
        if (obj.chapter > book.chapterCount) {
            validation.error = `Invalid Chapter, last chapter is ${book.chapterCount}`;
            return validation;
        }
    }

    var maxVerse;

    if (!obj.startVerse) {
        validation.error = "Verse number is missing";
        return validation;
    }
    else {
        var mv = await getBibleChapterMaxVerse(obj.book, obj.chapter);
        maxVerse = mv;

        if (obj.startVerse < 1 || obj.startVerse > maxVerse) {
            validation.error = `Verse number: ${obj.startVerse} is not in ${obj.book} chapter ${obj.chapter}`;
            return validation;
        }
    }

    if (obj.endVerse) {
        if (obj.endVerse < obj.startVerse) {
            validation.error = "Ending verse cannot come before the start verse";
            return validation;
        }
        else if (obj.endVerse > maxVerse) {
            validation.error = `Ending verse number: ${obj.endVerse} is not in ${obj.book} chapter ${obj.chapter}`;
            return validation;
        }
    }
    else {
        obj.endVerse = obj.startVerse;
    }

    validation.scripture = obj;
    return validation;
}


exports.scriptureLike = (req, res) => {

    var query;
    var page = 1;
    if (req.params && req.params.query) {
        query = req.params.query;
    }

    if (req.params && req.params.page) {
        page = req.params.page;
    }

    if (!query && req.body) {
        query = req.body;
        query = query.query;

        if (query.page) {
            page = query.page;
        }
    }

    if (!query) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Unable to process request",
            "Usage (e.g. /scriptures/like  with { \"query\": \"%abraham\"% } in the body and { \"Content-Type\": \"application/json\" } in the headers" +
            "Question mark (?) is placeholder for one character, percent is placeholder for multiple characters. See also /scripture/contains."
        ));
    }
    else {
        scripture = new bibleScripture;
        scripture.text.value = query;
        var offset = (page - 1) * 400;
        var selectString = scripture
            .getSelectString()
            .replace(`WHERE t1.text = '${query.replace("'", "''")}'`, `WHERE t1.text LIKE '%${query.replace("'", "''")}%'`)
            + ` ORDER BY bible_order LIMIT 401 OFFSET ${offset}`;
        dbAccess.query(selectString, (err, result) => {
            if (err) {
                res.send(errorMessage(
                    500,
                    "Server Error",
                    `/scriptures/like  [${query}]`,
                    err.message,
                    ""
                ));
            }
            else {
                if (result.length == 401) {
                    result[400].id = -1;
                    result[400].book = null;
                    result[400].chapter = null;
                    result[400].verse = null;
                    result[400].text = null;
                    result[400].bibleOrder = null;
                }

                res.send(result);
            }
        });
    }
}

exports.scriptureContains = (req, res) => {
    var query;
    var page = 1;

    if (req.params && req.params.query) {
        query = req.params.query;
    }

    if (req.params && req.params.page) {
        page = req.params.page;
    }

    if (!query && req.body) {
        query = req.body;
        query = query.query;

        if (query.page) {
            page = query.page;
        }
    }

    if (!query) {
        res.status(400).send(errorMessage(
            400,
            "Invalid Parameter",
            req.path,
            "Unable to process request",
            "Usage (e.g. /scriptures/contains  with { \"query\": \"(abraham|abram)\" } in the body and { \"Content-Type\": \"application/json\" } in the headers" +
            "Query contains a regex expression."
        ));
    }
    else {
        scripture = new bibleScripture;
        scripture.text.value = query;
        var offset = (page - 1) * 400;
        var selectString = scripture
            .getSelectString()
            .replace(`WHERE t1.text = '${query.replace("'", "''")}'`, `WHERE t1.text REGEXP '.*${query.replace("'", "''")}.*'`)
            + ` ORDER BY bible_order LIMIT 401 OFFSET ${offset}`;
        dbAccess.query(selectString, (err, result) => {
            console.log(selectString);
            if (err) {
                res.send(errorMessage(
                    500,
                    "Server Error",
                    `/scriptures/contains  [${query}]`,
                    err.message,
                    ""
                ));
            }
            else {
                if (result.length == 401) {
                    result[400].id = -1;
                    result[400].book = null;
                    result[400].chapter = null;
                    result[400].verse = null;
                    result[400].text = null;
                    result[400].bibleOrder = null;
                }

                res.send(result);
            }
        });
    }
}
