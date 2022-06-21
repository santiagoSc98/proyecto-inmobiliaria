const controller = {};
const path = require("path");
const mysql = require("mysql")

var con = mysql.createConnection({
	host: "127.0.0.1",
	user: "root",
	password: "",
	database: "inmobiliaria",
});

controller.cargarVistaHome = function (req, res) {
    // var result = await obtenerpropiedades(req.query.limit, null, 1)
    con.query("Select * from propiedad", function(err, result) {
        if (err != null) {
            console.log(err);
        } else {
            res.render("index", {
                rows: result,
            });
        }    
    })
}

// function obtenerpropiedades(_limit, id_usuario = null, estado = null) {
//     return new Promise(resolve => {
//         var limit = "";

//         if (typeof _limit == "undefined") {
//             _limit == null
//         }

//         var filtrousuario = ""

//         if (id_usuario != null) {

//             filtrousuario = " AND id_usuario = " + id_usuario
//         }
//         var filtroestado = ""

//         if (estado != null) {
//             filtroestado = " AND estado = " + estado
//         }

//         if (_limit != null) {
//             limit = " LIMIT " + _limit;
//         }
//         con.query(
//             "SELECT propiedad.*,tipopropiedad.descripcion as dcp,(SELECT ruta FROM multimedia WHERE multimedia.id_propiedad = propiedad.id_propiedad)AS img FROM propiedad INNER JOIN tipopropiedad ON propiedad.id_tipopropiedad = tipopropiedad.id_tipopropiedad WHERE estado != 2 " + filtroestado + filtrousuario +
//             limit,
//             function (err, result) {
//                 if (err != null) {
//                     console.log(err);
//                     resolve(0)
//                 } else {
//                     resolve(result)
//                 }
//             });
//     })
// }

module.exports = controller;