const dbConnection = require("../db/databaseConnection")
const service = {};

service.list = async function () {
    return new Promise(resolve => {
        dbConnection.query("SELECT * FROM propiedad", (error, result) => {
            if (error) {
                resolve(0)
                console.log(error)
            } else {
                resolve(result)
            }
        });
    })
}

service.save = function () {
    return new Promise(resolve => {
        dbConnection.query("INSERT INTO table_name (column1, column2, column3, ...) VALUES (value1, value2, value3, ...)", (error, result, fields) => {
            if (error) {
                resolve(0)
                console.log(error)
            } else {
                resolve(result)
            }
        });
    })
}

service.select = function () {
    return new Promise(resolve => {
        dbConnection.query("SELECT column1, column2, ... FROM table_name WHERE condition", (error, result, fields) => {
            if (error) {
                resolve(0)
                console.log(error)
            } else {
                resolve(result)
            }
        });
    })
}

service.update = function () {
    return new Promise(resolve => {
        dbConnection.query("UPDATE table_name SET column1 = value1, column2 = value2, ... WHERE condition", (error, result, fields) => {
            try {
                return result
            } catch (error) {
                throw error
            }
        });
    })
}
service.delete = function () {
    return new Promise(resolve => {
        dbConnection.query("DELETE FROM table_name WHERE condition", (error, result, fields) => {
            try {
                return result
            } catch (error) {
                throw error
            }
        });
    })
}

module.exports = service