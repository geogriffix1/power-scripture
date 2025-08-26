module.exports = app => {
    const bibleCitationVerseMarkup = require("../controllers/bibleCitationVerseMarkup.controller");
    var router = require("express").Router();

    router.get("/:id", bibleCitationVerseMarkup.listOne);
    router.get("/", bibleCitationVerseMarkup.listAll);
    router.post("/", bibleCitationVerseMarkup.create);
    router.put("/", bibleCitationVerseMarkup.edit);
    router.delete("/:id", bibleCitationVerseMarkup.delete);

    app.use("/markups", router);
};