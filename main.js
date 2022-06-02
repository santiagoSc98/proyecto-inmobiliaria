const express = require("express");
const res = require("express/lib/response");
const app = express()
let PORT = process.env.PORT || 3000;
// const htmlfile = require(__dirname+"/html/index.html")

app.get("/home", (req, res) => {
    res.sendFile(__dirname+"/html/index.html")
});

app.listen(PORT, () => {
    console.log(`App is running on port: ${PORT}`);
});