const debug = require('debug')("George's Power Scripture Web Services");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const refreshThemePaths = require("./appHelpers/refreshThemePaths");

global.verseValidation = require("./models/validation");

var app = express();

var corsOptions = {
    //origin: "http://localhost:8081"
    origin: "http://localhost:4200"
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => {
    res.json({ message: "Welcome to George's Power Scripture Web Service API" });
});

require("./routes/bibleBooks.routes")(app);
require("./routes/bibleScripture.routes")(app);
require("./routes/bibleTheme.routes")(app);
require("./routes/bibleCitation.routes")(app);
require("./routes/bibleThemeToCitation.routes")(app);
require("./routes/bibleCitationVerse.routes")(app);
require("./routes/bibleCitationMarkup.routes")(app);
require("./routes/publisher.routes")(app);

refreshThemePaths();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});
