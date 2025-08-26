'use strict';

var mysql = require('mysql');

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "geogriffixMysql",
    database: "bible_concordance"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
    con.query("SELECT * FROM bible_books", function (err, result) {
        if (err) throw err;
        console.log(result);
    });
});