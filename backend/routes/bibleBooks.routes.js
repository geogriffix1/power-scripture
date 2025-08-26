module.exports = app => {
    const bibleBooks = require("../controllers/bibleBooks.controller");
    var router = require("express").Router();

    router.get("/:id", bibleBooks.findOne);
    //router.post("/", bibleBooks.create);
    router.get("/", bibleBooks.findAll);
    //router.get("/published", bibleBooks.findAllPublished);
    //router.put("/:id", bibleBooks.update);
    //router.delete("/:id", bibleBooks.delete);
    //router.delete("/", bibleBooks.deleteAll);

    app.use("/bibleBooks", router);
};