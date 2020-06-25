const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const { User, isAllReady, getUser } = require('./utils/game.js');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const IP = require('ip').address();
const PORT = process.env.PORT || 4242;
const BEGIN_DICE = 5;

app.use(express.static(path.join(__dirname, 'public')));

var users = [];
var usersNameList = {};
var gameInProgress = false;
var playerTurn = 0;
var previousPlayerTurn = 0;
var actualDiceAmount = 0;
var actualDiceValue = 0;

io.on('connection', function(socket) {
	console.log('New connection')

	socket.on('add_user', function(username) {
		if (!usersNameList[username]) {
			users.push(new User(socket.id, username, 0, [], false));
			usersNameList[username] = username;
			io.emit('update_player', users, playerTurn);
		}
	});

	socket.on('ready', function() {
		const user = getUser(users, socket.id);

		if (user != null) {
			user.isReady = true;
			user.nbDice = gameInProgress ? 0 : BEGIN_DICE;
			io.emit('update_player', users, playerTurn);
			if (isAllReady(users) === true) {
				playerTurn = Math.floor(Math.random() * Math.floor(users.length));
				gameInProgress = true;
				io.emit('new_round_begin', '2142');
				nextRound();
			}
		}
	});

	socket.on('roll_dice', function(password) {
		const user = getUser(users, socket.id);

		if (user != null && actualDiceAmount === 0 && actualDiceValue === 0 && password === '2142') {
			if (user.nbDice !== 0) {
				user.giveDice();
			}
			socket.emit('update_current_player', user);
		}
	});

	socket.on('bet', function(dice_amount, dice_value) {
		const user = getUser(users, socket.id);

		if (user != null && user === users[playerTurn]) {
			if ((dice_value === 1 && dice_amount >= (Math.ceil(actualDiceAmount / 2)) && actualDiceValue != 1) ||
				(((dice_amount > actualDiceAmount && dice_value > actualDiceValue) ||
				(dice_amount === actualDiceAmount && dice_value > actualDiceValue) ||
				(dice_amount > actualDiceAmount && dice_value === actualDiceValue)) &&
				actualDiceValue != 1) ||
				(actualDiceValue === 1 && dice_amount > actualDiceAmount && dice_value === 1)) {
				socket.emit('message', "You bet there are at least " + dice_amount +
					((dice_value === 1) ? ' PACO' : ' dice of ' + dice_value));
				socket.broadcast.emit('message', user.username +
					" bet there are at least " + dice_amount +
					((dice_value === 1) ? ' PACO' : (' dice of ' + dice_value)));
				actualDiceAmount = dice_amount;
				actualDiceValue = dice_value;
				nextPlayerTurn();
				socket.emit('hide_controls');
				nextRound();
			} else {
				socket.emit('add_message', "You cannot do this action");
			}
		}
	});

	socket.on('dudo', function() {
		const user = getUser(users, socket.id);
		const previousPlayerUsername = users[previousPlayerTurn].username;
		const playerUsername = users[playerTurn].username;
		var winner;
		var result;
		var realDiceAmount;

		if (user != null && user === users[playerTurn]) {
			if (actualDiceValue === 0 || actualDiceAmount === 0) {
				socket.emit('add_message', "You cannot do this action");
			} else {
				socket.emit('add_message', "You thinks " + previousPlayerUsername +
					" is lying.");
				socket.broadcast.emit('add_message', user.username +
					" thinks " + previousPlayerUsername + " is lying.");
				realDiceAmount = countDice();
				if (actualDiceAmount <= realDiceAmount) {
					result = ' lost';
					--users[playerTurn].nbDice;
					winner = previousPlayerUsername;
					if (users[playerTurn].nbDice === 0) { nextPlayerTurn(); }
				} else {
					result = ' won';
					--users[previousPlayerTurn].nbDice;
					winner = playerUsername;
					playerTurn = (users[previousPlayerTurn].nbDice > 0) ? previousPlayerTurn : playerTurn;
				}
				socket.emit('add_message', 'There are ' + realDiceAmount + ' dice of ' +
					((actualDiceValue === 1) ? 'PACO' : actualDiceValue) + '. You' + result);
				socket.broadcast.emit('add_message', 'There are ' + realDiceAmount + ' dice of ' +
					((actualDiceValue === 1) ? 'PACO' : actualDiceValue) + '. ' + playerUsername + result);
				if (isWin()) {
					io.emit('add_message', winner + ' won the game !!');
					restartGame();
				} else {
					actualDiceAmount = 0;
					actualDiceValue = 0;
					io.emit('update_player', users, playerTurn);
					socket.emit('hide_controls');
					io.emit('new_round_begin', '2142');
					nextRound();
				}
			}
		}
	});

	socket.on('calza', function() {
		const user = getUser(users, socket.id);
		const previousPlayerUsername = users[previousPlayerTurn].username;
		const playerUsername = users[playerTurn].username;
		var winner;
		var result;
		var realDiceAmount;

		if (user != null && user === users[playerTurn]) {
			if (actualDiceAmount === 0 || actualDiceValue === 0) {
				socket.emit('add_message', "You cannot do this action");
			} else {
				socket.emit('add_message', 'You thinks ' + previousPlayerUsername + "'s bet is right.");
				socket.broadcast.emit('add_message', user.username +
					" thinks " + previousPlayerUsername + "'s bet is right.");
				realDiceAmount = countDice();
				if (actualDiceAmount === realDiceAmount) {
					result = ' won';
					++users[playerTurn].nbDice;
					winner = playerUsername;
					nextPlayerTurn();
				} else {
					result = ' lost';
					--users[playerTurn].nbDice;
					winner = previousPlayerUsername;
					if (users[playerTurn].nbDice === 0) { nextPlayerTurn(); }
				}
				socket.emit('add_message', 'There are ' + realDiceAmount + ' dice of ' +
					actualDiceValue + '. you' + result)
				socket.broadcast.emit('add_message', 'There are ' + realDiceAmount + ' dice of '
					+ ((actualDiceValue === 1) ? 'PACO' : actualDiceValue) + '. ' + playerUsername + result)
				if (isWin()) {
					io.emit('add_message', winner + ' won the game !!');
					restartGame();
				} else {
					actualDiceAmount = 0;
					actualDiceValue = 0;
					io.emit('update_player', users, playerTurn);
					socket.emit('hide_controls');
					io.emit('new_round_begin', '2142');
					nextRound();
				}
			}
		}
	});

	socket.on('disconnect', function() {
		const user = getUser(users, socket.id);

		if (user != null) {
			username = user.username;
			users.splice(users.indexOf(user), 1);
			delete usersNameList[username];
			if (gameInProgress && isWin()) {
				var winner;
				users.forEach(user => {
					if (user.nbDice != 0) { winner = user.username }
				});
				io.emit('message', username + ' left the game. ' + winner + ' won the game !!');
				restartGame();
			}
			io.emit('update_player', users, playerTurn);
		}
	});
});

function countDice() {
	var realDiceAmount = 0;

	users.forEach(user => {
		user.diceList.forEach(diceValue => {
			if (diceValue === actualDiceValue || diceValue === 1) {
				++realDiceAmount;
			}
		});
	});
	return realDiceAmount;
}

function nextRound() {
	io.emit('update_player', users, playerTurn);
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

	users.forEach(user => {
		if (user.nbDice !== 0) { ++playerAlreadyInGame; }
	});
	return (playerAlreadyInGame !== 1) ? false : true;
}

function restartGame() {
	users.forEach(user => {
		user.nbDice = 0;
		user.diceList = [];
		user.isReady = false;
	});
	actualDiceAmount = 0;
	actualDiceValue = 0;
	io.emit('new_game');
	io.emit('update_player', users, playerTurn);
	io.emit('hide_controls');
	users.forEach(user => {
		io.to(user.id).emit('update_current_player', user);
	});
	gameInProgress = false;
}

server.listen(PORT, IP, function() {
	console.log(`Server is listening on ${IP}:${PORT}`);
});
