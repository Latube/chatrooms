var http = require('http');
var fs = require('fs');
var path = require('path');
var mime = require('mime');
var chatServer = require('./lib/chat_server');
//cache 用来缓存文件内容的对象
var cache = {};

/**
 * 
 * @description: 所请求的文件不存在时发送404错误
 */
function send404(response) {
  response.writeHead(404, {
    'content-type': 'text/plain'
  });
  response.write('Error 404: resource not found.');
  response.end();
}
/**
 * @description 提供文件数据服务
 * @param {*} response 响应
 * @param {*} filePath 文件路径
 * @param {*} fileContents 文件内容
 */
function sendFile(response, filePath, fileContents) {
  response.writeHead(200, {
    "content-type": mime.lookup(path.basename(filePath))
  });
  response.end(fileContents);
}
/**
 * @description 提供静态文件服务
 * @param {*} response 响应
 * @param {*} cache 缓存
 * @param {*} absPath 绝对路径
 */
function serverStatic(response, cache, absPath) {
  // 检查文件是否缓存在内存中
  if (cache[absPath]) {
    // 从内存中返回文件
    sendFile(response, filePath, fileContents);
  } else {
    // 检查文件是否存在
    fs.exists(absPath, function (exists) {
      if (exists) {
        // 从硬盘中读取文件
        fs.readFile(absPath, function (err, data) {
          if (err) {
            send404(response);
          } else {
            // 缓存文件
            cache[absPath] = data;
            // 从硬盘中读取文件并返回
            sendFile(response, absPath, data);
          }
        })
      } else {
        // 发送404响应
        send404(response);
      }
    });
  }
}
/**
 * @description 创建HTTP服务器
 */
var server = http.createServer(function (req, res) {
  var filePath = false;
  // 返回默认的HTML文件
  if (req.url == '/') {
    filePath = 'public/index.html';
  } else {
    // 将URL路径转换为文件的相对路径
    filePath = 'public' + req.url;
  }

  var absPath = './' + filePath;
  console.log(req.url);
  console.log(filePath);
  console.log(absPath);
  // 返回静态文件
  serverStatic(res, cache, absPath);
});

server.listen(3000, function () {
  console.log('Server listening on port 3000.');
});
chatServer.listen(server);