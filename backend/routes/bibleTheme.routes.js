module.exports = app => {
    const bibleTheme = require("../controllers/bibleTheme.controller");
    var router = require("express").Router();

    router.get("/:id", bibleTheme.listOne);
    router.get(/path=(?:\/?[^\/]*?)+\/?/, bibleTheme.listOne);
    router.get("/", bibleTheme.listAll);
    router.get("/chain/:id", bibleTheme.chain);
    router.post("/", bibleTheme.create);
    router.put("/", bibleTheme.edit);
    router.put("/:id/sequence/:sequence", bibleTheme.setSequence);
    router.put("/resequence-themes/:id", bibleTheme.resequenceThemes);
    router.put("/normalize-themes/:id", bibleTheme.normalizeThemes);
    router.put("/resequence-citations/:id", bibleTheme.resequenceThemes);
    router.put("/normalize-citations/:id", bibleTheme.normalizeCitations);
    router.delete("/:id", bibleTheme.delete);

    app.use("/themes", router);
    //app.use("/themes/chain", router);
    //app.use("/theme/scripture", router);
    //app.use("/theme/scripture/path", router);
};