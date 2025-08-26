module.exports = app => {
    const publisher = require("../controllers/publisher.controller");
    var router = require("express").Router();

    router.get("/themes/:id", publisher.listTheme);
    router.get("/citations/:id", publisher.listCitation);

    app.use("/publisher", router);
}