module.exports = app => {
    const bibleScripture = require("../controllers/bibleScripture.controller");
    var router = require("express").Router();

    router.get("/:query", bibleScripture.citation);
    router.get("/contains/:query", bibleScripture.scriptureContains);
    router.get("/contains/:query/:page", bibleScripture.scriptureContains);
    router.get("/maxverse/book/:book/chapter/:chapter", bibleScripture.maxVerse);
    router.get("/like/:query", bibleScripture.scriptureLike);
    router.post("/like", bibleScripture.scriptureLike);
    router.post("/contains", bibleScripture.scriptureContains);

    app.use("/scriptures", router);
};