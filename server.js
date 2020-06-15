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
	});

	socket.on('ready', function() {
		users[socket.username].isReady = true;
		io.emit('update_player', users);
		if (isAllReady(users) == true) {
			for (user in users) { users[user].giveDice(); }
			console.log(users);
		}
	});

	socket.on('disconnect', function() {
		delete users[socket.username];
		io.emit('message', 'An user has left the game');
	});
});

server.listen(PORT, IP, function() {
	console.log(`Server is listening on ${IP}:${PORT}`);
});
