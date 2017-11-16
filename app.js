var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var MongoClient = require('mongodb').MongoClient;

var app = express();
app.use(cookieParser());
app.use(bodyParser.json());
app.use(express.static('./public'));

var mongodb;
var DB_URL = 'mongodb://127.0.0.1:27017/werewolf_by_jser';
MongoClient.connect(DB_URL, function (err, db) {
  mongodb = db;
});

app.post('/signup', function (req, res) {
  var userName = req.body.userName;
  var password = req.body.password;
  var rePassword = req.body.rePassword;

  if (userName.length < 4) {
    res.json({message: '用户名长度不够'});
    return;
  }

  if (password !== rePassword) {
    res.json({message: '两次输入的密码不一致'});
    return;
  }

  var User = mongodb.collection('user');
  User.find({userName: userName}).toArray(function (err, users) {
    if (users.length !== 0) {
      res.json({message: '用户名已被使用'});
      return;
    }
    User.insert({ userName: userName, password: password }, function (err) {
      res.json({message: '注册成功'});
    });
  });
});

app.post('/signin', function (req, res) {
  var userName = req.body.userName;
  var password = req.body.password;

  var User = mongodb.collection('user');
  User.find({ userName: userName }).toArray(function (err, users) {
    if (users.length === 0) {
      res.json({message: '登录失败'});
      return;
    }

    if (users[0].password === password) {
      res.cookie('userId', users[0]._id);
      res.json({message: '登录成功'});
      return;
    }

    res.json({message: '登录失败'});
  });
});

app.post('/createRoom', function (req, res) {
  var userId = req.cookies.userId;
  var room = req.body;

  if (!userId) {
    res.json({message: '请登录后再操作'});
    return;
  }

  getRoomNo(function (roomNo) {
    room.no = roomNo;
    room.createdAt = new Date();
    room.creatorId = userId;

    var Room = mongodb.collection('room');

    Room.insert(room, function (err, dbRoom) {
      res.json({message: 'ok', roomNo: roomNo});
    });
  });
});

app.listen(3000, function () {
  console.log('Server startup, listening port 3000');
});


function getRoomNo(callback) {
  var roomNo = Math.random().toString().substr(2, 4);

  var Room = mongodb.collection('room');
  Room.findOne({ no: roomNo }, function (err, dbRoom) {
    if (dbRoom) {
      getRoomNo(callback);
      return;
    }
    callback(roomNo);
  });
}
