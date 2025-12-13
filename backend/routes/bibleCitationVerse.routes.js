module.exports = app => {
    const bibleCitationVerse = require("../controllers/bibleCitationVerse.controller");
    var router = require("express").Router();

    router.get("/:id", bibleCitationVerse.listOne);
    router.get("/:id/full", bibleCitationVerse.listOne);
    router.get("/", bibleCitationVerse.listAll);
    router.get("/citation/:id", bibleCitationVerse.citationId);
    router.get("/citation/:id/scriptures/:array", bibleCitationVerse.listByCitationAndScriptures);
    router.post("/", bibleCitationVerse.create);
    router.post("/citation/:id/scriptures", bibleCitationVerse.addToCitation);
    router.put("/", bibleCitationVerse.edit);
    router.delete("/:id", bibleCitationVerse.delete);

    app.use("/verses", router);
};