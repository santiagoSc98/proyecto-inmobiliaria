const express = require("express");
const bodyParser = require("body-parser")
const app = express()
let PORT = process.env.PORT || 3000;

const http = require("http").createServer(app)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/html'))
var mysql = require('mysql');

var con = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "inmobiliaria"
});

con.connect(function (err) {
    if (err) throw err;
    console.log("Connected!");
});

app.get("/ente", function (req, resp) {
    console.log("Get Ente ")
    con.query("SELECT * FROM ente;", function (err, result) {
        if (err) throw err;
        console.log("Result: " + result);
    });
})

app.post('/register', function (req, res) {
    console.log(req.body.tipoEnte);
    con.query("INSERT INTO ente (id_tipoente,nombre,telefono,descripcion,direccion,email,documentoidentificador,pass) VALUES ('" + req.body.tipoEnte + "','" + req.body.nombre + "','" + req.body.telefono + "','el bicho','" + req.body.direccion + "','" + req.body.email + "','" + req.body.dni + "','" + req.body.pass + "') ;", function (err, result) {
        if (err) throw err;
        console.log("Result: ", result);
    });

    res.send("register correcto")
})


app.get('/home', function (req, res) {
    res.sendFile(__dirname + '/html/index.html')
})

app.listen(PORT, function () {
    console.log(`App is running on port: ${PORT}`);
})