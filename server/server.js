const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
var log4js = require('log4js');
log4js.configure('./log4js.json');
var logger = require('log4js').getLogger("index");

const { Server } = require("socket.io");
var io = new Server(server,{ cors: true });
const cors = require('cors');
app.use(cors());
const port = 3000;

io.on('connection', async (socket) => {
    // console.log('a user connected'+socket);
    var total = io.engine.clientsCount;
    var allClients = await io.allSockets();
    // console.log('allClients:' + allClients);
    // logger.info('allClients:' +allClients);
    socket.on('connectedUser', (users) =>{
        socket.name = users;
        socket.emit('connectedUser', users);
        // console.log(users + ' has joined the chat.');
    })

    socket.on('disconnect',function (data) {
        // console.log('data', data)
        // logger.info(data);
        console.log('断开统计在线客户端数量', total);
        logger.info('断开统计在线客户端数量:' +total);
        socket.broadcast.emit('message', data);
    })
    socket.on('message',function (data) {
        console.log('创建角色成功统计在线客户端数量', total);
        // logger.info('创建角色在线客户端数量:' +total);
        socket.broadcast.emit('message', data);
    })
});

app.use(log4js.connectLogger(log4js.getLogger("http"), { level: 'auto' }));

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
