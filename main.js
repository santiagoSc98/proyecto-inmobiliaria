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

    let tipo = req.body.tipo;
    let nombre = req.body.nombre;
    let telefono = req.body.telefono;
    let descripcion = req.body.descripcion;
    let direccion = req.body.direccion;
    let email = req.body.email;
    let dni = req.body.dni;
    let pass = req.body.pass;

    con.query("INSERT INTO ente (id_tipoente,nombre,telefono,descripcion,direccion,email,documentoidentificador,pass) VALUES ('" + tipo + "','" + nombre + "','" + telefono + "','" + descripcion + "','" + direccion + "','" + email + "','" + dni + "','" + pass + "') ;", function (err, result) {
        if (err) throw err;
        console.log("Result: ", result);
    });

    res.send("register correcto")
})

var sessionLog = []

app.post('/login', function (req, res) {

    let email = req.body.email;
    let pass = req.body.pass;

    if (email && pass) {

        con.query('SELECT * FROM ente WHERE email = ? AND pass = ?', [email, pass], function (err, result) {

            if (err) throw err;

            if (result.length > 0) {
                sessionLog["id" + result[0].id_ente] = {}
                sessionLog["id" + result[0].id_ente].logged = true
                console.log("sesion", sessionLog);
                res.send("login correcto");
            } else {
                res.send('Email o contraseña incorrecta!');
            }
            res.end();
        });

    } else {
        res.send('Rellene los campoos!');
        res.end();
    }
});



app.use(express.static(__dirname + '/html'))

app.get('/home', function (req, res) {
    // console.log("holsaas home")
    res.sendFile(__dirname + '/html/index.html')
})

app.get('/home', function (req, res) {
    res.sendFile(__dirname + '/html/index.html')
})

app.listen(PORT, function () {
    console.log(`App is running on port: ${PORT}`);
})