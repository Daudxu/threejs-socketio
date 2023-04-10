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
// 设置一个默认房间
const roomName = "gameRome"
var roomInfo = {};

io.on('connection', async (socket) => {
    let total = io.engine.clientsCount;
    let user = '';
    console.log('服务器连接成功ID:', socket.id);
    logger.info(total);
    // 加入游戏房间
    socket.on('join', function (userName) {
        user = userName;
        // 将用户昵称加入房间名单中
        if (!roomInfo[roomName]) {
            roomInfo[roomName] = [];
        }
        roomInfo[roomName].push(user);
        // 加入房间
        socket.join(roomName);
        // 通知房间内人员
        io.to(roomName).emit('system', user + ' joined Room ' + roomName, roomInfo[roomName]);  
        console.log(user + ' joined Room ' + roomName);
    });
    socket.on('message',function (data) {
        socket.broadcast.emit('message', data);
    })

    socket.on('leave', function () {
        socket.emit('disconnect');
    });
    // 断开则从房间名单中移除玩家
    socket.on('disconnect', function () {
        if(user){
            var index = roomInfo[roomName].indexOf(user);
            if (index !== -1) {
              roomInfo[roomName].splice(index, 1);
            }
            socket.leave(roomName); 
            io.to(roomName).emit('system', user + ' 退出了房间 ', roomInfo[roomName]);
            console.log(user + ' 退出了 ' + roomName);
        }
      });
    // 接收用户消息,发送相应的房间
    socket.on('roomMessage', function (msg) {
        // 验证如果用户不在房间内则不给发送
        if (roomInfo[roomName].indexOf(user) === -1) {  
           return false;
        }
        io.to(roomName).emit('roomMessage', user, msg);
    });
    socket.on('message', function (msg) {
        if(msg === "hi") {
            console.log("===")
        }
        
        // // 验证如果用户不在房间内则不给发送
        // if (roomInfo[roomName].indexOf(user) === -1) {  
        //    return false;
        // }
        // io.to(roomName).emit('message', user, msg);
    });
    // 接收用户游戏角色消息,发送相应的游戏信息到组队房间
    socket.on('gameInfo', function (msg) {
        // 验证如果用户不在房间内则不给发送
        if (roomInfo[roomName].indexOf(user) === -1) {  
            return false;
        }
        io.broadcast.to(roomName).emit('msg', user, msg);
    });
});

// const removeUser = (objects, key, value) => {
//     return objects.filter(function(object) {
//       return object[key] !== value;
//     });
// }

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
