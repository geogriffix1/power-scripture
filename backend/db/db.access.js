const mysql = require("mysql2");
const env = require("../config/db.config");

//-------------------------
// Connection Pool
//-------------------------
const pool = mysql.createPool({
    connectionLimit: 10, // adjust as needed
    host: env.host,
    port: env.port,
    user: env.user,
    password: env.password,
    database: env.db,
    multipleStatements: true
});

pool.query("SELECT DATABASE() AS db, CURRENT_USER() AS user", (err, rows) => {
  if (err) return console.error(err);
  console.log("DB/user:", `${rows[0].db}/${rows[0].user}`);
});

pool.query(
  "SHOW VARIABLES WHERE Variable_name IN ('hostname','port')",
  (err, rows) => {
    if (err) return console.error(err);
    rows.forEach(row => console.log(`${row.Variable_name}: ${row.Value}`));
  }
);

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
    },

    executeWithConnection: async (handler) => {
        pool.getConnection((err, conn) => {
            if (err) return handler(err);

            const done = () => conn.release();
            handler(null, conn, done);
        });
    }
}
