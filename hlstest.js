const express = require("express");
const app = express();
const fs = require('fs');
const mkdirp = require('mkdirp')
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
// const ffmpeg = require('@ffmpeg-installer/ffmpeg');
const hls = require('hls-server');

const moment = require('moment');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get('/hls/:name', async (req, res) => {

    let name = req.param("name");

    let id = Math.random().toString(36).substr(2,11) //여러개의 요청이 왔을때 각각의 hls를 구분하기 위해
    mkdirp('./videos/'+ id);

    let temp = new ffmpeg(name, { timeout: 432000 }).addOptions([
        '-profile:v baseline', // baseline profile (level 3.0) for H264 video codec
        '-level 3.0',
        // '-s 640x360',          // 640px width, 360px height output video dimensions
        '-start_number 0',     // start the first .ts segment at index 0
        '-hls_time 100',        // 10 second segment duration
        '-hls_list_size 0',    // Maxmimum number of playlist entries (0 means all entries/infinite)
        '-f hls'               // HLS format
    ]).on('start', function(commandLine) {
        console.log('Spawned FFmpeg with command: ' + commandLine);

    }).on('codecData', function(data) { // 하는 이유 코드 실행순서.
        res.send({ id : id, url : `/stream/${id}/${id}.m3u8`,});

    }).on('error', function(err) {
        // fs.rmdirSync('./videos/'+ id);
        // deleteFolderRecursive('./videos/'+ id)
        console.log(err.message);
    }).saveToFile(`./videos/${id}/${id}.m3u8`); //저장
});


app.use('/stream',express.static('./videos'));

// app.get("/stream/:path", function (req, res) {
//
//     console.log(req.param("path"));
//
//     let id = req.param("path");
//     res.sendFile(`${__dirname}/videos/${id}/${id}.m3u8`);
// });

let port = 3002;

app.listen(port, function () {
    console.log(`Listening on port ${port}!`);
});
