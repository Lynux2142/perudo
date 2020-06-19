const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { User, isAllReady, getUser } = require('./utils/game.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const IP = require('ip').address();
const PORT = 4242 || process.env.PORT;
const BEGIN_DICE = 5;

app.use(express.static(path.join(__dirname, 'public')));

var users = [];
var gameInProgress = false;
var playerTurn = 0;
var previousPlayerTurn = 0;
var actualDiceAmount = 0;
var actualDiceValue = 0;

io.on('connection', function(socket) {
	console.log('New connection')

	socket.on('add_user', function(username) {
		users.push(new User(socket.id, username, 0, [], false));
		io.emit('update_player', users);
	});

	socket.on('ready', function() {
		users[getUser(users, socket.id)].isReady = true;
		users[getUser(users, socket.id)].nbDice = gameInProgress ? 0 : BEGIN_DICE;
		io.emit('update_player', users);
		if (isAllReady(users) == true) {
			gameInProgress = true;
			io.emit('new_round_begin');
			nextRound();
		}
	});

	socket.on('roll_dice', function() {
		if (users[getUser(users, socket.id)].nbDice !== 0) {
			users[getUser(users, socket.id)].giveDice();
		}
		socket.emit('update_current_player', users[getUser(users, socket.id)]);
	});

	socket.on('bet', function(dice_amount, dice_value) {

		console.log(dice_value + '	' + Math.ceil(actualDiceAmount / 2));
		if ((dice_value == 1 && dice_amount >= (Math.ceil(actualDiceAmount / 2))) ||
			((dice_amount >= actualDiceAmount || dice_value >= actualDiceValue) &&
			!(dice_amount == actualDiceAmount && dice_value == actualDiceValue))) {
			socket.emit('message', "You bet there are at least " + dice_amount +
				((dice_value == 1) ? ' PACO' : ' dice of ' + dice_value));
			socket.broadcast.emit('message', users[getUser(users, socket.id)].username +
				" bet there are at least " + dice_amount +
				((dice_value == 1) ? ' PACO' : (' dice of ' + dice_value)));
			actualDiceAmount = dice_amount;
			actualDiceValue = dice_value;
			nextPlayerTurn();
			socket.emit('hide_controls');
			nextRound();
		} else {
			socket.emit('add_message', "You cannot do this action");
		}
	});

	socket.on('dudo', function() {
		var realDiceAmount = 0;
		var winner;

		socket.broadcast.emit('message', users[getUser(users, socket.id)].username + " thinks " + users[previousPlayerTurn].username + " is lying.");
		for (user in users) {
			for (dice in users[user].diceList) {
				var diceValue = users[user].diceList[dice];
				if (diceValue == actualDiceValue || diceValue == 1) {
					++realDiceAmoun;
				}
			}
		}
		if (actualDiceAmount <= realDiceAmount) {
			socket.emit('message', 'There are ' + realDiceAmount + ' dice of ' + actualDiceValue + '. You lost');
			socket.broadcast.emit('message', 'There are ' + realDiceAmount + ' dice of ' + actualDiceValue + '. ' + users[playerTurn].username + ' lost');
			--users[playerTurn].nbDice;
			winner = users[previousPlayerTurn].username;
		} else {
			socket.emit('message', 'There are ' + realDiceAmount + ' dice of ' + actualDiceValue + '. you won')
			socket.broadcast.emit('message', 'There are ' + realDiceAmount + ' dice of ' + actualDiceValue + '. ' + users[playerTurn].username + ' won')
			--users[previousPlayerTurn].nbDice;
			winner = users[playerTurn].username;
		}
		actualDiceAmount = 0;
		actualDiceValue = 0;
		if (isWin()) {
			io.emit('message', 'There are ' + realDiceAmount + ' dice of ' + actualDiceValue + '. ' + winner + ' won the game !!');
			restartGame();
		} else {
			io.emit('update_player', users);
			nextPlayerTurn();
			socket.emit('hide_controls');
			io.emit('new_round_begin');
			nextRound();
		}
	});

	socket.on('disconnect', function() {
		users.splice(getUser(users, socket.id), 1);
		io.emit('update_player', users);
	});
});

function nextRound() {
	io.to(users[playerTurn].id).emit('yourTurn');
}

function nextPlayerTurn() {
	previousPlayerTurn = playerTurn;
	playerTurn = (playerTurn < users.length - 1) ? playerTurn + 1 : 0;
	while (users[playerTurn].nbDice === 0) {
		playerTurn = (playerTurn < users.length - 1) ? playerTurn + 1 : 0;
	}
}

function isWin() {
	var playerAlreadyInGame = 0;

	for (user in users) {
		if (users[user].nbDice !== 0) { ++playerAlreadyInGame; }
	}
	return (playerAlreadyInGame !== 1) ? false : true;
}

function restartGame() {
	for (user in users) {
		users[user].nbDice = 0;
		users[user].diceList = [];
		users[user].isReady = false;
	}
	io.emit('new_game');
	io.emit('update_player', users);
	io.emit('hide_controls');
	for (user in users) {
		io.to(users[user].id).emit('update_current_player', users[user]);
	}
	gameInProgress = false;
}

server.listen(PORT, IP, function() {
	console.log(`Server is listening on ${IP}:${PORT}`);
});
