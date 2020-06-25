const socket = io();
const urlParams = new URLSearchParams(window.location.search);

socket.on('connect', function() {
	const username = urlParams.get('username');
	const regex = RegExp('[A-Za-z0-9]+');
	const userMatch = username.match(regex);

	if (userMatch) {
		socket.emit('add_user', userMatch);
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
	users.forEach(user => {
		const div = document.createElement('div');
		const selector = (playerTurn == i) ? '=>	' : '';
		if (user.nbDice == 0) { div.style.backgroundColor = 'indianred'; }
		div.classList.add('player');
		div.innerHTML = `<div class="player_name">
				<p>${selector}${user.username}</p>
			</div>
			<div class="dice_list">
				<p>${user.nbDice}</p>
			</div>`;
		document.getElementById('player_list').appendChild(div);
	});
});

socket.on('update_current_player', function(current_player) {
	var dice_list = '<p>';
	current_player.diceList.forEach(diceValue => {
		dice_list += ((diceValue !== 1) ? diceValue : 'PACO') + ' ';
	});
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
	const dice_amount = parseInt(document.getElementById('diceAmount').value, 10);
	const dice_value = parseInt(document.getElementById('diceValue').value, 10);
	socket.emit('bet', dice_amount, dice_value);
}

function dudo() {
	socket.emit('dudo');
}

function calza() {
	socket.emit('calza');
}
