const socketio = require("socket.io");
const io;

var guestNmber = 1;
var nickNames = {};
var namesUsed = [];
var currentRoom = {};

exports.listen = function(server){
  io = socketio.listen(server);
  io.set('log level1',1);

  io.sockets.on('connection', function(socket){
    
  })
}