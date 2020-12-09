const express = require("express");
const app = express();
const fs = require('fs');
const hls = require('hls-server');

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/video", function (req, res) {
    res.sendFile(__dirname + "/10m.mp4");
});

app.get("/media/:name", function (req, res) {

    console.log(req.param("name"));
    res.sendFile(`${__dirname}/${req.param("name")}`);
});

// console.log(__dirname);


let port = 3002;

app.listen(port, function () {
    console.log(`Listening on port ${port}!`);
});
