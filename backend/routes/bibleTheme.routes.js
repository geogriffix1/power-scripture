module.exports = app => {
    const bibleTheme = require("../controllers/bibleTheme.controller");
    var router = require("express").Router();

    router.get("/:id(\\d+)", bibleTheme.listOne);
    router.get(/path=.+/, bibleTheme.listOne);
    router.get("/", bibleTheme.listAll);
    router.get("/:id(\\d+)/chain/", bibleTheme.chain);
    router.get("/:id(\\d+)/cascade", bibleTheme.cascade);
    router.get("/:id(\\d+)/remarks", bibleTheme.getRemarks);
    router.post("/", bibleTheme.create);
    router.post("/:id(\\d+)/remarks", bibleTheme.saveRemarks);
    router.put("/", bibleTheme.edit);
    router.put("/paste-theme/:copyId(\\d+)/:pasteId(\\d+)", bibleTheme.pasteTheme);
    router.put("/paste-themeToCitation/:copyId(\\d+)/:pasteId(\\d+)", bibleTheme.pasteThemeToCitation);
    router.put("/:id/sequence/:sequence", bibleTheme.setSequence);
    router.put("/resequence-themes/:id", bibleTheme.resequenceThemes);
    router.put("/normalize-themes/:id", bibleTheme.normalizeThemes);
    router.put("/resequence-citations/:id", bibleTheme.resequenceThemes);
    router.put("/normalize-citations/:id", bibleTheme.normalizeCitations);
    router.delete("/:id", bibleTheme.delete);
    router.delete("/:id/remarks", bibleTheme.deleteRemarks);

    app.use("/themes", router);
};