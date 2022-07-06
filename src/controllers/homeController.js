const controller = {};
const stateService = require("../services/stateService")
const path = require("path");

controller.cargarVistaHome = function (req, res) {
    let allStates = stateService.list()
    res.render("index", {
        rows: allStates,
    });
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