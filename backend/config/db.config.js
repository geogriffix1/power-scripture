module.exports = {
    HOST: "localhost",
    USER: "root",
    PASSWORD: "geogriffixMysql",
    DB: "power_scripture_test",
    dialect: "mysql",
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
};