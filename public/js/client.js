const socket = io();
const playerForm = document.getElementById('player_list');

const urlParams = new URLSearchParams(window.location.search);

username = urlParams.get('username');

socket.on('connect', function() {
	socket.emit('add_user', username);
});

socket.on('update_player', function(users) {
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
		div.classList.add('player');
		div.innerHTML = `<div class="player_name">
				<p>${users[i].username}</p>
			</div>
			<div class="dice_list">
				<p>${users[i].nbDice}</p>
			</div>`;
		document.getElementById('player_list').appendChild(div);
	}
});

socket.on('update_current_player', function(current_player) {
	document.getElementById('dice_set').innerHTML =
	`<p>${current_player.diceList}</p>`;
});

socket.on('new_round_begin', function() {
	socket.emit('roll_dice');
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

function palifico() {
	console.log('palifico');
}
