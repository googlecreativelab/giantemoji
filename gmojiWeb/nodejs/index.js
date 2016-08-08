// Copyright 2016 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//         http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('../src'));

app.get('/', function(req, res){
  res.sendfile('../src/index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('eval', function(msg){
      io.emit('evalClient', msg);
  });

  socket.on('statsClient', function(msg){
      io.emit('stats', msg);
  })
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
