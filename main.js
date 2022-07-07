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
const { allowedNodeEnvironmentFlags } = require("process");

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

function managesesion(result, token) {
	if (sessionLog["id" + token] == null) {

		sessionLog["id" + token] = {};
	}

	sessionLog["id" + token].logged = true;
	sessionLog["id" + token].id_usuario = result[0].id_usuario;
	sessionLog["id" + token].nombre = result[0].nombre;
	sessionLog["id" + token].email = result[0].email;
	sessionLog["id" + token].id_tipousuario = result[0].id_tipousuario;
	sessionLog["id" + token].foto = result[0].foto;

}

function obtenerpropiedades(_limit, id_usuario = null, estado = null) {
	return new Promise(resolve => {
		var limit = "";

		if (typeof _limit == "undefined") {
			_limit == null
		}

		var filtrousuario = ""

		if (id_usuario != null) {
		
			filtrousuario = " AND id_usuario = " + id_usuario
		}
		var filtroestado = ""

		if (estado != null) {
			filtroestado = " AND estado = " + estado
		}

		if (_limit != null) {
			limit = " LIMIT " + _limit;
		}
		con.query(
			"SELECT propiedad.*,tipopropiedad.descripcion as dcp,(SELECT ruta FROM multimedia WHERE multimedia.id_propiedad = propiedad.id_propiedad limit 1)AS img FROM propiedad INNER JOIN tipopropiedad ON propiedad.id_tipopropiedad = tipopropiedad.id_tipopropiedad WHERE estado != 2 " + filtroestado + filtrousuario +
			limit,
			function (err, result) {
				if (err != null) {
					console.log(err);
					resolve(0)
				} else {
					resolve(result)
				}
			}
		);
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
							tmpar0[0].foto = "none"
							console.log("tmpar0", tmpar0)


							managesesion(tmpar0, token);
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

					managesesion(result, token);

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
		res.send({ "Usrname": sessionLog["id" + token].nombre });

	} else {
		con.query(
			"SELECT * FROM usuario WHERE token = ?;",
			[token],
			function (err, result) {
				if (result.length > 0) {
					managesesion(result, token);
					res.send({ "Usrname": result[0].nombre });

				} else {
					res.send("no logeado");
				}
			}
		);
	}
});

app.post("/newpropiedad", function (req, res) {
	console.log("Inicio new propiedad")
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
	console.log("holas",token)
	if (sessionLog["id" + token] != null) {
		console.log("existe en el sesionlog", sessionLog['id' + token].id_usuario);

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

					function guardarmultimedia(ff){
						console.log("entro en dad",token)
						var filerute = `./file/Usr${sessionLog["id" + token].id_usuario}/${ff.name}`;
						var id_propiedad = result.insertId;
						ff.mv(filerute, (err) => {
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
					} 

					
					if (req.files == null) {
						console.log("Sin imagen")
					} else {
						if(req.files.filevideo != null){
							if (Array.isArray(req.files.file) == true) {

								req.files.filevideo.forEach(cara => guardarmultimedia(cara))
		
							} else { 
		
								guardarmultimedia(req.files.filevideo)
								
							}
						}
						if(req.files.file != null){
							if (Array.isArray(req.files.file) == true) {

								req.files.file.forEach(cara => guardarmultimedia(cara))
		
							} else { 
		
								guardarmultimedia(req.files.file)
								
							}
						}
						
					}
					
					res.status(200);
					res.redirect("/dashboard");
				}
			}
		);
	} else {
		res.send({ "status": 0 })
		console.log("este pendejo no tiene sesion",req.body);

	}
});

app.get("/file/:Usr/:file", function (req, res) {
	var ruta = req.params.Usr;
	var rute = req.params.file;
	res.sendFile(__dirname + "/file/" + ruta + "/" + rute);
});

app.post("/changepropiedadestatus", function (req, res) {
	var token = req.body.token;

	if (sessionLog["id" + token] != null) {
		con.query(
			"UPDATE propiedad SET estado = ? WHERE id_propiedad = ?",
			[req.body.estado, req.body.id_propiedad],
			function (err, result) {
				if (err != null) {
					console.log("error", err)
					res.send({ "status": 0, "mensaje": err })
				} else {
					console.log("salio bien")
					res.send({ "status": 200 })
				}
			}
		);
	}
})

app.get("/home", async function (req, res) {

	var result = await obtenerpropiedades(6, null, 1)
	if (result == 0) {

		res.send({ status: 0 });

	} else {
		res.render("index", {
			rows: result,
		});
	}
});

app.get("/dashboard", async function (req, res) {

			res.render("dashboard", {
				sessionLog: null,
				propiedades:null
			})
	
})

app.post("/dashboard", async function (req, res) {

	var token = req.body.token
	if (sessionLog["id" + token] != null) {
		
		var resp = await obtenerpropiedades(null, sessionLog["id" + token].id_usuario)
		res.render("dashboard", {
			sessionLog: sessionLog["id" + token],
			propiedades: resp
		})

	} else {
		res.send({ "status": 0 })
	}

})

app.post("/editarpropiedad",function(req,res){
	
	console.log("id",req.body.token)

	function guardarmultimedia(ff,req){
	var	token = req.body.token 
		console.log("entro en guardar multimedia",token)
		var filerute = `./file/Usr${sessionLog["id" + token].id_usuario}/${ff.name}`;
		var id_propiedad = req.body.id_propiedad;
		
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
		
		ff.mv(filerute, (err) => {
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
	} 

	
	if (req.files == null) {
		console.log("Sin imagen")
	} else {
	
		if (Array.isArray(req.files.file) == true) {
			
			req.files.file.forEach(file => guardarmultimedia(file,req))

		} else { 

			guardarmultimedia(req.files.file,req)
			
		}
	}

	con.query(
		"UPDATE propiedad SET descripcion = ?, direccion = ?, ciudad = ?, nombre = ?, departamento = ? , precio = ?, superficieM2 = ?, nrohabitaciones = ?, nrobaños = ?, nrogarage = ?  WHERE id_propiedad = ? ",
		[req.body.descripcion, req.body.direccion,req.body.ciudad,req.body.nombre,req.body.departamento,req.body.precio,req.body.superficieM2,req.body.nrohabitaciones,req.body.nrobanos,req.body.nrogarage,req.body.id_propiedad],
		function (err, result) {
			if (err != null) {
				console.log("error", err)
				res.send({ "status": 0, "mensaje": err })
			} else {
				console.log("salio bien editar",req.body.id_propiedad) 
				res.redirect("/dashboard")

			}
		}
	);

})

app.post("/getperfil",function(req,res){
	token = req.body.token

	if (sessionLog["id" + token] != null) {
		
		var id_usuario = sessionLog["id" + token].id_usuario

		con.query(
			"SELECT * FROM usuario WHERE id_usuario = ?", [id_usuario],
			function (err, result) {
				if (err != null) {
					
					res.send({ "status": 0})
					
				} else {
					
					res.send({ "status": 200,"data":result[0]})
				}
			}
		);
	}
})

app.post("/editarperfil",function(req,res){

	var token = req.body.token
	console.log("entro en editar perfil",token)
	
	if (sessionLog["id" + token] != null) {
		var id_usuario = sessionLog["id" + token].id_usuario
		
		console.log("entro y hay id",id_usuario)
		var telef = null
		if(req.body.telefono != ''){
			telef = req.body.telefono
		}
		if (req.body.nombre == null) {
			console.log("no existe parametros")
		} else{
			con.query(
				"UPDATE usuario SET nombre = ?,telefono = ?, direccion = ?, email = ?, documentoidentificador = ?  WHERE id_usuario = ? ",
				[req.body.nombre,telef,req.body.direccion,req.body.email,req.body.documentoidentificador,id_usuario],
				function (err, result) {
					if (err != null) {
						console.log("error", err)
						res.send({ "status": 0, "mensaje": err })
					} else {

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
	
						function guardarmultimedia(archivo){
							console.log("entro en dad",token)
							var filerute = `./file/Usr${sessionLog["id" + token].id_usuario}/${archivo.name}`;
							var id_propiedad = result.insertId;
							archivo.mv(filerute, (err) => {
								if (err) {
									console.log("error al guardar el archivo", err);
									res.status(0);
								} else {
									con.query(
										"UPDATE usuario SET foto = ? WHERE id_usuario = ?",
										[filerute, id_usuario],
										function (err1, result1) {
											if (err1 != null) {
												console.log("error en base de dato", err1);
											} else {
												console.log("Almacenado ruta en base");
												sessionLog["id" + token].foto = filerute
											}
										}
									);
									console.log("se guardo el archivo");
								}
							});
						} 
	
						
						if (req.files == null) {
							console.log("Sin imagen")
						} else {
						
							if (Array.isArray(req.files.file) == true) {
	
							
								req.files.file.forEach(cara => guardarmultimedia(cara))
		
							} else { 
		
								guardarmultimedia(req.files.file)
								
							}
						}
						
						res.status(200);
						res.redirect("/dashboard");
						
					}
				}
			);
		}

	} else {
		 console.log("fallecio token")
	}
})

app.get("/add", function (req, res) {
	res.render(__dirname + "/html/views/add");
});

app.get("/propiedad", function (req, res) {
	console.log("idpropiedad",req.query.id)


	if (req.query.id == null || req.query.id == "" ) {
		
		console.log("No vino id")
		res.redirect("home")

	} else {
		con.query(
			"SELECT propiedad.*,tipopropiedad.descripcion as descr FROM propiedad INNER JOIN tipopropiedad ON propiedad.id_tipopropiedad = tipopropiedad.id_tipopropiedad WHERE id_propiedad = ?", [req.query.id],
			function (err, result) {
				if (err != null) {
					
					res.send({ "status": 0})
					
				} else {
					
					res.render("propiedad", {
						propiedad: result[0]
					})

				}
			}
		);
		
	}

	
});
 
app.post("/edit",function(req,res){

	var token = req.body.token
	var id_propiedad = req.body.id_propiedad
	if (sessionLog["id" + token] != null) {
		con.query("Select * FROM propiedad WHERE id_propiedad = ?",[id_propiedad],
			function(err,resp){
				if (err != null) {
					console.log("error", err)
					res.send({ "status": 0, "mensaje": err })
				} else {
					 console.log("salio bien edit",resp)
					res.render(__dirname + "/html/views/edit", {
						sessionLog: sessionLog["id" + token],
						propiedad: resp
					})
				}
			}
		)
	} else {
		res.send({ "status": 0 })
	}

})

app.get("/imgpropiedad",function(req,res){
	console.log("entro img propiedades",req.query.id)
	if (req.query.id == null || req.query.id == "") {
		console.log("nos hakean")
	} else {
		if(req.query.delete != null && req.query.delete != "" && req.query.delete == "true" ){
			// console.log("crsutacio","DELETE FROM multimedia WHERE ruta = ?", req.query.id )
			
			con.query(
				"DELETE FROM multimedia WHERE ruta = ?", [req.query.id],
				function (err, result) {
					if (err != null) {
						
						res.send({ "status": 0})
						
					} else {
						
						res.send({ "status": 200,"data":"todo bien"})
						
					}
				}
			);
		} else {
			con.query(
				"SELECT ruta FROM multimedia WHERE id_propiedad = ?", [req.query.id],
				function (err, result) {
					if (err != null) {
						
						res.send({ "status": 0})
						
					} else {
						
						res.send({ "status": 200,"data":result})
					}
				}
			);
		}
		
		
	}
	
})

app.listen(PORT, function () {
	console.log(`App is running on port: ${PORT}`);
});
