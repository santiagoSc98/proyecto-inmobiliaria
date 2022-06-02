const express = require("express");
const res = require("express/lib/response");
const app = express()
let PORT = process.env.PORT || 3000;

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/DBInmobiliaria";
// const htmlfile = require(__dirname+"/html/index.html")

function insertUser(){
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("DBInmobiliaria");
        var myobj = { name: "Rimax", address: "Mcal. Lopez 5678" };
        dbo.collection("usuario").insertOne(myobj, function(err, res) {
          if (err) throw err;
          console.log("1 document inserted");
          db.close();
        });
      });
}

app.get("/home", (req, res) => {
    res.sendFile(__dirname+"/html/index.html")
});

app.get("/insert", (req, res) => {
    insertUser()
    res.send("insert")
});

app.listen(PORT, () => {
    console.log(`App is running on port: ${PORT}`);
});