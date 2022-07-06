const dbConnection = require("../db/databaseConnection")
const service = {};

service.list = function () {
    return dbConnection.query("Select * from propiedad", (error, result, fields) => {
        try {
            return result
        } catch (error) {
            throw error
        }
    });
}

service.save = function () {
    return dbConnection.query("INSERT INTO table_name (column1, column2, column3, ...) VALUES (value1, value2, value3, ...)", (error, result, fields) => {
        try {
            return result
        } catch (error) {
            throw error
        }
    });
}

service.select = function () {
    return dbConnection.query("SELECT column1, column2, ... FROM table_name WHERE condition", (error, result, fields) => {
        try {
            return result
        } catch (error) {
            throw error
        }
    });
}

service.update = function () {
    return dbConnection.query("UPDATE table_name SET column1 = value1, column2 = value2, ... WHERE condition", (error, result, fields) => {
        try {
            return result
        } catch (error) {
            throw error
        }
    });
}
service.delete = function () {
    return dbConnection.query("DELETE FROM table_name WHERE condition", (error, result, fields) => {
        try {
            return result
        } catch (error) {
            throw error
        }
    });
}

module.exports = service