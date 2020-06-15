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
				<p>${users[user].isReady ? 'Ready' : 'Not Ready'}</p>
			</div>`;
		document.getElementById('player_list').appendChild(div);
	}
});

function imReady() {
	socket.emit('ready');
}
