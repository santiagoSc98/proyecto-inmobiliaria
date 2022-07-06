const mysql = require("mysql")

const dbConnection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    port: "3306",
    database: "inmobiliaria"
});

dbConnection.connect(error => {
    try {
        console.log("Database Connected Successfully");
    } catch (error) {
        throw error
    }
})

module.exports = dbConnection
