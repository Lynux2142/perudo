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
var gameInProgress = false;

io.on('connection', function(socket) {
	console.log('New connection')

	socket.on('add_user', function(username) {
		users[socket.id] = new User(username, 0, [], false);
		io.emit('update_player', users);
		socket.emit('update_current_player', users[socket.id]);
	});

	socket.on('ready', function() {
		users[socket.id].isReady = true;
		users[socket.id].nbDice = gameInProgress ? 0 : BEGIN_DICE;
		io.emit('update_player', users);
		if (isAllReady(users) == true) {
			gameInProgress = true;
			io.emit('game_begin');
			startGame(users);
		}
	});

	socket.on('roll_dice', function() {
		if (users[socket.id].diceList.length === 0) {
			users[socket.id].giveDice();
		}
		socket.emit('update_current_player', users[socket.id]);
	});

	socket.on('disconnect', function() {
		delete users[socket.id];
		io.emit('update_player', users);
		io.emit('message', 'An user has left the game');
	});
});

function startGame(users) {
	for (user in users) {
		io.to(user).emit('yourTurn');
		break;
	}
	//socket.emit('yourTurn');
	//io.sockets.connected[].emit('yourTurn');
}

server.listen(PORT, IP, function() {
	console.log(`Server is listening on ${IP}:${PORT}`);
});
