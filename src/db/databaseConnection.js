const mysql = require("mysql")

const dbConnection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    port: "3306",
    database: "inmobiliaria"
});

dbConnection.connect(error => {
    if (error) {
        console.log(error);
    } else {
        console.log("Database Connected Successfully");
    }
})

module.exports = dbConnection