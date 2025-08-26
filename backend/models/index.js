//const dbConfig = require("../config/db.config.js");

//const Sequelize = require("sequelize");
//const sequelize = new Sequelize(dbConfig.DB, dbConfig.USER, dbConfig.PASSWORD, {
//    host: dbConfig.HOST,
//    dialect: dbConfig.dialect,
//    operatorAliases: false,
//    pool: {
//        max: dbConfig.pool.max,
//        min: dbConfig.pool.min,
//        acquire: dbConfig.pool.acquire,
//        idle: dbConfig.pool.idle
//    }
//});

//const bibleBooksModel = require("./bibleBooks.model.js");
//const bibleScriptureModel = require("./bibleScripture.model.js");

//const db = {};
//db.Sequelize = Sequelize;
//db.sequelize = sequelize;
//db.bibleBooks = bibleBooksModel(sequelize, Sequelize);
//db.bibleScripture = bibleScriptureModel(sequelize, Sequelize);

//module.exports = db;