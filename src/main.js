const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const path = require("path")
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(__dirname + "../file"));
app.use(bodyParser.urlencoded({ extended: true }));

//Importacion de los routes
const homeEndpoints = require("./routes/home")

//Endpoints
app.use("/home", homeEndpoints)

app.listen(PORT, function () {
	console.log(`App is running on port: ${PORT}`);
});