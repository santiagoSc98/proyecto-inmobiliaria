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
	return new Promise(resolve => {
		if (sessionLog["id" + token] == null) {

			sessionLog["id" + token] = {};
		}

		sessionLog["id" + token].logged = true;
		sessionLog["id" + token].id_usuario = result[0].id_usuario;
		sessionLog["id" + token].nombre = result[0].nombre;
		sessionLog["id" + token].email = result[0].email;
		sessionLog["id" + token].id_tipousuario = result[0].id_tipousuario;
		sessionLog["id" + token].foto = result[0].foto;

		con.query(
			"SELECT * FROM `planes` INNER JOIN plandetalles ON plandetalles.id_plandetalles = planes.id_plandetalles WHERE id_usuario = ?;",[result[0].id_usuario],
			function (err, result1) {
				if (err != null) {
					console.log("Manage session error",err);
					resolve(false)
					
				} else {

					sessionLog["id" + token].plan = result1[0].id_plandetalles
					sessionLog["id" + token].precioplan = result1[0].precio
					sessionLog["id" + token].descripcionplan = result1[0].descripcion
					sessionLog["id" + token].maxpublicacionplan = result1[0].maxpublicaciones
					sessionLog["id" + token].precioplan = result1[0].precio
					sessionLog["id" + token].maximg = result1[0].maximg
					sessionLog["id" + token].maxvideo = result1[0].maxvideo
					// console.log("seteo session",sessionLog["id" + token])
					resolve(true)
				}
			}
		);
	})
}

function obtenerpropiedades(_limit, id_usuario = null, estado = null,tiempopublic = false) {
	return new Promise(resolve => {
		var limit = "";

		if (typeof _limit == "undefined") {
			_limit == null
		}

		var filtrousuario = ""

		if (id_usuario != null) {

			filtrousuario = " AND propiedad.id_usuario = " + id_usuario
		}
		var filtroestado = ""

		if (estado != null) {
			filtroestado = " AND estado = " + estado
		}

		if (_limit != null) {
			limit = " LIMIT " + _limit;
		}

		var tempopublic=""

		if (tiempopublic != false ) {
			tempopublic =" AND DATE_ADD(DATE(fechapublicacion), INTERVAL plandetalles.maxtiempopublicacion DAY) >= NOW() "
		}

		con.query(
			"SELECT propiedad.*,tipopropiedad.descripcion as dcp,(SELECT ruta FROM multimedia WHERE multimedia.id_propiedad = propiedad.id_propiedad limit 1)AS img,plandetalles.maxtiempopublicacion,fechapublicacion FROM propiedad " + 
			"INNER JOIN tipopropiedad ON propiedad.id_tipopropiedad = tipopropiedad.id_tipopropiedad " +
			"INNER JOIN planes ON planes.id_usuario = propiedad.id_usuario " + 
			"INNER JOIN plandetalles ON plandetalles.id_plandetalles = planes.id_plandetalles " +
			"WHERE estado != 2 " + tempopublic + filtroestado + filtrousuario + limit,
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

								con.query(
									"INSERT INTO planes (id_usuario, id_plandetalles) value (?,?)",[result1.insertId,1],async function(err2,result2){
									if (err2 != null) {
										console.log("error en base",err2)
									} else {
										console.log("actualizado correctamente", token);

										var tmpar0 = []
										tmpar0[0] = {}
										tmpar0[0].id_usuario = result1.insertId
										tmpar0[0].nombre = nombre
										tmpar0[0].email = email
										tmpar0[0].foto = "none"
										tmpar0[0].maximg = 5
										tmpar0[0].maxvideo = 0

										console.log("tmpar0", tmpar0)

										await managesesion(tmpar0, token);

										res.send([{ status: 200, token: token,maximg:5,maxvideo:0 }]);
									}
								})
							}
						}
					);
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
			async function (err, result) {
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

					await managesesion(result, token);

					res.send([{ status: 200, token: token,"maximg":sessionLog["id" + token].maximg,"maxvideo":sessionLog["id" + token].maxvideo }]);
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
		res.send({ "Usrname": sessionLog["id" + token].nombre,"maximg":sessionLog["id" + token].maximg,maxvideo:sessionLog["id" + token].maxvideo});

	} else {
		con.query(
			"SELECT * FROM usuario WHERE token = ?;",
			[token],
			async function (err, result) {
				if (result.length > 0) {

					await managesesion(result, token);

					console.log("max video logintoken",sessionLog["id" + token])
					res.send({ "Usrname": result[0].nombre,"maximg":sessionLog["id" + token].maximg,"maxvideo":sessionLog["id" + token].maxvideo });
					// console.log("max img logintoken",sessionLog["id" + token])
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
	let lat = req.body.lat;
	let lng = req.body.lng;

	console.log("holas", token)
	if (sessionLog["id" + token] != null) {
		console.log("existe en el sesionlog", sessionLog['id' + token].id_usuario,"lokooooo", req.body.comodidadunica);

		var tmpesatdo = 1

		con.query("SELECT COUNT(*) as count FROM `propiedad` WHERE estado = 1 AND id_usuario = ?",[sessionLog['id' + token].id_usuario],function(err0,result0){
			if (sessionLog["id"+ token].maxpublicacionplan <= result0[0].count) {
				tmpesatdo = 0
			}

			con.query(
				"INSERT INTO propiedad (descripcion,lon,lat,direccion,ciudad,departamento,precio,id_tipopropiedad,id_usuario,tipo_publicacion,nombre,superficieM2,nrohabitaciones,nrobaños,nrogarage,comodidad,estado) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
				[descripcion,lng,lat, direccion, ciudad, departamento, precio, tipo, sessionLog["id" + token].id_usuario, tpublicacion, nombre, superficieM2, nrohabitaciones, nrobanos, nrogarage, req.body.comodidadunica,tmpesatdo],
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
	
						function guardarmultimedia(ff,tresd = false) {
							console.log("entro en dad", token)
							var filerute = `./file/Usr${sessionLog["id" + token].id_usuario}/${ff.name}`;
							var id_propiedad = result.insertId;
							
							ff.mv(filerute, (err) => {
								if (err) {
									console.log("error al guardar el archivo", err);
									res.status(0);
								} else {
									
									if (tresd == false) {
										var tipoarchivo = ff.mimetype
											if (tipoarchivo == "video/mp4" || tipoarchivo == "video/mov" ) {
												tipoarchivo = "video"
											} else {
												tipoarchivo = "img"
											}
									} else {
										tipoarchivo="3d"
									}
									con.query(
										"INSERT INTO multimedia (id_propiedad,tipo,ruta) VALUES (?,?,?)",
										[id_propiedad, tipoarchivo, filerute],
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
							if (req.files.tresd !=null) {
								if (Array.isArray(req.files.tresd) == true) {
	
									req.files.tresd.forEach(cara => guardarmultimedia(cara,true))

									
								} else {
	
									guardarmultimedia(req.files.tresd,true)
	
								}
							}
							if (req.files.filevideo != null) {
								if (Array.isArray(req.files.file) == true) {
	
									req.files.filevideo.forEach(cara => guardarmultimedia(cara))
									
								} else {
	
									guardarmultimedia(req.files.filevideo)
	
								}
							}
							if (req.files.file != null) {
								if (Array.isArray(req.files.file) == true) {
	
									req.files.file.forEach(cara => guardarmultimedia(cara))
	
								} else {
	
									guardarmultimedia(req.files.file)
	
								}
							}
	
						}
	
						var conquery = "INSERT INTO pcomodidad (id_propiedad,id_comodidades) VALUES "
						var values = ""
						for (const key in req.body) {
	
							if (key.includes("comodidades")) {
								values = "(" + result.insertId + "," + key.replace("comodidades","") + ")"
								conquery += values + (",")
								conquery = conquery.slice(0, -1) + ""
								console.log("conquery",conquery)
			
								con.query( conquery,
									function (err1, result1) {
										if (err1 != null) {
											console.log("error en base de dato", err1);
										} else {
											console.log("comodidad");
										}
									}
								);
								console.log("komodidad");
							} 
						}
					
	
						res.status(200);
						res.redirect("/dashboard");
					}
				}
			);
			console.log("banaaanaaa",req.files.tresd)
		})
		 
		
	} else {
		res.send({ "status": 0 })
		console.log("este pendejo no tiene sesion", req.body);

	}
});

app.get("/file/:Usr/:file", function (req, res) {
	var ruta = req.params.Usr;
	var rute = req.params.file;
	res.sendFile(__dirname + "/file/" + ruta + "/" + rute);
});

app.post("/changepropiedadestatus", function (req, res) {
	var token = req.body.token;
	console.log("entro en changeprop")
	if (sessionLog["id" + token] != null) {
		con.query("SELECT COUNT(*) AS su FROM `propiedad` WHERE id_usuario = ? AND estado = 1;",[sessionLog["id" + token].id_usuario],
		function(error,result2){
			if (error != null) {
				console.log("error", error)
				res.send({ "status": 0, "mensaje": error })
			} else {
				if (req.body.estado == 3) {
					console.log("el chanti tiene trabajo")
					con.query(
						"UPDATE propiedad SET estado = 0 WHERE id_propiedad = ?",
						[req.body.id_propiedad],
						function (err, result) {
							if (err != null) {
								console.log("error", err)
								res.send({ "status": 0, "error en el status": err })
							} else {
								console.log("change poropiedad status salio bien")
								res.send({ "status": 200 })
							}
						}
					);
				} else{

					if (req.body.estado == 1 &&
						result2[0].su >= sessionLog["id" + token].maxpublicacionplan) {
						console.log("Estas en un plan free")
						res.send({ "status": 0, "mensaje": "MAX LIMIT PUTO" })
					} else {
						var tmpstr0 = ""
						if(req.body.estado == 1){
							tmpstr0 = ", fechapublicacion = NOW()"
						}
						con.query(
							"UPDATE propiedad SET estado = ?"+tmpstr0+" WHERE id_propiedad = ?",
							[req.body.estado, req.body.id_propiedad],
							function (err, result) {
								if (err != null) {
									console.log("error", err)
									res.send({ "status": 0, "error en el status": err })
								} else {
									console.log("change poropiedad status salio bien")
									res.send({ "status": 200 })
								}
							}
						);
				
					}
				}	
			}
		})
		
	}
})

app.get("/home", async function (req, res) {


	var result = await obtenerpropiedades(6, null, 1,true)
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
		propiedades: null
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
	
		res.redirect("/home")
	}

})

app.post("/editarpropiedad", function (req, res) {

	console.log("id", req.body.token)

	function guardarmultimedia(ff, req) {
		var token = req.body.token
		console.log("entro en guardar multimedia", token)
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

			req.files.file.forEach(file => guardarmultimedia(file, req))

		} else {

			guardarmultimedia(req.files.file, req)

		}
	}
	console.log("inicio actualizado")

	con.query(
		"UPDATE propiedad SET descripcion = ?, direccion = ?, ciudad = ?, nombre = ?, departamento = ? , precio = ?, superficieM2 = ?, nrohabitaciones = ?, nrobaños = ?, nrogarage = ?,comodidad = ?,id_tipopropiedad = ?,tipo_publicacion = ? WHERE id_propiedad = ? ",
		[req.body.descripcion, req.body.direccion, req.body.ciudad, req.body.nombre, req.body.departamento, req.body.precio, req.body.superficieM2, req.body.nrohabitaciones, req.body.nrobanos, req.body.nrogarage, req.body.comodidadunica,req.body.id_tipopropiedad,req.body.tipo_publicacion, req.body.id_propiedad],
		function (err, result) {
			if (err != null) {
				console.log("error", err)
				res.send({ "status": 0, "mensaje": err })
			} else {
				console.log("salio bien editar", req.body.id_propiedad)
				res.redirect("/dashboard")

			}
		}
	);

})

app.post("/getperfil", function (req, res) {
	token = req.body.token

	if (sessionLog["id" + token] != null) {

		var id_usuario = sessionLog["id" + token].id_usuario

		con.query(
			"SELECT * FROM usuario WHERE id_usuario = ?", [id_usuario],
			function (err, result) {
				if (err != null) {

					res.send({ "status": 0 })

				} else {

					res.send({ "status": 200, "data": result[0] })
				}
			}
		);
	}
})

app.post("/editarperfil", function (req, res) {

	var token = req.body.token
	console.log("entro en editar perfil", token)

	if (sessionLog["id" + token] != null) {
		var id_usuario = sessionLog["id" + token].id_usuario

		console.log("entro y hay id", id_usuario)
		var telef = null
		if (req.body.telefono != '') {
			telef = req.body.telefono
		}
		if (req.body.nombre == null) {
			console.log("no existe parametros")
		} else {
			con.query(
				"UPDATE usuario SET nombre = ?,telefono = ?, direccion = ?, email = ?, documentoidentificador = ?  WHERE id_usuario = ? ",
				[req.body.nombre, telef, req.body.direccion, req.body.email, req.body.documentoidentificador, id_usuario],
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

						function guardarmultimedia(archivo) {
							console.log("entro en dad", token)
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
		res.redirect("/home")
		console.log("fallecio token")
	}
})

app.get("/delete/propiedad", function (req, res) {
	var id = req.body.id
	if (sessionLog["id" + token] != null) {
		con.query("DELETE FROM propiedad WHERE id_propiedad = ?", [id], function (err, result) {
			if (err != null) {
				console.log("error", err)
				res.send({ "status": 0, "mensaje": err })
			} else {
				console.log("Se Elimino el registro")
				res.send({ "status": 200 })
			}
		}
		);
	}
})

app.get("/add", function (req, res) {
	con.query(
		"SELECT * FROM comodidades",
		function (err, result) {
			if (err != null) {

				res.send({ "status": 0 })

			} else {

				res.render("add", {
					comodidad: result
				})

			}
		}
	);

	
});

app.get("/propiedad", function (req, res) {
	console.log("idpropiedad", req.query.id)


	if (req.query.id == null || req.query.id == "") {

		console.log("No vino id")
		res.redirect("home")

	} else {
		
		con.query(
			"SELECT propiedad.*,tipopropiedad.descripcion as descr FROM propiedad INNER JOIN tipopropiedad ON propiedad.id_tipopropiedad = tipopropiedad.id_tipopropiedad WHERE id_propiedad = ?", [req.query.id],
			function (err, result) {
				if (err != null) {

					res.send({ "status": 0 })

				} else {
					con.query("SELECT comodidades.descripcion as comodes FROM propiedad INNER JOIN pcomodidad ON pcomodidad.id_propiedad = propiedad.id_propiedad INNER JOIN comodidades ON comodidades.id_comodidades = pcomodidad.id_comodidades WHERE propiedad.id_propiedad = ?", [req.query.id],
					function(err1,result1){
						if (err1!= null) {
							res.send({ "status": 0 })
						} else {

							res.render("propiedad", {
								propiedad: result[0],
								comodidades:result1
							})
						}
					})
				}
			}
		);

	}


});

app.post("/edit", function (req, res) {

	var token = req.body.token
	var id_propiedad = req.body.id_propiedad
	if (sessionLog["id" + token] != null) {
		con.query("Select * FROM propiedad WHERE id_propiedad = ?", [id_propiedad],
			function (err, resp) {
				if (err != null) {
					console.log("error", err)
					res.send({ "status": 0, "mensaje": err })
				} else {

					con.query("SELECT * FROM comodidades",function (err, result) {
						if (err != null) {
			
							res.send({ "status": 0,"mensaje 1":err})
			
						} else {
							con.query("SELECT comodidades.* FROM comodidades INNER JOIN pcomodidad ON comodidades.id_comodidades = pcomodidad.id_comodidades WHERE pcomodidad.id_propiedad = ?", [id_propiedad],
							function (err, result1) {
								if (err != null) {
					
									res.send({ "status": 0,"mensaje inner":err})
					
								} else{
									// console.log("existente",result,"hay",result1)
									res.render(__dirname + "/html/views/edit", {
										sessionLog: sessionLog["id" + token],
										propiedad: resp,
										comodidad: result,
										editcomodidad:result1
									})
								}})
			
							console.log("salio bien edit", resp)
			
						}
					})
				}
			}
		)
	} else {
		// res.send({ "status": 0,"puto":true })
		res.redirect("/dashboard")
	}

})

app.get("/imgpropiedad", function (req, res) {
	console.log("entro img propiedades", req.query.id)
	if (req.query.id == null || req.query.id == "") {
		console.log("nos hakean")
	} else {
		if (req.query.delete != null && req.query.delete != "" && req.query.delete == "true") {

			con.query(
				"DELETE FROM multimedia WHERE ruta = ?", [req.query.id],
				function (err, result) {
					if (err != null) {

						res.send({ "status": 0 })

					} else {

						res.send({ "status": 200, "data": "todo bien" })

					}
				}
			);
		} else {
			console.log("hay imagenes")
			
			function elquerymamon(element3d,result){
				return new Promise(resolve => {
					con.query("SELECT panoramica.*,multimedia.ruta FROM panoramica INNER JOIN multimedia on panoramica.id_multimedia = multimedia.id_multimedia WHERE panoramica.id_multimedia = ?;",[element3d.id_multimedia],
					function (err1, result1) {
						   //  console.log("resultado panoramica",result1)
						   if (err1 != null) {
	   
							   // res.send({ "status": 0 })
	   
						   } else{
							   // console.log("trajo 3d",result1)
							   // res.send({ "status": 200, "data": result, "data3d": result1 })
							   
							 
							   // console.log('funca en conca1',elconcatenado)
							//    console.log('temp',result.length,'temp1',tmpint0)
							//    if (tmpint0 == result.length) {
								//    console.log('algo raro',elconcatenado)
								   //  res.send({ "status": 200, "data": result, "data3d": elconcatenado })
									   resolve(result1)
									   

							//    }
						   }
					   }
				   )
				})
			}

			function pros3d(result) {
				return new Promise(resolve => {
					console.log("entro en la promesa")
					var elconcatenado = []
					var tmpint0 = 0
					console.log('antes del foreach',result);
					result.forEach(async (element3d)  => {
						tmpint0 += 1
						console.log("entro en el foreach")
						if (element3d.tipo == "3d") {
							console.log("entro en el 3d")
							var tmp2 = await elquerymamon(element3d,result)
							console.log("viene el con",tmp2);
							elconcatenado =	elconcatenado.concat(tmp2) 
							console.log("concatenao",elconcatenado);
							if (tmpint0 == result.length) {
								console.log("ya enteo en el tmp",elconcatenado)
								// res.send({ "status": 200, "data": result, "data3d": elconcatenado })		
								resolve(elconcatenado)					   
							}
							
							// console.log("elemento 3d",element3d)
						} 
						
						
					})
				})}

				con.query(
					"SELECT *,(SELECT COUNT(*) FROM multimedia WHERE id_propiedad = ? and tipo='3d') AS tresd FROM multimedia WHERE id_propiedad = ?;", [req.query.id,req.query.id],
					async function (err, result) {
						if (err != null) {

							// res.send({ "status": 0 })

						} else {
							// var elconcatenado = []
							if (result[0].tresd > 0) {
								console.log("tiene en 3d",result[0].id_multimedia)
								console.log("antes de concatenado")
								var banana3 = await pros3d(result,res)
								console.log("despues de concatenado")
								console.log("viene el concatenado ???",banana3)
									
								// result.forEach(element3d => {
								// 	tmpint0 += 1
								// 	if (element3d.tipo == "3d") {
								// 		con.query("SELECT panoramica.*,multimedia.ruta FROM panoramica INNER JOIN multimedia on panoramica.id_multimedia = multimedia.id_multimedia WHERE panoramica.id_multimedia = ?;",[element3d.id_multimedia],
								// 			function (err1, result1) {
								// 				//  console.log("resultado panoramica",result1)
								// 				if (err1 != null) {
							
								// 					// res.send({ "status": 0 })
							
								// 				} else{
								// 					// console.log("trajo 3d",result1)
								// 					// res.send({ "status": 200, "data": result, "data3d": result1 })
													
								// 					elconcatenado =	elconcatenado.concat(result1) 
								// 					// console.log('funca en conca1',elconcatenado)
								// 					console.log('temp',result.length,'temp1',tmpint0)
								// 					if (tmpint0 == result.length) {
								// 						console.log('algo raro',elconcatenado)
								// 						//  res.send({ "status": 200, "data": result, "data3d": elconcatenado })
								// 							resolve("chantyyyy")
															

								// 					}
								// 				}
								// 			}
								// 		)
								// 		// console.log("elemento 3d",element3d)
								// 	} 
									
								// })
									
							} else{
								console.log("trajo todas las img sin 3d")
								res.send({ "status": 200, "data": result })
							}
						}
					}
				);
		}

	}

})

app.post('/setpcomodidad',function(req,res){
	console.log("Recibe b",req.body.checked,"id",req.body.id,"id_propiedad",req.body.id_propiedad)
	if (req.body.checked == "true") {
		con.query("INSERT INTO pcomodidad (id_propiedad,id_comodidades) VALUES (?,?)",[req.body.id_propiedad,req.body.id],function(err,resp){
			if(err != null){
				console.log("Error en base de datos",err)
				res.send({status:0,"mensaje":"error"})
			} else{
				console.log("se guardo")
				res.send({status:200,"mensaje":"se guardo"})
			}
		} )
	} else {
		con.query("DELETE FROM pcomodidad WHERE id_propiedad = ? AND id_comodidades = ?",[req.body.id_propiedad,req.body.id],function(err,resp){
			if(err != null){
				console.log("Error en base de datos",err)
				res.send({status:0,"mensaje":"error"})
			} else{
				console.log("se elimino")
				res.send({status:200,"mensaje":"se elimino"})
			}
		})
	}
})

app.post('/changeplan',function(req,res){
	console.log("Recibe plan",req.body)
	var token = req.body.token
	if (sessionLog["id" + token] != null) {
		
		con.query("UPDATE planes SET id_plandetalles = ? WHERE id_usuario = ?",[req.body.elvalor, sessionLog["id" + token].id_usuario],function(err,resp){
			if (err != null) {
				console.log("error", err)
				res.send({ "status": 0, "mensaje": err })
			} else {
				console.log(`UPDATE planes SET id_plandetalles = ? WHERE id_usuario = ?`,[req.body.elvalor, sessionLog["id" + token].id_usuario])
				sessionLog["id"+token].plan = req.body.elvalor
				if(req.body.elvalor == 1){
					sessionLog["id"+token].descripcionplan = "Servicio Free"
					sessionLog["id" + token].maxpublicacionplan = 1
					sessionLog["id" + token].maxvideo = 0
					sessionLog["id" + token].maximg = 5
				} 
				if(req.body.elvalor == 2){
					sessionLog["id"+token].descripcionplan = "Servicio Standard"
					sessionLog["id" + token].maxpublicacionplan = 2
					sessionLog["id" + token].maxvideo = 2
					sessionLog["id" + token].maximg = 10
				}
				if(req.body.elvalor == 3){
					sessionLog["id"+token].descripcionplan = "Servicio Premium"
					sessionLog["id" + token].maxpublicacionplan = 4
					sessionLog["id" + token].maxvideo = 5
					sessionLog["id" + token].maximg = 30
				}
				console.log("plan actualizado")

				res.send({ "status": 200})
			}
		})
	}  else {
		res.redirect("/home")
	}

})

app.get('/market',async function(req,res){
	var result = await obtenerpropiedades(null, null, 1,true)
	if (result == 0) {

		res.send({ status: 0 });

	} else {
		res.render("market", {
			mark: result,
		});
	}
})
// app.get('/propiedades',function(req,res){
	
// 	if (req.query.id == null || req.query.id == "") {

// 		console.log("No vino id")
// 		res.redirect("home")

// 	} else {
		
// 		con.query(
// 			"SELECT propiedad.*,tipopropiedad.descripcion as descr FROM propiedad INNER JOIN tipopropiedad ON propiedad.id_tipopropiedad = tipopropiedad.id_tipopropiedad WHERE id_propiedad = ?", [req.query.id],
// 			function (err, result) {
// 				if (err != null) {

// 					res.send({ "status": 0 })

// 				} else {
// 					con.query("SELECT comodidades.descripcion as comodes FROM propiedad INNER JOIN pcomodidad ON pcomodidad.id_propiedad = propiedad.id_propiedad INNER JOIN comodidades ON comodidades.id_comodidades = pcomodidad.id_comodidades WHERE propiedad.id_propiedad = ?", [req.query.id],
// 					function(err1,result1){
// 						if (err1!= null) {
// 							res.send({ "status": 0 })
// 						} else {

// 							res.render("propiedades", {
// 								propiedad: result[0],
// 								comodidades:result1
// 							})
// 						}
// 					})
// 				}
// 			}
// 		);

// 	}
// })

app.listen(PORT, function () {
	console.log(`App is running on port: ${PORT}`);
});
