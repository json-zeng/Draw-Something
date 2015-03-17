/**
 * Created by Pzyme on 15/3/17.
 * Author Pzy.me (pzyme@outlook.com)
 */

var socket = io();

var connected = false;

function Stage(ctx) {
    this.ctx = ctx;
    this.position = [];
}

Stage.prototype.draw = function(x,y) {
    var ctx = this.ctx,position = this.position;

    position.push({"x":x,"y":y});

    ctx.moveTo(position[0].x,position[0].y);
    if(position.length > 1) {
        for(var i in position) {
            ctx.lineTo(position[i].x,position[i].y);
        }
    }
    ctx.stroke();
};
Stage.prototype.cleanPosition = function() {
    this.position = [];
};

function Chat() {
    this.userDiv = $("#user-list");
    this.userTemplate = [
        '<div id="{username}" class="user">',
        '{username}',
        '</div>'
    ].join('');
}
Chat.prototype.newMessage = function(message) {
    var html = [
        '<div class="msg">',
        '<span class="username">{username}</span>',
        ':<br>',
        '<span class="content">{content}</span>',
        '</div>'
    ].join('');

    var div = $("#chat-list");
    div.append(html.replace(/{username}/ig,message.username).replace(/{content}/ig,message.content));
    div.scrollTop(div.height());
};
Chat.prototype.newUser = function(username) {
    this.userDiv.append(this.userTemplate.replace(/{username}/ig,username));
};
Chat.prototype.removeUser = function(username) {
    this.userDiv.find("div#"+username).remove();
};
Chat.prototype.refreshUser = function(users) {
    this.userDiv.empty();
    log(users);
    for(var i in users) {
        if(users[i])
            this.userDiv.append(this.userTemplate.replace(/{username}/ig,users[i].username));
    }
};

function User(username) {
    this.username = username;
    this.painter = null;
    this.userlist = $("#user-list");
}
User.prototype.setPainter = function(painter) {
    $(".user").removeClass("painter");
    $("div#"+painter).addClass("painter");
};

function Util() {

}
Util.prototype.randstr = function(len) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    for( var i=0; i < len; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
};

$(document).ready(function(){
    var stage = $("#stage"),
        ctx = document.getElementById("stage").getContext("2d"),
        send = $("#send"),
        message = $("#message"),
        user_list = $("#user-list"),
        draging = false,
        username = $.cookie('username'),
        painter = $("#painter");



    ctx.beginPath();
    ctx.moveTo(0,0);

    var s = new Stage(ctx);
    var chat = new Chat();
    var util = new Util();

    if(!username) {
        username = util.randstr(5);
        $.cookie("username",username);
    }
    var user = new User(username);

    stage.on("mousedown",function() {
        draging = true;
    });
    stage.on("mouseup",function() {
        draging = false;
        s.cleanPosition();
        socket.emit("draw end");
    });
    stage.on("mousemove",function(e) {
        if(draging && user.username === user.painter) {
            var e=e||event;
            var x0=e.clientX;
            var x=x0-($(this).offset().left);

            var y0=e.clientY;
            var y=y0-($(this).offset().top);

            s.draw(x,y);

            socket.emit("drawing",x,y);
        }
    });

    send.on("click",function(){
        if(user.username == user.painter) {
            chat.newMessage({username:'system',content:'这次你不能参与'});
        }
        if(message.val() && user.username != user.painter) {
            socket.emit("chat message",message.val(),user.username);
        }
        message.val("");
    });

    socket.emit('join',user.username);
    $("#myname").html("我: "+user.username);


    socket.on('join',function(data){
        connected = true;
        chat.newUser(data.username);
    });

    socket.on("chat message",function(data){
        log(data);
        chat.newMessage(data);
    });

    socket.on("new user",function(){
        console.log("user joined.");
    });

    socket.on("user leave",function(data){
        chat.removeUser(data.username);
        log("user leave..."+data.username);
    });

    socket.on("refresh user",function(users){
        chat.refreshUser(users);
    });

    socket.on("draw start",function(x,y){

    });
    socket.on("drawing",function(data){
        s.draw(data.x,data.y)
    });
    socket.on("draw end",function(data){
        s.cleanPosition();
    });


    socket.on("set painter",function(data){
        user.setPainter(data.painter);
        user.painter = data.painter;
        $("#painter").html("现在轮到 "+ (user.painter == user.username ? '我' : user.painter)+" 画");

        if(user.username != user.painter) {
            $("#words").html("");
        } else {
            $("#words").html("画出这个物品:"+data.words);
        }

        log(data);
    });

    socket.on("bingo",function(data){
        log("bingo...");
        var msg = data.username == user.username ? " 恭喜你答对了啦" : ""+data.username+"答对了";
        chat.newMessage({username:'你',content:msg});
        alert(msg);
    });


    window.onkeydown = function() {
        var keycode = parseInt(window.event.keyCode);

        if(keycode === 13) {
            send.click();
        }
    };
});

function log(msg) {
    //console.log(msg);
}