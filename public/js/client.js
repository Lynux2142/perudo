const socket = io();
const playerForm = document.getElementById('player_list');

const urlParams = new URLSearchParams(window.location.search);

socket.on('connect', function() {
	const username = urlParams.get('username');
	const regex = RegExp('[A-Za-z0-9]*');
	const match = username.match(regex);
	console.log(match);

	if (match != '') {
		socket.emit('add_user', match);
	}
});

socket.on('update_player', function(users, playerTurn) {
	document.getElementById('player_list').innerHTML =
	`<div class="player_list_title">
		<div class="player_name">
			<p>Username</p>
		</div>
		<div class="dice_list">
			<p>Dice</p>
		</div>
	</div>`;
	for (var i = 0; i < users.length; ++i) {
		const div = document.createElement('div');
		const selector = (playerTurn == i) ? '=>	' : '';
		if (users[i].nbDice == 0) { div.style.backgroundColor = 'indianred'; }
		div.classList.add('player');
		div.innerHTML = `<div class="player_name">
				<p>${selector}${users[i].username}</p>
			</div>
			<div class="dice_list">
				<p>${users[i].nbDice}</p>
			</div>`;
		document.getElementById('player_list').appendChild(div);
	}
});

socket.on('update_current_player', function(current_player) {
	var dice_list = '<p>';
	for (i in current_player.diceList) {
		var dice = current_player.diceList[i];
		dice_list += ((dice !== 1) ? dice : 'PACO') + ' ';
	}
	document.getElementById('dice_set').innerHTML = dice_list + '</p>';
});

socket.on('new_round_begin', function(password) {
	socket.emit('roll_dice', password);
});

socket.on('yourTurn', function() {
	document.getElementById('buttons').style.display = 'block';
});

socket.on('hide_controls', function() {
	document.getElementById('buttons').style.display = 'none';
});

socket.on('message', function(message) {
	document.getElementById('game_message').innerHTML = '<p>' + message + '</p>';
});

socket.on('add_message', function(message) {
	document.getElementById('game_message').innerHTML += '<p>' + message + '</p>';
});

socket.on('new_game', function() {
	document.getElementById('ready').style.display = 'block';
});

function imReady() {
	socket.emit('ready');
	document.getElementById('ready').style.display = 'none';
	document.getElementById('game_message').innerHTML = '';
}

function bet() {
	const dice_amount = document.getElementById('diceAmount').value;
	const dice_value = document.getElementById('diceValue').value;
	socket.emit('bet', dice_amount, dice_value);
}

function dudo() {
	socket.emit('dudo');
}

function calza() {
	socket.emit('calza');
}
