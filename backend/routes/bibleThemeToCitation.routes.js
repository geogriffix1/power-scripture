module.exports = app => {
    const bibleThemeToCitation = require("../controllers/bibleThemeToCitation.controller");
    var router = require("express").Router();

    router.get("/:id", bibleThemeToCitation.listOne);
    router.get("/:id/full", bibleThemeToCitation.listOne);
    router.get("/themeId=\d+/", bibleThemeToCitation.listAll);
    router.get("/citationId=\d+/", bibleThemeToCitation.listAll);
    router.get("/", bibleThemeToCitation.listAll);
    router.post("/", bibleThemeToCitation.create);
    router.put("/", bibleThemeToCitation.update);
    router.delete("/:id", bibleThemeToCitation.delete);

    app.use("/themeToCitations", router);
};