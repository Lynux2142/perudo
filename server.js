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
		io.emit('update_player', users, playerTurn);
	});

	socket.on('ready', function() {
		const user = getUser(users, socket.id);

		if (user != null) {
			users[user].isReady = true;
			users[user].nbDice = gameInProgress ? 0 : BEGIN_DICE;
			io.emit('update_player', users, playerTurn);
			if (isAllReady(users) == true) {
				playerTurn = Math.floor(Math.random() * Math.floor(users.length));
				gameInProgress = true;
				io.emit('new_round_begin');
				nextRound();
			}
		}
	});

	socket.on('roll_dice', function() {
		const user = getUser(users, socket.id);
		if (user != null) {
			if (users[user].nbDice !== 0) {
				users[user].giveDice();
			}
			socket.emit('update_current_player', users[user]);
		}
	});

	socket.on('bet', function(dice_amount, dice_value) {
		const user = getUser(users, socket.id);
		if (user != null) {
			if ((dice_value == 1 && dice_amount >= (Math.ceil(actualDiceAmount / 2)) && actualDiceValue != 1) ||
				(((dice_amount > actualDiceAmount && dice_value > actualDiceValue) ||
				(dice_amount == actualDiceAmount && dice_value > actualDiceValue) ||
				(dice_amount > actualDiceAmount && dice_value == actualDiceValue)) &&
				actualDiceValue != 1) ||
				(actualDiceValue == 1 && dice_amount > actualDiceAmount && dice_value == 1)) {
				socket.emit('message', "You bet there are at least " + dice_amount +
					((dice_value == 1) ? ' PACO' : ' dice of ' + dice_value));
				socket.broadcast.emit('message', users[user].username +
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
		}
	});

	socket.on('dudo', function() {
		const user = getUser(users, socket.id);
		const previousPlayerUsername = users[previousPlayerTurn].username;
		var result;
		var realDiceAmount;
		var winner;

		if (user != null) {
			if (actualDiceValue == 0 || actualDiceAmount == 0) {
				socket.emit('add_message', "You cannot do this action");
			} else {
				socket.emit('add_message', "You thinks " + previousPlayerUsername +
					" is lying.");
				socket.broadcast.emit('message', users[user].username +
					" thinks " + previousPlayerUsername + " is lying.");
				realDiceAmount = countDice();
				if (actualDiceAmount <= realDiceAmount) {
					result = ' lost';
					--users[playerTurn].nbDice;
					if (users[playerTurn].nbDice == 0) { nextPlayerTurn(); }
					winner = previousPlayerUsername;
				} else {
					result = ' won';
					--users[previousPlayerTurn].nbDice;
					winner = users[playerTurn].username;
					playerTurn = (users[previousPlayerTurn].nbDice > 0) ? previousPlayerTurn : playerTurn;
				}
				socket.emit('add_message', 'There are ' + realDiceAmount + ' dice of ' +
					((actualDiceValue == 1) ? 'PACO' : actualDiceValue) + '. You' + result);
				socket.broadcast.emit('add_message', 'There are ' + realDiceAmount + ' dice of ' +
					((actualDiceValue == 1) ? 'PACO' : actualDiceValue) + '. ' + users[playerTurn].username + result);
				if (isWin()) {
					io.emit('message', 'There are ' + realDiceAmount + ' dice of ' +
						((actualDiceValue == 1) ? 'PACO' : actualDiceValue) + '. ' + winner + ' won the game !!');
					restartGame();
				} else {
					actualDiceAmount = 0;
					actualDiceValue = 0;
					io.emit('update_player', users, playerTurn);
					socket.emit('hide_controls');
					io.emit('new_round_begin');
					nextRound();
				}
			}
		}
	});

	socket.on('calza', function() {
		const user = getUser(users, socket.id);
		const previousPlayerUsername = users[previousPlayerTurn].username;
		var result;
		var realDiceAmount;
		var winner;

		if (user != null) {
			if (actualDiceAmount == 0 || actualDiceValue == 0) {
				socket.emit('add_message', "You cannot do this action");
			} else {
				socket.emit('add_message', 'You thinks ' + previousPlayerUsername + "'s bet is right.");
				socket.broadcast.emit('message', users[user].username +
					" thinks " + previousPlayerUsername + "'s bet is right.");
				realDiceAmount = countDice();
				if (actualDiceAmount == realDiceAmount) {
					result = ' won';
					++users[playerTurn].nbDice;
					nextPlayerTurn();
				} else {
					result = ' lost';
					--users[playerTurn].nbDice;
					if (users[playerTurn].nbDice == 0) { nextPlayerTurn(); }
					winner = previousPlayerUsername;
				}
				socket.emit('add_message', 'There are ' + realDiceAmount + ' dice of ' +
					actualDiceValue + '. you' + result)
				socket.broadcast.emit('add_message', 'There are ' + realDiceAmount + ' dice of '
					+ actualDiceValue + '. ' + users[playerTurn].username + result)
				if (isWin()) {
					io.emit('add_message', 'There are ' + realDiceAmount + ' dice of ' +
						actualDiceValue + '. ' + winner + ' won the game !!');
					restartGame();
				} else {
					actualDiceAmount = 0;
					actualDiceValue = 0;
					io.emit('update_player', users, playerTurn);
					socket.emit('hide_controls');
					io.emit('new_round_begin');
					nextRound();
				}
			}
		}
	});

	socket.on('disconnect', function() {
		const user = getUser(users, socket.id);
		if (user != null) {
			username = users[user].username;
			users.splice(user, 1);
			if (gameInProgress && isWin()) {
				var winner;
				for (i in users) {
					if (users[i].nbDice != 0) { winner = users[i].username }
				}
				io.emit('message', username + ' left the game. ' + winner + ' won the game !!');
				restartGame();
			}
			io.emit('update_player', users, playerTurn);
		}
	});
});

function countDice() {
	var realDiceAmount = 0;

	for (i in users) {
		for (j in users[i].diceList) {
			var diceValue = users[i].diceList[j];
			if (diceValue == actualDiceValue || diceValue == 1) {
				++realDiceAmount;
			}
		}
	}
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

	for (i in users) {
		if (users[i].nbDice !== 0) { ++playerAlreadyInGame; }
	}
	return (playerAlreadyInGame !== 1) ? false : true;
}

function restartGame() {
	for (i in users) {
		users[i].nbDice = 0;
		users[i].diceList = [];
		users[i].isReady = false;
	}
	actualDiceAmount = 0;
	actualDiceValue = 0;
	io.emit('new_game');
	io.emit('update_player', users, playerTurn);
	io.emit('hide_controls');
	for (i in users) {
		io.to(users[i].id).emit('update_current_player', users[i]);
	}
	gameInProgress = false;
}

server.listen(PORT, IP, function() {
	console.log(`Server is listening on ${IP}:${PORT}`);
});
