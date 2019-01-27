const http = require('http');
const fs = require('fs');
const path = require('path');

const mime = require('mime');
const chatServer = require("./lib/chat_server")

var cache = {};
//404
function send404(res){
  res.writeHead(404, {'Content-Type':'text/plain'});
  res.write('Error 404: resource not found');
  res.end();
}
//发送文件
function sendFile(res, filePath, fileContents){
  res.writeHead(
    200,
    {
      "Content-Type":mime.lookup(path.basename(filePath))
    }
  );
  res.end(fileContents);
}
//提供静态文件服务
function serverStatic(res, cache, absPath){
  if(cache[absPath]){
    sendFile(res, absPath, cache[absPath]);
  }else{
    fs.exists(absPath,(exists)=>{
      if(exists){
        fs.readFile(absPath,(err, data)=>{
          if(err){
            send404(res);
          }else{
            cache[absPath] = data;
            sendFile(res, absPath, data);
          }
        })
      }else{
        send404(res);
      }
    })
  }
}
//创建http服务器
const server = http.createServer((req, res)=>{
  var filePath = false;
  
  if(req.url == '/'){
    filePath = 'public/index.html'
  }else{
    filePath = 'public/'+req.url;
  }

  var absPath = './'+filePath
  serverStatic(res, cache, absPath);
})

server.listen(3000, function(){
  console.log("server listening on port 3000");
})
chatServer.listen(server);
