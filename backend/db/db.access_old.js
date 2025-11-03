const mysql = require("mysql");
const env = require("../config/db.config");
const attr = require("../models/dbAttributes");

const getConnection = (multi) => {
    connection = mysql.createConnection({
        host: env.HOST,
        port: env.PORT,
        user: env.USER,
        password: env.PASSWORD,
        database: env.DB,
        multipleStatemens: multi ? true : false
    });

    console.log('Connected to the MySQL server.');

    return connection;
}

const closeConnection = (connection) => {
    connection.end(err => {
        if (err) {
            return console.error(err.message);
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

    insert: (insertString, output) => {
        var connection = getConnection();
        if (connection) {
            console.log(insertString);
            connection.query(insertString, (err, result) => {
                if (err) {
                    output(err, null);
                }
                else {
                    output(null, result);
                }

                closeConnection(connection);
            });
        }
    },

    update: (updateString, output) => {
        var connection = getConnection();
        console.log(updateString);
        if (connection) {
            connection.query(updateString, (err, result) => {
                if (err) {
                    output(err, null);
                }
                else {
                    output(null, result);
                }
            });
        }
    },

    delete: (deleteString, output) => {
        var connection = getConnection(true);
        console.log(deleteString);
        if (connection) {
            deleteQuery = () => {
                return new Promise((resolve, reject) => {
                    connection.query(deleteString, (err, result) => {
                        if (err) {
                            output(err, null);
                            reject(err);
                        }
                        else {
                            output(null, result);
                            resolve(result);
                        }

                        closeConnection(connection);
                    });
                });
            }

            deleteQuery().then();
        }
    },

    execute: (sqlString, output) => {
        var connection = getConnection(true);
        console.log(sqlString);
        if (connection) {
            executeSql = () => {
                return new Promise((resolve, reject) => {
                    connection.query(sqlString, (err, result) => {
                        if (err) {
                            output(err, null);
                            reject(err);
                        }
                        else {
                            output(null, result);
                            resolve(result);
                        }

                        closeConnection(connection);
                    });
                });
            }

            executeSql().then();
        }
    }
}