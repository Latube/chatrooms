const socketio = require("socket.io");
var io;

var guestNmber = 1;   //用户昵称计数器
var nickNames = {};   //昵称
var namesUsed = [];   //被使用的用户名
var currentRoom = {}; //当前房间号

exports.listen = function (server) {
  io = socketio.listen(server);
  io.set('log level1', 1);

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
//分配昵称
function assignGuestName(socket, guestNmber, nickNames, namesUsed) {
  var name = 'Guest' + guestNmber;
  nickNames[socket.id] = name;
  socket.emit('nameResult',
    {
      success: true,
      name: name
    })
  namesUsed.push(name);
  return guestNmber + 1;
}
//进入聊天室
function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;
  socket.emit('joinResult', { room: room });
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
    socket.emit('message', { text: usersInRoomsSummary });
  }
}