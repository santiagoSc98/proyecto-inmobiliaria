const express = require("express");
const bodyParser = require("body-parser")
const app = express()
let PORT = process.env.PORT || 3000;
const CryptoJS = require("crypto-js");

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

app.post('/register', function (req, res) {

    let tipo =  req.body.tipo;
    let nombre =  req.body.nombre;
    let telefono =  req.body.telefono;
    let descripcion =  req.body.descripcion;
    let direccion = req.body.direccion;
    let email = req.body.email;
    let dni = req.body.dni;
    let pass = req.body.pass;

    var token = CryptoJS.MD5(email + Date.now()).toString();

  	con.query('SELECT email FROM ente WHERE email = ? ', [email], function(err, result0) {
      
      if(err == null){
        if(result0.length > 0){
          // Existe un usario con email igual
          res.send([{"status":0,"mensaje":"Usuario ya existe"}]);

        } else{
          con.query("INSERT INTO ente (id_tipoente,nombre,telefono,descripcion,direccion,email,documentoidentificador,pass,token) VALUES ('"+ tipo +"','"+ nombre +"',0,'','','"+ email +"','','"+ pass +"','"+ token +"') ;", function(err, result1) {
            if(err!= null){
              console.log("error en base",err)
            } else{
              console.log("actualizado correctamente",token)
            }
          });
          res.send([{"status":200,"token":token}]);
        }
      }
    });
})

var sessionLog = []

app.post('/login', function(req, res) {

	let email = req.body.email;
	let pass = req.body.pass;

	if (email && pass) {
	
		con.query('SELECT * FROM ente WHERE email = ? AND pass = ?', [email, pass], function(err, result) {
			
			if (err) throw err;

			if (result.length > 0) {

        var token = CryptoJS.MD5(email + Date.now()).toString();

        con.query('UPDATE ente SET token = ? WHERE id_ente = ?', [token, result[0].id_ente], function(err, result) {

          if(err!= null){
            console.log("error en base",err)
          }else{
            console.log("actualizado correctamente",token)
          }
        })
			
        sessionLog["id"+token] = {}
        sessionLog["id"+token].logged = true

        console.log ("sesion",sessionLog)

        res.send([{"status":200,"token":token}]);

			} else {
				res.send([{"status":0}]);
			}			
			res.end();
		});
	} else {
		res.send([{"status":0,"mensaje":"Rellene los campos"}]);
		res.end();
	}
});

app.post('/listado', function(req,res){

  let token = req.body.token;

  if(sessionLog["id" + token]!= null){
    res.send("logeado");

  } else {
    con.query("SELECT * FROM ente WHERE token = ?;", [token],function(err,result){
      if(result.length > 0){

        sessionLog["id"+token] = {}
        sessionLog["id"+token].logged = true

        console.log ("sesion",sessionLog)

        res.send("logeado")

      } else {
        res.send("no logeado");
      }
    })
  }
})

app.use(express.static(__dirname + '/html'))

app.get('/home', function(req, res){
    // console.log("holsaas home")
    res.sendFile(__dirname+'/html/indexx.html')
})

app.get('/insert', function(req, res)  {
    insertUser()
    res.send("insert")
})

app.listen(PORT, function(){
    console.log(`App is running on port: ${PORT}`);
})