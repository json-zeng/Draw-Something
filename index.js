/**
 * Created by Pzyme on 15/3/17.
 * Author Pzy.me (pzyme@outlook.com)
 */

var express = require("express");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

server.listen(port, function () {
    console.log('Server listening at port %d', port);
});

app.use(express.static(__dirname + '/public'));
app.set('view engine', 'jade');
app.set('views', './views');


app.get('/', function (req, res) {
    res.render('index', { title: 'Hey', message: 'Hello there!'});
});

var words = ['Apple','Banana','Lichee','Lemon','Pear','Tangerine','Watermelon'],
    clients = [],
    users = [],
    painter = null,
    correct_word = null;

io.on('connection', function(socket){
    console.log("user connect..."+socket.id);

    socket.on('join', function(data){
        if(painter === null) painter = data;
        users.push({username:data,"socketid":socket.id});

        socket.broadcast.emit('join', {
            username: data
        });
        socket.emit("refresh user",users);

        socket.broadcast.emit("set painter",{
            painter : painter
        });
        if(correct_word === null ) {
            correct_word = words[Math.floor(Math.random() * words.length) + 1];
        }
        socket.emit("set painter",{
            painter : painter,
            words : correct_word
        });

        //io.sockets.socket(socket.id)
    });

    socket.on("chat message",function(data,username){
        var _data = {
            username : username,
            content : data
        };

        socket.broadcast.emit('chat message', _data);
        socket.emit("chat message",_data);

        if(data == correct_word) {
            socket.broadcast.emit("bingo",_data);
            socket.emit("bingo",_data);

            painter = username;
            correct_word = words[Math.floor(Math.random() * words.length) + 1];
            socket.emit("set painter",{
                painter : painter,
                words : correct_word
            });
            socket.broadcast.emit("set painter",{
                painter : painter
            });
        }
    });

    socket.on("drawing",function(x,y){
        socket.broadcast.emit("drawing",{
            x : x,
            y : y
        })
    });
    socket.on("draw end",function(){
        socket.broadcast.emit("draw end",{})
    });

    socket.on("disconnect",function(){
       console.log('user disconnect...'+socket.id);

        var username = '',new_user = [];
        for(var i in users) {
            if(users[i].socketid == socket.id) {
                username = users[i].username;
                delete users[i];
                break;
            }
        }

        for(var i in users) {
            if(users[i] == null) continue;

            new_user.push(users[i]);
        }

        users = new_user;
        delete new_user;

        console.log(users);

        socket.broadcast.emit("user leave",{
            username : username
        })
    });
});