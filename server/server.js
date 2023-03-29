const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
var io = new Server(server,{ cors: true });
const cors = require('cors');
app.use(cors());
const port = 3000;

io.on('connection', (socket) => {
    console.log('a user connected'+socket);
    socket.on('disconnect',function (data) {
        // console.log('data', data)
        console.log('断开')
    })
    socket.on('message',function (data) {
        socket.broadcast.emit('message', data);
    })
});

//设置跨域访问
app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
    res.header('Access-Control-Allow-Headers', ['mytoken','Content-Type']);
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    // res.header("Content-Type", "application/json;charset=utf-8");
    res.header("Content-Type", 'charset=utf-8');
    next();
});

server.listen(port, () => {
    console.log(`http://127.0.0.1:${port}`);
});
