module.exports = app => {
    const bibleCitationMarkup = require("../controllers/bibleCitationMarkup.controller");
    var router = require("express").Router();

    router.get("/:id", bibleCitationMarkup.listOne);
    router.get("/", bibleCitationMarkup.listAll);
    router.post("/", bibleCitationMarkup.create);
    router.put("/", bibleCitationMarkup.edit);
    router.delete("/:id", bibleCitationMarkup.delete);

    app.use("/markups", router);
};