module.exports = app => {
    const bibleTheme = require("../controllers/bibleTheme.controller");
    var router = require("express").Router();

    router.get("/:id", bibleTheme.listOne);
    router.get(/path=(?:\/?[^\/]*?)+\/?/, bibleTheme.listOne);
    router.get("/", bibleTheme.listAll);
    router.get("/chain/:id", bibleTheme.chain);
    router.post("/", bibleTheme.create);
    router.put("/", bibleTheme.edit);
    router.put("/resequence/themes", bibleTheme.resequenceThemes);
    router.put("/resequence/citations", bibleTheme.resequenceThemes);
    router.delete("/:id", bibleTheme.delete);

    app.use("/themes", router);
    //app.use("/themes/chain", router);
    //app.use("/theme/scripture", router);
    //app.use("/theme/scripture/path", router);
};