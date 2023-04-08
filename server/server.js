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
let usersList = [];
// 设置一个默认房间
const roomName = "gameRome"
var roomInfo = {};

io.on('connection', async (socket) => {
    var total = io.engine.clientsCount;
    var user = '';
    console.log('服务器连接成功ID:', socket.id);x
    logger.info(total);
    socket.on('broadcast', function(name){ 
        let user = {
            'id': socket.id,
            'name': name
        }
        usersList.push(user)
        io.emit('broadcast', usersList);          
    });
    socket.on('usersList',function () {
        io.emit('usersList', usersList);
    })  
    socket.on('message',function (data) {
        // console.log('创建角色成功统计在线客户端数量', total);
        // logger.info('创建角色在线客户端数量:' +total);
        socket.broadcast.emit('message', data);
    })
    // 加入游戏房间
    socket.on('join', function (userName) {
        user = userName;
    
        // 将用户昵称加入房间名单中
        if (!roomInfo[roomName]) {
          roomInfo[roomName] = [];
        }
        roomInfo[roomName].push(user);
    
        socket.join(roomName);    // 加入房间
        // 通知房间内人员
        io.to(roomName).emit('system', user + '加入了房间', roomInfo[roomName]);  
        console.log(user + '加入了' + roomName);
    });
    socket.on('leave', function () {
        socket.emit('disconnect');
    });
    socket.on('disconnect', function () {
        // 从房间名单中移除
        var index = roomInfo[roomName].indexOf(user);
        if (index !== -1) {
          roomInfo[roomName].splice(index, 1);
        }
    
        socket.leave(roomName);    // 退出房间
        io.to(roomName).emit('sys', user + '退出了房间', roomInfo[roomName]);
        console.log(user + '退出了' + roomName);

        // console.log('断开统计在线客户端ID', socket.id);
        usersList = removeUser(usersList, 'id', socket.id)
        io.emit('broadcast', usersList);    
      });  
    // 接收用户消息,发送相应的房间
    socket.on('gameRoom', function (msg) {
        // 验证如果用户不在房间内则不给发送
        if (roomInfo[roomName].indexOf(user) === -1) {  
        return false;
        }
        io.to(roomName).emit('msg', user, msg);
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

const removeUser = (objects, key, value) => {
    return objects.filter(function(object) {
      return object[key] !== value;
    });
}

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
