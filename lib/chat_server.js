const socketio = require("socket.io");
var io;

var guestNmber = 1; //用户昵称计数器
var nickNames = {}; //昵称
var namesUsed = []; //被使用的用户名
var currentRoom = {}; //当前房间号

exports.listen = function (server) {
  io = socketio.listen(server);
  io.set('log level1', 1)

  io.sockets.on('connection', function (socket) {
    //分配昵称
    guestNmber = assignGuestName(socket, guestNmber, nickNames, namesUsed);
    //进入聊天室
    joinRoom(socket, 'Lobby');
    //处理用户消息
    handleMessageBroadcasting(socket, nickNames);
    handleRoomJoining(socket);

    socket.on('rooms', function () {
      socket.emit('rooms', io.sockets.manager.rooms);
    });
    //用户断开逻辑
    handleClientDisconnection(socket, nickNames, namesUsed);
  });
}
/**
 * 分配昵称
 * @param {*} socket 
 * @param {*} guestNmber 
 * @param {*} nickNames 
 * @param {*} namesUsed 
 */
function assignGuestName(socket, guestNmber, nickNames, namesUsed) {
  var name = 'Guest' + guestNmber;
  nickNames[socket.id] = name;
  socket.emit('nameResult', {
    success: true,
    name: name
  })
  namesUsed.push(name);
  return guestNmber + 1;
}
/**
 * 进入聊天室
 * @param {*} socket 
 * @param {*} room 
 */
function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', {
    room: room
  });
  socket.broadcast.to(room).emit('message', {
    text: nickNames[socket.id] + 'has joined' + room
  });

  var usersInRoom = io.sockets.clients(room);
  if (usersInRoom.length > 1) {
    var usersInRoomsSummary = 'Users currently in ' + room + ':';
    for (var index in usersInRoom) {
      var userSocketId = usersInRoom[index].id;
      if (userSocketId != socket.id) {
        if (index > 0) {
          usersInRoomsSummary += ',';
        }
        usersInRoomsSummary += nickNames[userSocketId];
      }
    }
    usersInRoomsSummary += '.';
    socket.emit('message', {
      text: usersInRoomsSummary
    });
  }
}
/**
 * 更名请求
 * @param {*} socket 
 * @param {*} nickNames 
 * @param {*} namesUsed 
 */
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', function (name) {
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest"'
      })
    } else {
      //昵称未被注册过
      if (namesUsed.indexOf(name) == -1) {
        //之前的用户名
        var previousName = nickNames[socket.id];
        //之前用户名索引
        var previousNameIndex = namesUsed.indexOf(previousName);

        // 存入新用户名
        namesUsed.push(name);
        nickNames[socket.id] = name;
        // 删掉之前的用户名
        delete namesUsed[previousNameIndex];

        socket.emit('nameResult', {
          success: false,
          message: 'Names cannot begin with "Guest"'
        })
        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: previousName + ' is now known as ' + name + '.'
        })
      } else {
        //昵称已被注册
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        })
      }
    }
  });
}
/**
 * 发送聊天信息
 * @param {*} socket 
 */
function handleMessageBroadcasting(socket){
  socket.on('message', function(message){
    socket.broadcast.to(message.room).emit('message', {
      text: nickNames[socket.id]+':'+message.text
    })
  })
}
/**
 * 创建房间
 * @param {socket} socket 
 */
function handleRoomJoining(socket){
  socket.on('join', function(room){
    socket.leave(currentRoom[socket.id]);
    joinRoom(socket,room.newRoom)
  })
}
/**
 * 用户端口连接
 * @param {*} socket 
 */
function handleClientDisconnection(socket){
  socket.on('disconnect', function(){
    var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    delete namesUsed[nameIndex];
    delete nickNames(socket.id);
  })
}