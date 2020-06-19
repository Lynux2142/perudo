class User {
	constructor(id, username, nbDice, diceList, isReady) {
		this.id = id;
		this.username = username;
		this.nbDice = nbDice;
		this.diceList = diceList;
		this.isReady = isReady;
	}
	giveDice() {
		this.diceList = [];
		for (var i = 0; i < this.nbDice; ++i) {
			this.diceList.push(rollDice());
		}
	}
}

function isAllReady(users) {
	for (i in users) {
		if (users[i].isReady !== true) { return false; }
	}
	return true;
}

function rollDice() {
	return (Math.floor(Math.random() * Math.floor(6) + 1));
}

function getUser(users, id) {
	for (var i = 0; i < users.length; ++i)
		if (users[i].id === id) { return i; }
	return null;
}

module.exports = { User, isAllReady, getUser }
