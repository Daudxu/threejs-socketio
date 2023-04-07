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
const users = {};

// io.on('conenct', function(socket){
//     console.log('conenct',socket.id);
// });

io.on('connection', async (socket) => {
    var total = io.engine.clientsCount;
    console.log('服务器连接成功ID:', socket.id);
    users[socket.id] = socket.id;
    // socket.emit('playerCount', users.length);
    // console.log('users.length:',  users.length);
    logger.info(total);
    socket.on('disconnect',function () {
        // console.log('断开统计在线客户端数量', total);
        console.log('断开统计在线客户端ID', socket.id);
        // console.log(socket.id); 
        // logger.info('断开统计在线客户端数量:' +total);
        // socket.broadcast.emit('message', data);
        delete users[socket.id];
    })
    socket.on('broadcast', function(data){ 
        console.log(data)
        socket.emit('broadcast', users); 
    });
    socket.on('playerCount',function () {
        // console.log('创建角色成功统计在线客户端数量', total);
        // logger.info('创建角色在线客户端数量:' +total);
        socket.emit('playerCount', users);
    })
    socket.on('message',function (data) {
        // console.log('创建角色成功统计在线客户端数量', total);
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
