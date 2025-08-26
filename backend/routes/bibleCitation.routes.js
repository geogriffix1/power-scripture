module.exports = app => {
    const bibleCitation = require("../controllers/bibleCitation.controller");
    var router = require("express").Router();

    router.get("/:id", bibleCitation.listOne);
    router.get("/:id/full", bibleCitation.listOne);
    router.get("/page=\d+/", bibleCitation.listAll);
    router.get("/", bibleCitation.listAll);
    //router.get(/path=(?:\/?[^\/]*?)+\/?/, bibleCitation.listOne);
    router.post("/", bibleCitation.create);
    router.put("/", bibleCitation.update);
    //router.delete("/:citationId/themeToCitation/:themeToCitationId")  // deletes theme to citation link
    //router.delete("/:id/verse/:id2")
    //router.post("/:id/verses", bibleCitationVerse.create);

    app.use("/citations", router);
};