const mysql = require("mysql");
const env = require("../config/db.config");

const getConnection = (multi) => {
    connection = mysql.createConnection({
        host: env.HOST,
        port: env.PORT,
        user: env.USER,
        password: env.PASSWORD,
        database: env.DB,
        multipleStatemens: multi
    });

    console.log('Connected to the MySQL server.');

    return connection;
}

const closeConnection = (connection) => {
    connection.end(err => {
        if (err) {
            return console.err(err.message);
        }
    });
}

module.exports = {
    query: (queryString, output) => {
        var connection = getConnection();
        if (connection) {
            console.log(`Query: ${queryString}`);
            connection.query(queryString, (err, result) => {
                if (err) {
                    console.error(err.message);
                    output(err, null);
                }

                if (result) {

                    var string = '[';
                    comma = '';
                    for (index in result) {
                        string += comma + JSON.stringify(result[index]);
                        comma = ',';
                    }

                    string += ']';

                    console.log("Results:");
                    console.log(string);

                    output(null, JSON.parse(string));
                }

                closeConnection(connection);
            });
        }
    },

    //insertObject structure = {
    //    tableName: <table name>,
    //    tableKeyColumn: <column Name>,
    //    tableValues: {
    //        <col1>: <col1 value>,
    //        <col2>: <col2 value>,,,
    //    }
    //}

    insert: (insertObject, output) => {
        console.log(`Insert ${insertObject}`);
        var connection = getConnection(true);
        if (connection) {
            var insertString = `INSERT INTO ${insertObject.tableName} (`;
            var values = " VALUES (";
            var comma = "";
            for (var col in insertObject.tableValues) {
                if (col != tableKeyColumn) {
                    insertString = `${insertString}${comma}${col}`;
                    values = `${values}${comma}${insertObject.tableValues[col]}`;
                    comma = ", ";
                }

                insertString = `${insertString}) ${values});`
            }

            var queryString = "SELECT";
            comma = "";
            for (var col in insertObject.tableValues) {
                queryString = `${queryString}${comma} ${col}`;
                comma = ",";
            }

            queryString = `${queryString} FROM ${insertObject.tableName} WHERE ${tableKeyColumn}=LAST_INSERT_ID();`

            console.log(insertString);
            console.log(queryString);
        }
    }
}