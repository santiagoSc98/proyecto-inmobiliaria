const express = require("express");
const bodyParser = require("body-parser")
// const res = require("express/lib/response");
const app = express()
let PORT = process.env.PORT || 3000;

const http = require("http").createServer(app)

app.use(bodyParser.urlencoded({extended:true}));

var mysql = require('mysql');

var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "santycampu",
  database: "inmobiliaria"
});

con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
  });

function consult(){
    console.log("hoals ")
    con.query("SELECT * FROM usuario;", function(err, result) {
        if (err) throw err;
        console.log("Result: " + result);
      });
}

 app.get('/', function (req, res) {
    // consult()
    res.send("consulta realizada /")
})

app.post('/register', function (req, res) {
    con.query("INSERT INTO ente (id_tipoente,nombre,telefono,descripcion,direccion,email,documentoidentificador,pass) VALUES (1,'"+ req.body.nombre +"','"+ req.body.telefono +"','el bicho','"+ req.body.direccion +"','"+ req.body.email +"','"+ req.body.dni +"','"+ req.body.pass+"') ;", function(err, result) {
        if (err) throw err;
        console.log("Result: " , result);
      });
    
    res.send("register correcto")
})

app.use(express.static(__dirname + '/html'))

app.get('/home', function(req, res){
    console.log("holsaas home")
    res.sendFile(__dirname+'/html/index.html')
})

app.get('/insert', function(req, res)  {
    insertUser()
    res.send("insert")
})

app.listen(PORT, function(){
    console.log(`App is running on port: ${PORT}`);
})