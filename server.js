const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { User, isAllReady } = require('./utils/game.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const IP = require('ip').address();
const PORT = 4242 || process.env.PORT;
const BEGIN_DICE = 5;

app.use(express.static(path.join(__dirname, 'public')));

var users = {};

io.on('connection', function(socket) {
	console.log('New connection')

	socket.on('add_user', function(username) {
		socket.username = username;
		users[socket.username] = new User(socket.username, BEGIN_DICE, [], false);
		io.emit('update_player', users);
		socket.emit('update_current_player', users[socket.username]);
	});

	socket.on('ready', function() {
		users[socket.username].isReady = true;
		users[socket.username].giveDice();
		io.emit('update_player', users);
		socket.emit('update_current_player', users[socket.username]);
		if (isAllReady(users) == true) {
			console.log(users);
			io.emit('update_player', users);
			io.emit('show_dice_set');
		}
	});

	socket.on('disconnect', function() {
		delete users[socket.username];
		io.emit('update_player', users);
		io.emit('message', 'An user has left the game');
	});
});

server.listen(PORT, IP, function() {
	console.log(`Server is listening on ${IP}:${PORT}`);
});
