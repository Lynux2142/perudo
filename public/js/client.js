const socket = io();
const playerForm = document.getElementById('player_list');

const urlParams = new URLSearchParams(window.location.search);

username = urlParams.get('username');

socket.on('connect', function() {
	socket.emit('add_user', username);
});

socket.on('update_player', function(users) {
	document.getElementById('player_list').innerHTML =
	`<div class="player">
		<div class="player_name">
			<p>username</p>
		</div>
		<div class="dice_list">
			<p>dice</p>
		</div>
	</div>`;
	for (user in users) {
		const div = document.createElement('div');
		div.classList.add('player');
		div.innerHTML = `<div class="player_name">
				<p>${user}</p>
			</div>
			<div class="dice_list">
				<p>${users[user].nbDice}</p>
			</div>`;
		document.getElementById('player_list').appendChild(div);
	}
});

socket.on('update_current_player', function(current_player) {
	document.getElementById('dice_set').innerHTML =
	`<p>${current_player.diceList}</p>`;
});

socket.on('show_dice_set', function() {
	document.getElementById('dice_set').style.display = 'block';
});

function imReady() {
	socket.emit('ready');
	document.getElementById('ready').style.display = "none";
}
