const mysql = require("mysql");
const env = require("../config/db.config");

//-------------------------
// Connection Pool
//-------------------------
const pool = mysql.createPool({
    connectionLimit: 10, // adjust as needed
    host: env.HOST,
    port: env.PORT,
    user: env.USER,
    password: env.PASSWORD,
    database: env.DB,
    multipleStatements: true
});

//-------------------------
// Core query executor
//-------------------------
const runQuery = (sqlString) => {
    return new Promise((resolve, reject) => {
        pool.query(sqlString, (err, result) => {
            if (err) {
                console.error("MySQL Error:", err.message);
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

//-------------------------
// Exported API
//-------------------------
module.exports = {
    query: async (queryString, output) => {
        try {
            const result = await runQuery(queryString);
            output(null, result);
        } catch (err) {
            output(err, null);
        }
    },

    insert: async (insertString, output) => {
        try {
            const result = await runQuery(insertString);
            output(null, result);
        } catch (err) {
            output(err, null);
        }
    },

    update: async (updateString, output) => {
        try {
            const result = await runQuery(updateString);
            output(null, result);
        } catch (err) {
            output(err, null);
        }
    },

    delete: async (deleteString, output) => {
        try {
            const result = await runQuery(deleteString);
            output(null, result);
        } catch (err) {
            output(err, null);
        }
    },

    execute: async (sqlString, output) => {
        try {
            const result = await runQuery(sqlString);
            output(null, result);
        } catch (err) {
            output(err, null);
        }
    }
};
