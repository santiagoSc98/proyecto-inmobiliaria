const express = require("express");
const bodyParser = require("body-parser");
const app = express();
let PORT = process.env.PORT || 3000;
const CryptoJS = require("crypto-js");
const fs = require("fs");
const path = require("path");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "html/views"));
app.use(express.static(__dirname + "/html"));
app.use(express.static(__dirname + "/file"));
app.use(bodyParser.urlencoded({ extended: true }));
const fileUpload = require("express-fileupload");
app.use(fileUpload());

var mysql = require("mysql");
const { connect } = require("http2");
const { resolve } = require("path");

var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "root",
  password: "santycampu",
  database: "inmobiliaria",
});

var sessionLog = [];

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
});
 
function managesesion (result,token){
	if (sessionLog["id" + token] == null) {

		sessionLog["id" + token] = {};
	}
	
	sessionLog["id" + token].logged = true;
	sessionLog["id" + token].id_usuario = result[0].id_usuario;
	sessionLog["id" + token].nombre = result[0].nombre;
	sessionLog["id" + token].email = result[0].email;
}

function obtenerpropiedades(_limit,id_usuario = null, estado= null){
	return new Promise ( resolve => { 
	var limit = "";

	if( typeof _limit == "undefined"){
		_limit == null
	}

	var filtrousuario = ""

	if(id_usuario != null){
		if (estado == null) {
			filtrousuario = " WHERE id_usuario = " + id_usuario
		} else {
			filtrousuario = " AND id_usuario = " + id_usuario
		}
	}
	var filtroestado = ""

	if(estado != null){
		filtroestado = " WHERE estado = " + estado
	}

	if (_limit != null) {
	  limit = " LIMIT " + _limit;
	}
		con.query(
		"SELECT propiedad.*,tipopropiedad.descripcion as dcp,(SELECT ruta FROM multimedia WHERE multimedia.id_propiedad = propiedad.id_propiedad)AS img FROM propiedad INNER JOIN tipopropiedad ON propiedad.id_tipopropiedad = tipopropiedad.id_tipopropiedad "+ filtroestado + filtrousuario +
			limit,
		function (err, result) {
			if (err != null) {
			console.log(err);
				resolve(0)
			} else {
			resolve(result)
			}
		});
	})
}

app.post("/register", function (req, res) {
  let tipo = req.body.tipo;
  let nombre = req.body.nombre;
  let telefono = req.body.telefono;
  let descripcion = req.body.descripcion;
  let direccion = req.body.direccion;
  let email = req.body.email;
  let dni = req.body.dni;
  let pass = req.body.pass;

  var token = CryptoJS.MD5(email + Date.now()).toString();

  con.query(
    "SELECT * FROM usuario WHERE email = ? ",
    [email],
    function (err, result0) {
      if (err == null) {
        if (result0.length > 0) {
          // Existe un usario con email igual
          res.send([{ status: 0, mensaje: "Usuario ya existe" }]);
        } else {
          con.query(
            "INSERT INTO usuario (id_tipousuario,nombre,telefono,descripcion,direccion,email,documentoidentificador,pass,token) VALUES ('" +
              tipo +
              "','" +
              nombre +
              "',0,'','','" +
              email +
              "','','" +
              pass +
              "','" +
              token +
              "') ;",
            function (err, result1) {
              if (err != null) {
                console.log("error en base", err);
              } else {
                console.log("actualizado correctamente", token);
              }

              var tmpar0 = []
              tmpar0[0] = {}
              tmpar0[0].id_usuario = result1.insertId
              tmpar0[0].nombre = nombre
              tmpar0[0].email = email
              console.log("tmpar0",tmpar0)

			  
			        managesesion(tmpar0,token);
            }
          );
          res.send([{ status: 200, token: token }]);
        }
      }
    }
  );
});

app.post("/logout", function (req, res) {
  let token = req.body.token;

  if (sessionLog["id" + token] == null) {
    res.send("Usuario no logueado");
  } else {
    sessionLog.splice("id" + token, 1);
  }
  res.send({ status: 200 });
});

app.post("/login", function (req, res) {
  let email = req.body.email;
  let pass = req.body.pass;

  if (email && pass) {
    con.query(
      "SELECT * FROM usuario WHERE email = ? AND pass = ?",
      [email, pass],
      function (err, result) {
        if (err) throw err;

        if (result.length > 0) {
          var token = CryptoJS.MD5(email + Date.now()).toString();

          con.query(
            "UPDATE usuario SET token = ? WHERE id_usuario = ?",
            [token, result[0].id_usuario],
            function (err, result) {
              if (err != null) {
                console.log("error en base", err);
              } else {
                console.log("actualizado correctamente", token);
              }
            }
          );
		  managesesion(result,token);


          res.send([{ status: 200, token: token }]);
        } else {
          res.send([{ status: 0 }]);
        }
        res.end();
      }
    );
  } else {
    res.send([{ status: 0, mensaje: "Rellene los campos" }]);
    res.end();
  }
});

app.post("/loginwtoken", function (req, res) {
  let token = req.body.token;

  if (sessionLog["id" + token] != null) {
    res.send({"Usrname":sessionLog["id" + token].nombre});

  } else {
    con.query(
      "SELECT * FROM usuario WHERE token = ?;",
      [token],
      function (err, result) {
        if (result.length > 0) {
		managesesion(result,token);
          res.send({"Usrname":result[0].nombre});

        } else {
          res.send("no logeado");
        }
      }
    );
  }
});

app.post("/newpropiedad", function (req, res) {
  let token = req.body.token;
  let descripcion = req.body.descripcion;
  let direccion = req.body.direccion;
  let ciudad = req.body.ciudad;
  let departamento = req.body.departamento;
  let precio = req.body.precio;
  let nombre = req.body.nombre;
  let superficieM2 = req.body.superficieM2;
  let nrohabitaciones = req.body.nrohabitaciones;
  let nrobanos = req.body.nrobanos;
  let nrogarage = req.body.nrogarage;
  let tipo = req.body.tipo;
  let tpublicacion = req.body.tpublicacion;
  console.log("hola token",token);
  if (sessionLog["id" + token] != null) {
    console.log("existe en el sesionlog",sessionLog['id' + token].id_usuario);

    con.query(
      "INSERT INTO propiedad (descripcion,lon,lat,direccion,ciudad,departamento,precio,id_tipopropiedad,id_usuario,tipo_publicacion,nombre,superficieM2,nrohabitaciones,nrobaños,nrogarage) VALUES (?,0,0,?,?,?,?,?,?,?,?,?,?,?,?)",
      [
        descripcion,
        direccion,
        ciudad,
        departamento,
        precio,
        tipo,
        sessionLog["id" + token].id_usuario,
        tpublicacion,
        nombre,
        superficieM2,
        nrohabitaciones,
        nrobanos,
        nrogarage,
      ],
      function (err, result) {
        if (err != null) {
          console.log("olas", err);
          res.send({ status: 0 });
        } else {
          // Try para ver si existe la carpeta del usuario

          try {
            var files = fs.readFileSync(
              "file/Usr" + sessionLog["id" + token].id_usuario
            );
          } catch (err) {
            if (err.code === "ENOENT") {
              console.log("No existe la carperta");
              fs.mkdirSync("file/Usr" + sessionLog["id" + token].id_usuario);
            }
          }

          // Guardar archivo recibido por Ajax

          let EDFile = req.files.file;
          var filerute = `./file/Usr${sessionLog["id" + token].id_usuario}/${
            EDFile.name
          }`;
          var id_propiedad = result.insertId;

          EDFile.mv(filerute, (err) => {
            if (err) {
              console.log("error al guardar el archivo", err);
              res.status(0);
            } else {
              con.query(
                "INSERT INTO multimedia (id_propiedad,tipo,ruta) VALUES (?,?,?)",
                [id_propiedad, "img", filerute],
                function (err1, result1) {
                  if (err1 != null) {
                    console.log("error en base de dato", err1);
                  } else {
                    console.log("Almacenado ruta en base");
                  }
                }
              );
              console.log("se guardo el archivo");
            }
          });
          res.status(200);
          res.redirect("/home");
        }
      }
    );
  } else {
    console.log("este pendejo no tiene sesion");
    
  }
});

app.get("/file/:Usr/:file", function (req, res) {
  var ruta = req.params.Usr;
  var rute = req.params.file;
  res.sendFile(__dirname + "/file/" + ruta + "/" + rute);
});

app.post("/changepropiedadestatus",function(req,res){
  var token = req.body.token;

  if (sessionLog["id" + token] != null) {
    con.query(
      "UPDATE propiedad SET estado = ? WHERE id_propiedad = ?",
      [req.body.estado, req.body.id_propiedad],
      function (err, result) {
        if (err != null) {
        console.log("error",err)
        res.send({"status":0,"mensaje":err})
        } else {
        console.log("salio bien")
        res.send({"status":200})
        }
      }
    );
  }
})

app.get("/home", async function (req, res) {

	var result = await obtenerpropiedades(req.query.limit,null,1)
	if (result == 0) {

		res.send({ status: 0});
		
	} else {
		res.render("index", {
			rows: result,
		});
	}
});

app.post("/dashboard", async function(req,res){
	
	if (req.body.token == null) {
		res.send({"status":0})
		
	} else {
		var token = req.body.token
		if (sessionLog["id" + token] != null){
			console.log("nombre",sessionLog["id" + token].nombre)
			var resp = await obtenerpropiedades(null,sessionLog["id" + token].id_usuario)
			res.render("dashboard",{
				sessionLog: sessionLog["id" + token],
				propiedades: resp
			})
			
		} else{
			res.send({"status":0})
		}
		console.log("hola",token)
	}
	
})

app.get("/add", function (req, res) {
  res.render(__dirname + "/html/views/add");
});

app.listen(PORT, function () {
  console.log(`App is running on port: ${PORT}`);
});
