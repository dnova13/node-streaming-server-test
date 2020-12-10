const express = require("express");
const app = express();

const fs = require('fs');
const hls = require('hls-server');

const multer = require("multer");
const uploader = multer({dest : 'uploads/'})

const mkdirp = require('mkdirp')
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const moment = require('moment');

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.get("/video", function (req, res) {
    res.sendFile(__dirname + "/10m.mp4");
});

app.get("/media/:name", function (req, res) {

    console.log(req.param("name"));
    res.setHeader('Content-Type', 'video/mp4');
    res.sendFile(`${__dirname}/${req.param("name")}`);
});

app.get("/media/test/:name", function (req, res) {

    console.log(req.param("name"));
    // res.sendFile(`${__dirname}/${req.param("name")}`);
});

// 업로드
app.post("/upload/media", uploader.single('media'), (req, res, next) => {

    console.log(req.param("name"));
    // res.sendFile(`${__dirname}/${req.param("name")}`);
});

app.get('/start', async function(req, res) {

    let id = Math.random().toString(36).substr(2,11) //여러개의 요청이 왔을때 각각의 hls를 구분하기 위해

    mkdirp('./videos/'+ id);                          //랜덤한 16진수로 폴더 이름으로 한 후 해당 폴더에 hls파일을 넣습니다

    var flag_args = ['omit_endlist', 'append_list'];

    temp = new ffmpeg( "/10m.mp4" ).addOptions([
        '-vcodec libx264',
        '-crf 23',
        '-r 10',
        '-fflags nobuffer',
        '-c:v copy',
        '-c:a copy',
        '-b:v 60k',
        '-maxrate 60k',
        '-minrate 60k',
        '-bufsize 60k',
        '-pix_fmt yuv420p',
        '-flags low_delay',
        '-flags',
        '-global_header',
        '-probesize 5000',
        '-hls_flags ' + flag_args.join('+'),
        '-hls_playlist_type event',
        '-hls_time 3', //분단된 ts파일들의 길이 지정(초 단위)
        '-hls_list_size 6', //m3u8파일에 기록될 최대 ts파일 수
        '-hls_wrap 10', //저장될 파일 갯수의 최대 갯수 해당 갯수를 넘으면 덮어 씌웁니다
    ]).on('start', function(commandLine) {
        console.log('Spawned FFmpeg with command: ' + commandLine);

    }).on('codecData', function(data) { // 하는 이유 코드 실행순서. 
        res.send({ id : id, url : '/strea/'+id+".m3u8",});//url에 대해선 다음 코드에 설명하겠습니다

    }).on('error', function(err) {
        fs.rmdirSync('./videos/'+ id);
        // deleteFolderRecursive('./videos/'+ id)
        console.log(moment().format('YYYY-MM-DD HH:mm:ss')+' Cannot process video: ' + err.message);

    }).saveToFile('./videos/'+id+'/'+id+'.m3u8'); //저장

    temp.kill('SIGTERM')
})

app.get('/hls/test', async (req, res) => {

    console.log("1111");

    ffmpeg('10m.mp4', { timeout: 432000 }).addOptions([
        '-profile:v baseline', // baseline profile (level 3.0) for H264 video codec
        '-level 3.0',
        // '-s 640x360',          // 640px width, 360px height output video dimensions
        '-start_number 0',     // start the first .ts segment at index 0
        '-hls_time 10',        // 10 second segment duration
        '-hls_list_size 0',    // Maxmimum number of playlist entries (0 means all entries/infinite)
        '-f hls'               // HLS format
    ]).output('/videos/output1.m3u8').on('end', () => {

        console.log("222");
    }).run()
});


// 서버 배포
// app.use('/stream',express.static('./videos'));
// res.send({ id : id,url : '/strea/'+id+".m3u8",})

// console.log(__dirname);


let port = 3002;

app.listen(port, function () {
    console.log(`Listening on port ${port}!`);
});
