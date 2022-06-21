const express = require("express");
const router = express.Router();

const homeController = require("../controllers/homeController"); 

router.get("/vistahome", homeController.cargarVistaHome); 

module.exports = router;